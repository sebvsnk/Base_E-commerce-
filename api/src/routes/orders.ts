import { Router, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { generateOtpCode, hashOtp, timingSafeEqualHex } from "../lib/otp";
import { sendOtpEmail } from "../lib/mailer";
import { requireAuth, requireRole, requireGuestOrderToken, signGuestOrderToken } from "../middleware/auth";
import rateLimit from "express-rate-limit";

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many OTP requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
}); export const ordersRouter = Router();

const itemsSchema = z.array(
  z.object({
    productId: z.string().min(1),
    qty: z.number().int().min(1).max(999),
  })
).min(1);

async function computeTotal(items: { productId: string; qty: number }[]) {
  const ids = items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true } });
  if (products.length !== ids.length) throw new Error("Invalid products");

  const map = new Map(products.map(p => [p.id, p]));

  // Check stock
  for (const item of items) {
    const product = map.get(item.productId)!;
    if (product.stock < item.qty) {
      throw new Error(`Insufficient stock for product ${product.name}`);
    }
  }

  const total = items.reduce((acc, it) => acc + map.get(it.productId)!.price * it.qty, 0);

  return { products, map, total };
}

// CUSTOMER (logueado): crea orden
ordersRouter.post("/", requireAuth, async (req: Request, res) => {
  const parsed = z.object({ items: itemsSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(401).json({ message: "User not found" });

  const { items } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Re-fetch and lock products (or just check stock in transaction)
      // For simplicity, we'll trust computeTotal but we should ideally lock.
      // In Prisma, we can just update and check count, or read first.

      let computed;
      try { computed = await computeTotal(items); }
      catch (e: any) { throw new Error(e.message || "Invalid products"); }

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          userId: user.id,
          customerEmail: user.email,
          total: computed.total,
          items: {
            create: items.map(it => ({
              productId: it.productId,
              qty: it.qty,
              priceSnapshot: computed.map.get(it.productId)!.price,
            })),
          },
        },
        include: { items: true },
      });

      // 3. Decrement Stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        });
      }

      return order;
    });

    res.status(201).json(result);
  } catch (e: any) {
    return res.status(400).json({ message: e.message || "Could not create order" });
  }
});

// CUSTOMER: mis órdenes
ordersRouter.get("/me", requireAuth, async (req: Request, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// ADMIN/WORKER: listar todas
ordersRouter.get("/", requireAuth, requireRole("ADMIN", "WORKER"), async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

  const [total, orders] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({
      include: { items: { include: { product: true } }, user: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })
  ]);

  res.json({
    data: orders,
    meta: { total, page, limit, lastPage: Math.ceil(total / limit) }
  });
});

// ADMIN/WORKER: cambiar estado
ordersRouter.patch("/:id/status", requireAuth, requireRole("ADMIN", "WORKER"), async (req: Request, res) => {
  const parsed = z.object({ status: z.enum(["PENDING", "PAID", "CANCELLED"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });

  await prisma.auditLog.create({
    data: { actorId: req.user!.id, action: "ORDER_STATUS_UPDATE", entity: "Order", entityId: order.id, meta: { status: parsed.data.status } },
  });

  res.json(order);
});

// ===== GUEST: crear orden + enviar OTP =====
ordersRouter.post("/guest", otpLimiter, async (req, res) => {
  const parsed = z.object({
    customerEmail: z.string().email(),
    items: itemsSchema,
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { customerEmail, items } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let computed;
      try { computed = await computeTotal(items); }
      catch (e: any) { throw new Error(e.message || "Invalid products"); }

      const order = await tx.order.create({
        data: {
          userId: null,
          customerEmail,
          total: computed.total,
          items: {
            create: items.map(it => ({
              productId: it.productId,
              qty: it.qty,
              priceSnapshot: computed.map.get(it.productId)!.price,
            })),
          },
        },
      });

      // Decrement Stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        });
      }

      return order;
    });

    // OTP Logic (outside transaction to avoid locking too long, though ideally should be part of it if critical)
    // We'll do it after order creation.
    const order = result;

    const last = await prisma.orderOtp.findFirst({
      where: { orderId: order.id, email: customerEmail, consumedAt: null },
      orderBy: { lastSentAt: "desc" },
    });

    if (last) {
      const seconds = Math.floor((Date.now() - last.lastSentAt.getTime()) / 1000);
      if (seconds < 60) return res.status(429).json({ message: `Espera ${60 - seconds}s para reenviar`, orderId: order.id });
    }

    const code = generateOtpCode();
    await prisma.orderOtp.create({
      data: {
        orderId: order.id,
        email: customerEmail,
        codeHash: hashOtp(code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        lastSentAt: new Date(),
      },
    });

    await sendOtpEmail(customerEmail, code);

    res.status(201).json({ orderId: order.id, message: "Código enviado (10 min)" });

  } catch (e: any) {
    return res.status(400).json({ message: e.message || "Could not create order" });
  }
});

// Reenviar OTP
ordersRouter.post("/guest/resend", otpLimiter, async (req, res) => {
  const parsed = z.object({
    orderId: z.string().min(1),
    email: z.string().email(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });
  const { orderId, email } = parsed.data;

  const last = await prisma.orderOtp.findFirst({
    where: { orderId, email, consumedAt: null },
    orderBy: { lastSentAt: "desc" },
  });

  if (last) {
    const seconds = Math.floor((Date.now() - last.lastSentAt.getTime()) / 1000);
    if (seconds < 60) return res.status(429).json({ message: `Espera ${60 - seconds}s para reenviar` });
  }

  const code = generateOtpCode();
  await prisma.orderOtp.create({
    data: {
      orderId,
      email,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      lastSentAt: new Date(),
    },
  });

  await sendOtpEmail(email, code);
  res.json({ message: "Código reenviado" });
});

// Verificar OTP => token invitado
ordersRouter.post("/guest/verify", async (req, res) => {
  const parsed = z.object({
    orderId: z.string().min(1),
    email: z.string().email(),
    code: z.string().length(6),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { orderId, email, code } = parsed.data;

  const otp = await prisma.orderOtp.findFirst({
    where: { orderId, email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return res.status(404).json({ message: "No hay código activo" });
  if (otp.expiresAt.getTime() < Date.now()) return res.status(400).json({ message: "Código expirado" });
  if (otp.attempts >= 5) return res.status(429).json({ message: "Demasiados intentos. Reenvía un código." });

  const ok = timingSafeEqualHex(hashOtp(code), otp.codeHash);
  if (!ok) {
    await prisma.orderOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return res.status(401).json({ message: "Código incorrecto" });
  }

  await prisma.orderOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  const token = signGuestOrderToken(orderId, email);
  res.json({ token });
});

// Invitado: ver su orden con token
ordersRouter.get("/guest/:orderId", requireGuestOrderToken, async (req: Request, res) => {
  const orderId = req.params.orderId;
  if (req.guest!.orderId !== orderId) return res.status(403).json({ message: "Forbidden" });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.customerEmail !== req.guest!.email) return res.status(403).json({ message: "Forbidden" });

  res.json(order);
});

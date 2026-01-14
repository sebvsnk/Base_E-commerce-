import { Router, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
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

async function computeTotal(
  db: Prisma.TransactionClient | typeof prisma,
  items: { productId: string; qty: number }[]
) {
  const ids = items.map(i => i.productId);
  const products = await db.product.findMany({ where: { id: { in: ids }, isActive: true } });
  if (products.length !== ids.length) throw new Error("Invalid products");

  const map = new Map(products.map((p) => [p.id, p]));

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

async function cancelOrderWithRestock(
  tx: Prisma.TransactionClient,
  orderId: string,
  whereExtra: Record<string, unknown>,
  paymentStatus?: string
) {
  const current = await tx.order.findFirst({
    where: { id: orderId, ...whereExtra },
    include: { items: true },
  });

  if (!current) throw new Error("Order not found");
  if (current.status === "PAID") throw new Error("Paid orders cannot be cancelled");

  const updated = await tx.order.updateMany({
    where: { id: current.id, status: { notIn: ["CANCELLED", "PAID"] }, ...whereExtra },
    data: { status: "CANCELLED", ...(paymentStatus ? { paymentStatus } : {}) },
  });

  if (updated.count === 1) {
    for (const item of current.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      });
    }
  }

  const order = await tx.order.findUnique({ where: { id: current.id } });
  if (!order) throw new Error("Order not found");
  return order;
}

// CUSTOMER (logueado): crea orden
ordersRouter.post("/", requireAuth, async (req: Request, res) => {
  const parsed = z.object({ 
    items: itemsSchema,
    shippingAddress: z.record(z.any()).optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const user = await prisma.user.findUnique({ where: { run: req.user!.run } });
  if (!user) return res.status(401).json({ message: "User not found" });

  const { items, shippingAddress } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let computed;
      try { computed = await computeTotal(tx, items); }
      catch (e: unknown) { throw new Error((e as Error).message || "Invalid products"); }

      // 1. Decrement Stock safely (avoid race conditions)
      //    Each decrement is conditional (stock >= qty). If any fails => abort.
      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            stock: { gte: item.qty },
          },
          data: { stock: { decrement: item.qty } },
        });

        if (updated.count !== 1) {
          throw new Error("Insufficient stock");
        }
      }

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          userRun: user.run,
          customerEmail: user.email,
          total: computed.total,
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              qty: it.qty,
              priceSnapshot: computed.map.get(it.productId)!.price,
            })),
          },
          shippingAddress: shippingAddress ?? Prisma.JsonNull,
        },
        include: { items: true },
      });

      return order;
    });

    res.status(201).json(result);
  } catch (e: unknown) {
    return res.status(400).json({ message: (e as Error).message || "Could not create order" });
  }
});

// CUSTOMER: mis órdenes
ordersRouter.get("/me", requireAuth, async (req: Request, res) => {
  const orders = await prisma.order.findMany({
    where: { userRun: req.user!.run },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// CUSTOMER: cancelar mi orden (solo si no está pagada)
ordersRouter.post("/:id/cancel", requireAuth, async (req: Request, res) => {
  try {
    const order = await prisma.$transaction(async (tx) => {
      return cancelOrderWithRestock(tx, req.params.id, { userRun: req.user!.run }, "CANCELLED_BY_CUSTOMER");
    });

    await prisma.auditLog.create({
      data: {
        actorRun: req.user!.run,
        action: "ORDER_CANCEL",
        entity: "Order",
        entityId: order.id,
        meta: { by: "CUSTOMER" },
      },
    });

    res.json(order);
  } catch (e: unknown) {
    const msg = (e as Error).message || "Could not cancel order";
    if (msg === "Order not found") return res.status(404).json({ message: msg });
    return res.status(400).json({ message: msg });
  }
});

// ADMIN/WORKER: listar todas
ordersRouter.get("/", requireAuth, requireRole("ADMIN", "WORKER"), async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

  const [total, orders] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({
      include: { items: { include: { product: true } }, user: { select: { run: true, email: true, role: true } } },
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

  try {
    const desired = parsed.data.status;

    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      });

      if (!current) throw new Error("Order not found");

      // Prevent reopening a cancelled order (avoids stock inconsistencies)
      if (current.status === "CANCELLED" && desired !== "CANCELLED") {
        throw new Error("Cancelled orders cannot change status");
      }

      // If cancelling: do it idempotently and restock only once.
      if (desired === "CANCELLED") {
        const updated = await tx.order.updateMany({
          where: { id: current.id, status: { not: "CANCELLED" } },
          data: { status: "CANCELLED" },
        });

        // If already cancelled, no-op.
        if (updated.count === 1) {
          for (const item of current.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.qty } },
            });
          }
        }

        return tx.order.findUnique({ where: { id: current.id } });
      }

      // Non-cancel status update
      return tx.order.update({ where: { id: current.id }, data: { status: desired } });
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    await prisma.auditLog.create({
      data: { actorRun: req.user!.run, action: "ORDER_STATUS_UPDATE", entity: "Order", entityId: order.id, meta: { status: parsed.data.status } },
    });

    res.json(order);
  } catch (e: unknown) {
    const msg = (e as Error).message || "Could not update status";
    if (msg === "Order not found") return res.status(404).json({ message: msg });
    return res.status(400).json({ message: msg });
  }
});

// ===== GUEST: crear orden + enviar OTP =====
ordersRouter.post("/guest", otpLimiter, async (req, res) => {
  const parsed = z.object({
    customerEmail: z.string().email(),
    items: itemsSchema,
    shippingAddress: z.record(z.any()).optional()
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { customerEmail, items, shippingAddress } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let computed;
      try { computed = await computeTotal(tx, items); }
      catch (e: unknown) { throw new Error((e as Error).message || "Invalid products"); }

      // Decrement Stock safely (avoid race conditions)
      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            stock: { gte: item.qty },
          },
          data: { stock: { decrement: item.qty } },
        });

        if (updated.count !== 1) {
          throw new Error("Insufficient stock");
        }
      }

      const order = await tx.order.create({
        data: {
          userRun: null,
          customerEmail,
          total: computed.total,
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              qty: it.qty,
              priceSnapshot: computed.map.get(it.productId)!.price,
            })),
          },
          shippingAddress: shippingAddress ?? Prisma.JsonNull,
        },
      });

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

  } catch (e: unknown) {
    return res.status(400).json({ message: (e as Error).message || "Could not create order" });
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

// Invitado: cancelar su orden con token (solo si no está pagada)
ordersRouter.post("/guest/:orderId/cancel", requireGuestOrderToken, async (req: Request, res) => {
  const orderId = req.params.orderId;
  if (req.guest!.orderId !== orderId) return res.status(403).json({ message: "Forbidden" });

  try {
    const order = await prisma.$transaction(async (tx) => {
      return cancelOrderWithRestock(
        tx,
        orderId,
        { userRun: null, customerEmail: req.guest!.email },
        "CANCELLED_BY_GUEST"
      );
    });

    res.json(order);
  } catch (e: unknown) {
    const msg = (e as Error).message || "Could not cancel order";
    if (msg === "Order not found") return res.status(404).json({ message: msg });
    return res.status(400).json({ message: msg });
  }
});

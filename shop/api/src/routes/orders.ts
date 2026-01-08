import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { generateOtpCode, hashOtp, timingSafeEqualHex } from "../lib/otp";
import { sendOtpEmail } from "../lib/mailer";
import { requireAuth, requireRole, requireGuestOrderToken, signGuestOrderToken, type AuthRequest, type GuestRequest } from "../middleware/auth";

export const ordersRouter = Router();

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
  const total = items.reduce((acc, it) => acc + map.get(it.productId)!.price * it.qty, 0);

  return { products, map, total };
}

// CUSTOMER (logueado): crea orden
ordersRouter.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = z.object({ items: itemsSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(401).json({ message: "User not found" });

  const { items } = parsed.data;
  let computed;
  try { computed = await computeTotal(items); }
  catch { return res.status(400).json({ message: "Invalid products" }); }

  const order = await prisma.order.create({
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

  res.status(201).json(order);
});

// CUSTOMER: mis órdenes
ordersRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// ADMIN/WORKER: listar todas
ordersRouter.get("/", requireAuth, requireRole("ADMIN", "WORKER"), async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: { include: { product: true } }, user: { select: { id: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// ADMIN/WORKER: cambiar estado
ordersRouter.patch("/:id/status", requireAuth, requireRole("ADMIN", "WORKER"), async (req: AuthRequest, res) => {
  const parsed = z.object({ status: z.enum(["PENDING", "PAID", "CANCELLED"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });

  await prisma.auditLog.create({
    data: { actorId: req.user!.id, action: "ORDER_STATUS_UPDATE", entity: "Order", entityId: order.id, meta: { status: parsed.data.status } },
  });

  res.json(order);
});

// ===== GUEST: crear orden + enviar OTP =====
ordersRouter.post("/guest", async (req, res) => {
  const parsed = z.object({
    customerEmail: z.string().email(),
    items: itemsSchema,
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { customerEmail, items } = parsed.data;

  let computed;
  try { computed = await computeTotal(items); }
  catch { return res.status(400).json({ message: "Invalid products" }); }

  const order = await prisma.order.create({
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
});

// Reenviar OTP
ordersRouter.post("/guest/resend", async (req, res) => {
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
ordersRouter.get("/guest/:orderId", requireGuestOrderToken, async (req: GuestRequest, res) => {
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

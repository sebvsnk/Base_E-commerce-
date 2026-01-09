import { Router, Request } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminRouter = Router();

// All admin routes require ADMIN
adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, isActive: true, fullName: true, createdAt: true },
  });
  res.json(users);
});

adminRouter.post("/users", async (req: Request, res) => {
  const parsed = z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["ADMIN", "WORKER", "CUSTOMER"]).default("CUSTOMER"),
      fullName: z.string().min(2).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { email, password, role, fullName } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, role, fullName, isActive: true },
    select: { id: true, email: true, role: true, isActive: true, fullName: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: "USER_CREATE",
      entity: "User",
      entityId: user.id,
      meta: { email: user.email, role: user.role },
    },
  });

  res.status(201).json(user);
});

adminRouter.patch("/users/:id", async (req: Request, res) => {
  const parsed = z
    .object({
      role: z.enum(["ADMIN", "WORKER", "CUSTOMER"]).optional(),
      isActive: z.boolean().optional(),
      fullName: z.string().min(2).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: { id: true, email: true, role: true, isActive: true, fullName: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: "USER_UPDATE",
      entity: "User",
      entityId: user.id,
      meta: parsed.data,
    },
  });

  res.json(user);
});

adminRouter.post("/users/:id/reset-password", async (req: Request, res) => {
  const parsed = z.object({ password: z.string().min(6) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { passwordHash },
    select: { id: true, email: true, role: true, isActive: true, fullName: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: "USER_PASSWORD_RESET",
      entity: "User",
      entityId: user.id,
      meta: { email: user.email },
    },
  });

  res.json({ ok: true });
});

adminRouter.get("/audits", async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  const audits = await prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { id: true, email: true, role: true } } },
  });

  res.json(audits);
});

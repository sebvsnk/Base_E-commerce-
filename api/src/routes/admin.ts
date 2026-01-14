import { Router, Request } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { cleanRun, isValidRun } from "../lib/run-validator";

export const adminRouter = Router();

// All admin routes require ADMIN
adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { run: true, email: true, role: true, isActive: true, fullName: true, createdAt: true },
  });
  res.json(users);
});

adminRouter.post("/users", async (req: Request, res) => {
  const parsed = z
    .object({
      run: z.string().min(8),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["ADMIN", "WORKER", "CUSTOMER"]).default("CUSTOMER"),
      fullName: z.string().min(2).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { run, email, password, role, fullName } = parsed.data;

  // Validate Chilean RUN
  if (!isValidRun(run)) {
    return res.status(400).json({ message: "Invalid RUN" });
  }

  const cleanedRun = cleanRun(run);

  const existsEmail = await prisma.user.findUnique({ where: { email } });
  if (existsEmail) return res.status(409).json({ message: "Email already exists" });

  const existsRun = await prisma.user.findUnique({ where: { run: cleanedRun } });
  if (existsRun) return res.status(409).json({ message: "RUN already exists" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { run: cleanedRun, email, passwordHash, role, fullName, isActive: true },
    select: { run: true, email: true, role: true, isActive: true, fullName: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      actorRun: req.user!.run,
      action: "USER_CREATE",
      entity: "User",
      entityId: user.run,
      meta: { email: user.email, role: user.role },
    },
  });

  res.status(201).json(user);
});

adminRouter.patch("/users/:run", async (req: Request, res) => {
  const parsed = z
    .object({
      role: z.enum(["ADMIN", "WORKER", "CUSTOMER"]).optional(),
      isActive: z.boolean().optional(),
      fullName: z.string().min(2).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const user = await prisma.user.update({
    where: { run: req.params.run },
    data: parsed.data,
    select: { run: true, email: true, role: true, isActive: true, fullName: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      actorRun: req.user!.run,
      action: "USER_UPDATE",
      entity: "User",
      entityId: user.run,
      meta: parsed.data,
    },
  });

  res.json(user);
});

adminRouter.post("/users/:run/reset-password", async (req: Request, res) => {
  const parsed = z.object({ password: z.string().min(6) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.update({
    where: { run: req.params.run },
    data: { passwordHash },
    select: { run: true, email: true, role: true, isActive: true, fullName: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      actorRun: req.user!.run,
      action: "USER_PASSWORD_RESET",
      entity: "User",
      entityId: user.run,
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
    include: { actor: { select: { run: true, email: true, role: true } } },
  });

  res.json(audits);
});

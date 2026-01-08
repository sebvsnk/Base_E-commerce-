import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth";

export const productsRouter = Router();

// Público: solo activos
productsRouter.get("/", async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(products);
});

// Admin/Worker: ver todos (activos e inactivos)
productsRouter.get("/admin/all", requireAuth, requireRole("ADMIN", "WORKER"), async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  res.json(products);
});

// Crear producto (Admin/Worker)
productsRouter.post("/", requireAuth, requireRole("ADMIN", "WORKER"), async (req: AuthRequest, res) => {
  const parsed = z.object({
    name: z.string().min(2),
    description: z.string().min(2),
    price: z.number().int().min(0),
    image: z.string().url(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const p = await prisma.product.create({ data: parsed.data });

  await prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: p.id,
      meta: parsed.data,
    },
  });

  res.status(201).json(p);
});

// Editar producto (Admin/Worker)
productsRouter.patch("/:id", requireAuth, requireRole("ADMIN", "WORKER"), async (req: AuthRequest, res) => {
  const parsed = z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(2).optional(),
    price: z.number().int().min(0).optional(),
    image: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const p = await prisma.product.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user!.id,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: p.id,
      meta: parsed.data,
    },
  });

  res.json(p);
});

// Desactivar (soft delete) (Admin/Worker)
productsRouter.post("/:id/disable", requireAuth, requireRole("ADMIN", "WORKER"), async (req: AuthRequest, res) => {
  const p = await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: { actorId: req.user!.id, action: "PRODUCT_DISABLE", entity: "Product", entityId: p.id },
  });

  res.json(p);
});

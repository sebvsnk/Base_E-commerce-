import { Router, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const productsRouter = Router();

// Público: solo activos
// Supports filtering by categoryId
productsRouter.get("/", async (req, res) => {
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

  const where = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: true },
      skip: (page - 1) * limit,
      take: limit,
    })
  ]);

  res.json({
    data: products,
    meta: { total, page, limit, lastPage: Math.ceil(total / limit) }
  });
});

// Admin/Worker: ver todos (activos e inactivos)
productsRouter.get("/admin/all", requireAuth, requireRole("ADMIN", "WORKER"), async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

  const [total, products] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true },
      skip: (page - 1) * limit,
      take: limit,
    })
  ]);

  res.json({
    data: products,
    meta: { total, page, limit, lastPage: Math.ceil(total / limit) }
  });
});

// Crear producto (Admin/Worker)
productsRouter.post("/", requireAuth, requireRole("ADMIN", "WORKER"), async (req: Request, res) => {
  const parsed = z.object({
    name: z.string().min(2),
    description: z.string().min(2),
    price: z.number().int().min(0),
    image: z.string().url(),
    stock: z.number().int().min(0).default(0),
    categoryId: z.string().optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const p = await prisma.product.create({ data: parsed.data });

  await prisma.auditLog.create({
    data: {
      actorRun: req.user!.run,
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: p.id,
      meta: parsed.data,
    },
  });

  res.status(201).json(p);
});

// Editar producto (Admin/Worker)
productsRouter.patch("/:id", requireAuth, requireRole("ADMIN", "WORKER"), async (req: Request, res) => {
  const parsed = z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(2).optional(),
    price: z.number().int().min(0).optional(),
    image: z.string().url().optional(),
    stock: z.number().int().min(0).optional(),
    categoryId: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const p = await prisma.product.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      actorRun: req.user!.run,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: p.id,
      meta: parsed.data,
    },
  });

  res.json(p);
});

// Desactivar (soft delete) (Admin/Worker)
productsRouter.post("/:id/disable", requireAuth, requireRole("ADMIN", "WORKER"), async (req: Request, res) => {
  const p = await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: { actorRun: req.user!.run, action: "PRODUCT_DISABLE", entity: "Product", entityId: p.id },
  });

  res.json(p);
});

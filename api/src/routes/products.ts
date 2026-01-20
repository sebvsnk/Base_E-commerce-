import { Router, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const productsRouter = Router();

// Get unique brands
productsRouter.get("/brands", async (req, res) => {
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
  const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
  
  const where: any = { 
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
  }

  try {
    const brands = await prisma.product.findMany({
      where,
      select: { brand: true },
      distinct: ['brand'],
    });
    // Filter out nulls and return string array
    const brandList = brands.map(b => b.brand).filter(b => b !== null);
    res.json(brandList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching brands" });
  }
});

// Público: solo activos
// Supports filtering by categoryId, etc
productsRouter.get("/", async (req, res) => {
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
  const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
  const brand = typeof req.query.brand === 'string' ? req.query.brand : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'date-desc';

  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

  const where: any = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(brand ? { brand } : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } }
      ]
    } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined ? {
      price: {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      }
    } : {}),
  };

  let orderBy: any = { createdAt: "desc" };
  switch (sort) {
    case 'price-asc': orderBy = { price: 'asc' }; break;
    case 'price-desc': orderBy = { price: 'desc' }; break;
    case 'alpha-asc': orderBy = { name: 'asc' }; break;
    case 'alpha-desc': orderBy = { name: 'desc' }; break;
    case 'date-asc': orderBy = { createdAt: 'asc' }; break;
    case 'date-desc': orderBy = { createdAt: 'desc' }; break;
    // best-selling fallback
    case 'best-selling': orderBy = { createdAt: 'desc' }; break;
  }

  try {
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
      })
    ]);

    res.json({
      data: products,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products", error: String(error) });
  }
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
    images: z.array(z.string().url()).optional(),
    stock: z.number().int().min(0).default(0),
    categoryId: z.string().optional(),
    brand: z.string().optional(),
    sku: z.string().optional(),
    weight: z.number().optional(),
    tags: z.array(z.string()).default([])
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

productsRouter.get("/:id", async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!p) return res.status(404).json({ message: "Product not found" });
  res.json(p);
});

// Increment product view count
productsRouter.post("/:id/view", async (req, res) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error incrementing product views:", error);
    res.status(500).json({ message: "Error registering view" });
  }
});

// Editar producto (Admin/Worker)
productsRouter.patch("/:id", requireAuth, requireRole("ADMIN", "WORKER"), async (req: Request, res) => {
  const parsed = z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(2).optional(),
    price: z.number().int().min(0).optional(),
    image: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),
    stock: z.number().int().min(0).optional(),
    categoryId: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    weight: z.number().optional().nullable(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { categoryId, ...rest } = parsed.data;
  const data: any = { ...rest };

  if (categoryId !== undefined) {
    if (categoryId === null) {
      data.category = { disconnect: true };
    } else {
      data.category = { connect: { id: categoryId } };
    }
  }

  const p = await prisma.product.update({
    where: { id: req.params.id },
    data,
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
productsRouter.post("/:id/disable", requireAuth, requireRole("ADMIN", "WORKER"), async (req: Request, res) => {
  const p = await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: { actorId: req.user!.id, action: "PRODUCT_DISABLE", entity: "Product", entityId: p.id },
  });

  res.json(p);
});

productsRouter.delete("/:id", requireAuth, requireRole("ADMIN"), async (req: Request, res) => {
  try {
    const p = await prisma.product.delete({
      where: { id: req.params.id },
    });

    await prisma.auditLog.create({
      data: { actorId: req.user!.id, action: "PRODUCT_DELETE", entity: "Product", entityId: p.id },
    });

    res.json({ success: true, id: p.id });
  } catch (e: any) {
    if (e.code === "P2003") {
      res.status(400).send("No se puede eliminar el producto porque tiene historial de ventas (órdenes o ítems asociados). Se recomienda desactivarlo en su lugar.");
    } else {
      console.error(e);
      res.status(500).send("Error eliminando producto");
    }
  }
});


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
      actorId: req.user!.id,
      action: "USER_CREATE",
      entity: "User",
      entityId: user.id,
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
      actorId: req.user!.id,
      action: "USER_UPDATE",
      entity: "User",
      entityId: user.id,
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
    include: { actor: { select: { run: true, email: true, role: true } } },
  });

  res.json(audits);
});

// Dashboard metrics endpoint
adminRouter.get("/dashboard", async (_req, res) => {
  try {
    // Get all paid orders
    const paidOrders = await prisma.order.findMany({
      where: { status: "PAID" },
      include: { items: true },
    });

    // Calculate total sales (sum of quantities)
    const totalSales = paidOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.qty, 0);
    }, 0);

    // Calculate total revenue
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    // Total orders
    const totalOrders = paidOrders.length;

    // Average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get all products with stock info
    const allProducts = await prisma.product.findMany({
      select: { id: true, name: true, stock: true },
    });

    const productsInStock = allProducts.filter(p => p.stock > 0).length;
    const lowStockProducts = allProducts.filter(p => p.stock > 0 && p.stock <= 10).length;

    // Calculate product sales and revenue
    const productSales = new Map<string, { name: string; sku: string | null; sales: number; revenue: number }>();

    for (const order of paidOrders) {
      for (const item of order.items) {
        const existing = productSales.get(item.productId) || { name: "", sku: null, sales: 0, revenue: 0 };
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        
        productSales.set(item.productId, {
          name: product?.name || "Producto desconocido",
          sku: product?.sku || null,
          sales: existing.sales + item.qty,
          revenue: existing.revenue + (item.priceSnapshot * item.qty),
        });
      }
    }

    // Sort products by sales
    const sortedProducts = Array.from(productSales.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.sales - a.sales);

    const topProducts = sortedProducts.slice(0, 5);
    const lowProducts = sortedProducts.slice(-3).reverse();

    // Get most viewed products
    const mostViewedProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, name: true, sku: true, views: true }
    });

    // Get new customers count (users created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newCustomers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Better conversion rate calculation: unique customers who made at least one purchase
    const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });
    
    // Get unique customers who have at least one paid order
    const customersWithOrders = await prisma.order.findMany({
      where: { 
        status: "PAID",
        userId: { not: null }
      },
      select: { userId: true },
      distinct: ['userId']
    });
    
    const uniqueCustomersWhoBought = customersWithOrders.length;
    const conversionRate = totalCustomers > 0 ? (uniqueCustomersWhoBought / totalCustomers) * 100 : 0;

    res.json({
      metrics: {
        totalSales,
        totalRevenue,
        totalOrders,
        avgOrderValue,
        newCustomers,
        productsInStock,
        lowStockProducts,
        conversionRate,
      },
      topProducts,
      lowProducts,
      mostViewedProducts,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Error loading dashboard metrics" });
  }
});

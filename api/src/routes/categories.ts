import { Router, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const categoriesRouter = Router();

// Public: List all categories
categoriesRouter.get("/", async (_req, res) => {
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
    });
    res.json(categories);
});

// Admin/Worker: Create category
categoriesRouter.post("/", requireAuth, requireRole("ADMIN", "WORKER"), async (req: Request, res) => {
    const parsed = z.object({
        name: z.string().min(2),
        slug: z.string().min(2),
    }).safeParse(req.body);

    if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

    try {
        const category = await prisma.category.create({ data: parsed.data });

        await prisma.auditLog.create({
            data: {
                actorRun: req.user!.run,
                action: "CATEGORY_CREATE",
                entity: "Category",
                entityId: category.id,
                meta: parsed.data,
            },
        });

        res.status(201).json(category);
    } catch (e: unknown) {
        if (typeof e === 'object' && e !== null && 'code' in e && (e as {code: string}).code === 'P2002') {
            return res.status(409).json({ message: "Category name or slug already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

// Admin/Worker: Update category
categoriesRouter.patch("/:id", requireAuth, requireRole("ADMIN", "WORKER"), async (req: Request, res) => {
    const parsed = z.object({
        name: z.string().min(2).optional(),
        slug: z.string().min(2).optional(),
    }).safeParse(req.body);

    if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

    try {
        const category = await prisma.category.update({
            where: { id: req.params.id },
            data: parsed.data,
        });

        await prisma.auditLog.create({
            data: {
                actorRun: req.user!.run,
                action: "CATEGORY_UPDATE",
                entity: "Category",
                entityId: category.id,
                meta: parsed.data,
            },
        });

        res.json(category);
    } catch (e: unknown) {
        if (typeof e === 'object' && e !== null && 'code' in e && (e as {code: string}).code === 'P2002') {
            return res.status(409).json({ message: "Category name or slug already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
});

// Admin/Worker: Delete category
categoriesRouter.delete("/:id", requireAuth, requireRole("ADMIN", "WORKER"), async (req: Request, res) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id } });

        await prisma.auditLog.create({
            data: {
                actorRun: req.user!.run,
                action: "CATEGORY_DELETE",
                entity: "Category",
                entityId: req.params.id,
            },
        });

        res.json({ message: "Category deleted" });
    } catch (e: unknown) {
        if (typeof e === 'object' && e !== null && 'code' in e && (e as {code: string}).code === 'P2003') {
            return res.status(409).json({ message: "Cannot delete category with associated products" });
        }
        res.status(500).json({ message: "Could not delete category" });
    }
});

import { Router, Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const usersRouter = Router();

// Get my addresses
usersRouter.get("/me/addresses", requireAuth, async (req: Request, res) => {
    const addresses = await prisma.address.findMany({
        where: { userId: req.user!.id },
        orderBy: { isDefault: "desc" }, // Default first
    });
    res.json(addresses);
});

// Add address
usersRouter.post("/me/addresses", requireAuth, async (req: Request, res) => {
    const parsed = z.object({
        street: z.string().min(5),
        cityId: z.string().min(1),
        zip: z.string().min(4),
        isDefault: z.boolean().optional(),
        label: z.string().optional(),
        contactPhone: z.string().optional(),
    }).safeParse(req.body);

    if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

    // If setting as default, unset others
    if (parsed.data.isDefault) {
        await prisma.address.updateMany({
            where: { userId: req.user!.id },
            data: { isDefault: false },
        });
    }

    const address = await prisma.address.create({
        data: {
            userId: req.user!.id,
            ...parsed.data,
        },
    });

    res.status(201).json(address);
});

// Update address
usersRouter.patch("/me/addresses/:id", requireAuth, async (req: Request, res) => {
    const { id } = req.params;
    
    // Check ownership
    const existing = await prisma.address.findFirst({
        where: { id, userId: req.user!.id }
    });
    if (!existing) return res.status(404).json({ message: "Address not found" });

    const parsed = z.object({
        street: z.string().min(5).optional(),
        cityId: z.string().min(1).optional(),
        zip: z.string().min(4).optional(),
        isDefault: z.boolean().optional(),
        label: z.string().optional(),
        contactPhone: z.string().optional(),
    }).safeParse(req.body);

    if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

    // If setting as default, unset others first
    if (parsed.data.isDefault) {
        await prisma.address.updateMany({
            where: { userId: req.user!.id, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const updated = await prisma.address.update({
        where: { id },
        data: parsed.data
    });

    res.json(updated);
});

// Delete address
usersRouter.delete("/me/addresses/:id", requireAuth, async (req: Request, res) => {
    const { id } = req.params;
    
    // Check ownership
    const existing = await prisma.address.findFirst({
        where: { id, userId: req.user!.id }
    });
    if (!existing) return res.status(404).json({ message: "Address not found" });

    await prisma.address.delete({ where: { id } });
    res.json({ success: true });
});

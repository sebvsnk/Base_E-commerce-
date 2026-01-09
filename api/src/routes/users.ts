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
        city: z.string().min(2),
        state: z.string().min(2),
        zip: z.string().min(4),
        country: z.string().min(2),
        isDefault: z.boolean().optional(),
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

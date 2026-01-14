import { Router } from "express";
import { prisma } from "../lib/prisma";

export const locationsRouter = Router();

locationsRouter.get("/", async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      include: {
        cities: {
          orderBy: { name: "asc" }
        }
      },
      orderBy: { name: "asc" }
    });
    res.json(regions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching locations" });
  }
});

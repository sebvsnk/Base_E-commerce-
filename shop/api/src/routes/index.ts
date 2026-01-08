import { Router } from "express";
import { authRouter } from "./auth";
import { productsRouter } from "./products";
import { ordersRouter } from "./orders";
import { adminRouter } from "./admin";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ ok: true }));

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/admin", adminRouter);

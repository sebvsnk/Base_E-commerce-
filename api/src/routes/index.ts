import { Router } from "express";
import { authRouter } from "./auth";
import { productsRouter } from "./products";
import { ordersRouter } from "./orders";
import { adminRouter } from "./admin";
import { categoriesRouter } from "./categories";
import { usersRouter } from "./users";
import { webpayRouter } from "./webpay";
import { locationsRouter } from "./locations";
import { uploadRouter } from "./upload";
import { mediaRouter } from "./media";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => res.json({ ok: true }));

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/locations", locationsRouter);
apiRouter.use("/webpay", webpayRouter);
apiRouter.use("/upload", uploadRouter);
apiRouter.use("/media", mediaRouter);

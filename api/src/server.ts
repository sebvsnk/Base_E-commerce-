import "dotenv/config";
import express from "express";
import cors from "cors";
import net from "node:net";
import { apiRouter } from "./routes";
import { prisma } from "./lib/prisma";

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        process.env.CORS_ORIGIN ?? "*"
    ].flat()
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for Webpay POST redirect

type MockCategory = {
    id: string;
    name: string;
    slug: string;
    _count: { products: number };
};

type MockProduct = {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    isActive: boolean;
    categoryId?: string | null;
    createdAt?: string;
};

function parseDbHostPort(connectionString: string): { host: string; port: number } | null {
    try {
        const url = new URL(connectionString);
        const host = url.hostname;
        const port = url.port ? Number(url.port) : 5432;
        if (!host || !Number.isFinite(port)) return null;
        return { host, port };
    } catch {
        return null;
    }
}

async function canTcpConnect(host: string, port: number, timeoutMs = 2000): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = net.connect({ host, port });
        const done = (ok: boolean) => {
            socket.removeAllListeners();
            try { socket.end(); socket.destroy(); } catch {}
            resolve(ok);
        };

        socket.setTimeout(timeoutMs);
        socket.once("connect", () => done(true));
        socket.once("timeout", () => done(false));
        socket.once("error", (err) => {
            // console.warn("TCP connect error:", err.message);
            done(false);
        });
    });
}

const PORT = Number(process.env.PORT ?? 4000);

function mountMockApi() {
    const categories: MockCategory[] = [
        { id: "c1", name: "Ropa", slug: "ropa", _count: { products: 1 } },
        { id: "c2", name: "Audio", slug: "audio", _count: { products: 1 } },
        { id: "c3", name: "Accesorios", slug: "accesorios", _count: { products: 1 } },
    ];

    const products: MockProduct[] = [
        {
            id: "p1",
            name: "Polera Noir",
            description: "Polera cómoda, buen fit, ideal para diario.",
            price: 12990,
            image: "https://picsum.photos/seed/p1/600/400",
            stock: 10,
            isActive: true,
            categoryId: "c1",
            createdAt: new Date().toISOString(),
        },
        {
            id: "p2",
            name: "Audífonos Studio",
            description: "Sonido balanceado, bajos firmes, livianos.",
            price: 39990,
            image: "https://picsum.photos/seed/p2/600/400",
            stock: 7,
            isActive: true,
            categoryId: "c2",
            createdAt: new Date().toISOString(),
        },
        {
            id: "p3",
            name: "Mouse Gamer",
            description: "Sensor preciso, clicks firmes y buen agarre.",
            price: 19990,
            image: "https://picsum.photos/seed/p3/600/400",
            stock: 15,
            isActive: true,
            categoryId: "c3",
            createdAt: new Date().toISOString(),
        },
    ];

    app.get("/api/health", (_req, res) => {
        res.json({ ok: true, mock: true });
    });

    app.get("/api/categories", (_req, res) => {
        res.json(categories);
    });

    app.get("/api/products", (req, res) => {
        const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
        const page = Math.max(1, Number(req.query.page ?? 1));
        const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));

        const filtered = categoryId ? products.filter((p) => p.categoryId === categoryId) : products;
        const total = filtered.length;
        const start = (page - 1) * limit;
        const data = filtered.slice(start, start + limit);

        res.json({
            data,
            meta: { total, page, limit, lastPage: Math.max(1, Math.ceil(total / limit)) },
        });
    });

    // For anything else, be explicit.
    app.use("/api", (_req, res) => {
        res.status(503).json({
            message: "API running in mock mode (database unavailable). Install Docker/Postgres or set DATABASE_URL to a reachable DB.",
        });
    });
}

function startPendingOrderCleanup() {
    const reserveMinutes = Math.max(1, Number(process.env.ORDER_RESERVE_MINUTES ?? 30));
    const intervalMs = Math.max(60_000, Number(process.env.ORDER_CLEANUP_INTERVAL_MS ?? 5 * 60_000));

    async function runOnce() {
        const cutoff = new Date(Date.now() - reserveMinutes * 60_000);

        const stale = await prisma.order.findMany({
            where: {
                status: "PENDING",
                createdAt: { lt: cutoff },
                OR: [{ paymentStatus: null }, { paymentStatus: "PENDING" }],
            },
            include: { items: true },
            take: 50,
            orderBy: { createdAt: "asc" },
        });

        for (const order of stale) {
            try {
                await prisma.$transaction(async (tx) => {
                    const updated = await tx.order.updateMany({
                        where: { id: order.id, status: "PENDING" },
                        data: { status: "CANCELLED", paymentStatus: "EXPIRED" },
                    });

                    if (updated.count !== 1) return;

                    for (const item of order.items) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { increment: item.qty } },
                        });
                    }
                });
            } catch (e: unknown) {
                console.error("Order cleanup failed:", order.id, e);
            }
        }
    }

    // best-effort: periodic cleanup, don't block server start
    setInterval(() => {
        runOnce().catch((e) => console.error("Order cleanup tick failed:", e));
    }, intervalMs);

    // kick once shortly after start
    setTimeout(() => {
        runOnce().catch((e) => console.error("Order cleanup initial run failed:", e));
    }, 5_000);
}

async function bootstrap() {
    const forcedMock = String(process.env.MOCK_API ?? "").toLowerCase() === "true";

    const dbUrl = process.env.DATABASE_URL;
    const dbTarget = dbUrl ? parseDbHostPort(dbUrl) : null;
    const dbReachable = dbTarget ? await canTcpConnect(dbTarget.host, dbTarget.port) : false;

    const useMock = forcedMock || !dbReachable;

    if (useMock) {
        mountMockApi();
        app.listen(PORT, () => {
            console.warn(
                `API running (mock mode): http://localhost:${PORT}/api (DB unreachable${forcedMock ? ", MOCK_API=true" : ""})`
            );
        });
        return;
    }


    // catch any unhandled rejection to prevent crash
    process.on("unhandledRejection", (reason, p) => {
        console.error("Unhandled Rejection at:", p, "reason:", reason);
    });
    
    process.on("uncaughtException", (err) => {
        console.error("Uncaught Exception:", err);
    });

    app.use("/api", apiRouter);
    app.listen(PORT, () => {
        console.log(`API running: http://localhost:${PORT}/api`);
        startPendingOrderCleanup();
    });
}

bootstrap().catch((e) => {
    console.error("Fatal startup error:", e);
    process.exitCode = 1;
});

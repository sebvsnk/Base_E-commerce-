import { Router } from "express";
import { z } from "zod";
import { WebpayPlus, Options, Environment, IntegrationCommerceCodes, IntegrationApiKeys } from "transbank-sdk";
import { prisma } from "../lib/prisma";

// Use Integration environment by default if env vars are missing
const wp = new WebpayPlus.Transaction(
    new Options(
        process.env.WEBPAY_COMMERCE_CODE ?? IntegrationCommerceCodes.WEBPAY_PLUS,
        process.env.WEBPAY_API_KEY ?? IntegrationApiKeys.WEBPAY,
        process.env.WEBPAY_ENV === "production" ? Environment.Production : Environment.Integration
    )
);

export const webpayRouter = Router();

// 1. Create Transaction (Start Payment)
webpayRouter.post("/create", async (req, res) => {
    const parsed = z.object({ orderId: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

    const { orderId } = parsed.data;
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "PAID") return res.status(400).json({ message: "Order already paid" });

    try {
        const buyOrder = order.id.slice(0, 26); // Webpay limit
        const sessionId = `S-${Date.now()}`;
        const amount = order.total;
        // URL to return to (Frontend page that handles the commit)
        // We'll use a backend endpoint for commit, which then redirects to frontend?
        // Standard flow: Webpay -> Backend (Commit) -> Frontend (Result).
        // OR: Webpay -> Frontend (Result) -> Backend (Commit).
        // Transbank recommends: Webpay -> Frontend -> Backend (Commit).
        // Let's do: Webpay -> Frontend /webpay/return -> Backend /api/webpay/commit

        // Actually, for security, it's often better if the return URL is the backend to verify immediately, then redirect.
        // But standard SPA flow usually returns to frontend.
        // Let's try: Return to Frontend, Frontend calls Commit.

        // However, Transbank POSTs to the return URL. SPAs don't handle POST navigation well.
        // So the return URL MUST be a backend endpoint that handles the POST, then redirects to the Frontend.

        const returnUrl = `${process.env.API_URL ?? "http://localhost:4000/api"}/webpay/commit`;

        const response = await wp.create(buyOrder, sessionId, amount, returnUrl);

        // Save token
        await prisma.order.update({
            where: { id: order.id },
            data: { webpayToken: response.token, paymentStatus: "PENDING" },
        });

        res.json({ url: response.url, token: response.token });
    } catch (e: unknown) {
        console.error(e);
        res.status(500).json({ message: "Error creating Webpay transaction" });
    }
});

// 2. Commit Transaction (Finish Payment)
// Webpay redirects here with POST (token_ws) or GET (tbk_token if aborted)
webpayRouter.all("/commit", async (req, res) => {
    const tokenWs = req.body.token_ws ?? req.query.token_ws;
    const tbkToken = req.body.TBK_TOKEN ?? req.query.TBK_TOKEN;

    // 1. Caso: Usuario aborta en el formulario de Webpay
    if (tbkToken && !tokenWs) {
        // Transbank envía TBK_TOKEN, TBK_ORDEN_COMPRA, TBK_ID_SESION
        // No debemos hacer commit. Simplemente redirigir a "aborted".
        // Opcional: Marcar orden como CANCELLED si tenemos el ID (TBK_ORDEN_COMPRA suele ser el buyOrder)
        return res.redirect(`${process.env.FRONTEND_URL ?? "http://localhost:5173"}/webpay/return?status=aborted`);
    }

    // 2. Caso: Error de timeout o invalidez (a veces llega sin nada)
    if (!tokenWs) {
        return res.redirect(`${process.env.FRONTEND_URL ?? "http://localhost:5173"}/webpay/return?status=error&msg=NoToken`);
    }

    // 3. Caso: Éxito (token_ws presente) -> Commit
    try {
        const response = await wp.commit(tokenWs);

        // Find order by token (we saved it in /create)
        // Note: webpayToken in DB matches the token returned by create(), which is what token_ws is.
        const order = await prisma.order.findUnique({ where: { webpayToken: tokenWs } });

        if (!order) {
            return res.redirect(`${process.env.FRONTEND_URL ?? "http://localhost:5173"}/webpay/return?status=error&msg=OrderNotFound`);
        }

        if (response.status === "AUTHORIZED" && response.response_code === 0) {
            // Success
            await prisma.order.update({
                where: { id: order.id },
                data: { status: "PAID", paymentStatus: "AUTHORIZED" },
            });
            return res.redirect(`${process.env.FRONTEND_URL ?? "http://localhost:5173"}/webpay/return?status=success&orderId=${order.id}`);
        } else {
            // Failed (Rechazada por banco, etc.)
            await prisma.order.update({
                where: { id: order.id },
                data: { paymentStatus: "FAILED" },
            });
            return res.redirect(`${process.env.FRONTEND_URL ?? "http://localhost:5173"}/webpay/return?status=failed`);
        }

    } catch (e: unknown) {
        console.error("Webpay Commit Error:", e);
        // If token was already committed, it throws.
        return res.redirect(`${process.env.FRONTEND_URL ?? "http://localhost:5173"}/webpay/return?status=error&msg=CommitError`);
    }
});

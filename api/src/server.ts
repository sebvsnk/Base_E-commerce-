import "dotenv/config";
import express from "express";
import cors from "cors";
import { apiRouter } from "./routes";

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

app.use("/api", apiRouter);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => console.log(`API running: http://localhost:${PORT}/api`));

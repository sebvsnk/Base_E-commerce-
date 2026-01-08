import "dotenv/config";
import express from "express";
import cors from "cors";
import { apiRouter } from "./routes";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

app.use("/api", apiRouter);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => console.log(`API running: http://localhost:${PORT}/api`));

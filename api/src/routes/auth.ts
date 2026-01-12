import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import rateLimit from "express-rate-limit";
import { cleanRun, isValidRun } from "../lib/run-validator";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = z.object({
    run: z.string().min(8),
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2).optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { run, email, password, fullName } = parsed.data;

  // Validate Chilean RUN
  if (!isValidRun(run)) {
    return res.status(400).json({ message: "Invalid RUN" });
  }

  const cleanedRun = cleanRun(run);

  const existsEmail = await prisma.user.findUnique({ where: { email } });
  if (existsEmail) return res.status(409).json({ message: "Email already exists" });

  const existsRun = await prisma.user.findUnique({ where: { run: cleanedRun } });
  if (existsRun) return res.status(409).json({ message: "RUN already exists" });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { run: cleanedRun, email, passwordHash, fullName, role: "CUSTOMER" },
    select: { run: true, email: true, role: true, fullName: true },
  });

  const token = jwt.sign({ role: user.role }, JWT_SECRET, { subject: user.run, expiresIn: "7d" });
  res.status(201).json({ token, user });
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ role: user.role }, JWT_SECRET, { subject: user.run, expiresIn: "7d" });
  res.json({ token, user: { run: user.run, email: user.email, role: user.role, fullName: user.fullName } });
});

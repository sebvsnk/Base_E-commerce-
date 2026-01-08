import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2).optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });

  const { email, password, fullName } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, role: "CUSTOMER" },
    select: { id: true, email: true, role: true, fullName: true },
  });

  const token = jwt.sign({ role: user.role }, JWT_SECRET, { subject: user.id, expiresIn: "7d" });
  res.status(201).json({ token, user });
});

authRouter.post("/login", async (req, res) => {
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

  const token = jwt.sign({ role: user.role }, JWT_SECRET, { subject: user.id, expiresIn: "7d" });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } });
});

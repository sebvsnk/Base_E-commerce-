import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

export type Role = "ADMIN" | "WORKER" | "CUSTOMER";

export type AuthRequest = Request & { user?: { id: string; role: Role } };
export type GuestRequest = Request & { guest?: { orderId: string; email: string } };

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: Role };
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}

// Invitado: token de acceso a una sola orden por 30 min
export function signGuestOrderToken(orderId: string, email: string) {
  return jwt.sign({ scope: "GUEST_ORDER", orderId, email }, JWT_SECRET, {
    expiresIn: "30m",
    subject: `guest:${orderId}`,
  });
}

export function requireGuestOrderToken(req: GuestRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { scope: "GUEST_ORDER"; orderId: string; email: string };
    if (payload.scope !== "GUEST_ORDER") return res.status(401).json({ message: "Invalid scope" });
    req.guest = { orderId: payload.orderId, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

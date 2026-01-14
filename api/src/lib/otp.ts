import crypto from "crypto";

const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || "dev_otp_secret";

export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(code: string): string {
  return crypto.createHmac("sha256", OTP_SECRET).update(code).digest("hex");
}

export function timingSafeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

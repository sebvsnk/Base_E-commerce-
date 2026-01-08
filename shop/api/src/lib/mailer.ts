import nodemailer from "nodemailer";

function hasSmtp() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendOtpEmail(to: string, code: string) {
  // DEV fallback
  if (!hasSmtp()) {
    console.log(`\n[DEV OTP] to=${to} code=${code}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!),
    secure: Number(process.env.SMTP_PORT!) === 465,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@shop.local",
    to,
    subject: "Tu código de verificación",
    text: `Tu código es: ${code}. Expira en 10 minutos.`,
  });
}

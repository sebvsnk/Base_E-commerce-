import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;
  if (!email || !password) throw new Error("Missing ADMIN_EMAIL/ADMIN_PASSWORD");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("Admin ya existe:", email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, passwordHash, role: "ADMIN", isActive: true, fullName: "Admin" },
  });

  console.log("Admin creado:", email);
}

main().finally(async () => prisma.$disconnect());

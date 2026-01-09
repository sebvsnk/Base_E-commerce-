import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DATABASE_URL");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.product.count();
  if (count > 0) {
    console.log(`Seed skipped: already ${count} products`);
    return;
  }

  await prisma.product.createMany({
    data: [
      {
        name: "Polera Noir",
        description: "Polera cómoda, buen fit, ideal para diario.",
        price: 12990,
        image: "https://picsum.photos/seed/p1/600/400",
      },
      {
        name: "Audífonos Studio",
        description: "Sonido balanceado, bajos firmes, livianos.",
        price: 39990,
        image: "https://picsum.photos/seed/p2/600/400",
      },
      {
        name: "Mouse Gamer",
        description: "Sensor preciso, clicks firmes y buen agarre.",
        price: 19990,
        image: "https://picsum.photos/seed/p3/600/400",
      },
    ],
  });

  console.log("Seed OK ✅");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

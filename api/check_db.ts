import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    const count = await prisma.product.count();
    console.log(`Product count: ${count}`);
    const products = await prisma.product.findMany({ take: 2 });
    console.log('Sample products:', JSON.stringify(products, null, 2));
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

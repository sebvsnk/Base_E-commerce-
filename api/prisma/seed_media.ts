import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DATABASE_URL");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedMediaAssets() {
  console.log('🎨 Seeding media assets...');

  // Crear banners por defecto
  const banners = [
    {
      type: 'BANNER' as const,
      section: 'banner-1',
      title: 'OFERTAS IMPERDIBLES',
      url: 'https://placehold.co/1600x400/af11af/white?text=OFERTAS+IMPERDIBLES&font=montserrat',
      displayOrder: 1,
      isActive: true
    },
    {
      type: 'BANNER' as const,
      section: 'banner-2',
      title: 'LO MEJOR EN JUGUETERIA',
      url: 'https://placehold.co/1600x400/af11af/white?text=LO+MEJOR+EN+JUGUETERIA&font=Montserrat',
      displayOrder: 2,
      isActive: true
    },
    {
      type: 'BANNER' as const,
      section: 'banner-3',
      title: 'ENVIOS A TODO EL PAIS',
      url: 'https://placehold.co/1600x800/af11af/white?text=ENVIOS+A+TODO+EL+PAIS&font=montserrat',
      displayOrder: 3,
      isActive: true
    }
  ];

  for (const banner of banners) {
    await prisma.mediaAsset.upsert({
      where: {
        type_section: {
          type: banner.type,
          section: banner.section
        }
      },
      update: {},
      create: banner
    });
  }

  // Crear imágenes de categorías por defecto
  const categoryImages = [
    {
      type: 'CATEGORY_IMAGE' as const,
      section: 'category-1',
      title: 'Vibradores',
      url: 'https://vffoaqdmxdyojufjztcu.supabase.co/storage/v1/object/public/ecommerce-products/media/category_image/category-1-1768946995823.svg',
      displayOrder: 1,
      isActive: true,
      objectFit: 'cover',
      objectPosition: '50% 50%'
    },
    {
      type: 'CATEGORY_IMAGE' as const,
      section: 'category-2',
      title: 'Lubricantes',
      url: 'https://vffoaqdmxdyojufjztcu.supabase.co/storage/v1/object/public/ecommerce-products/media/category_image/category-2-1768944541616.svg',
      displayOrder: 2,
      isActive: true,
      objectFit: 'cover',
      objectPosition: '50% 50%'
    },
    {
      type: 'CATEGORY_IMAGE' as const,
      section: 'category-3',
      title: 'Consoladores',
      url: 'https://vffoaqdmxdyojufjztcu.supabase.co/storage/v1/object/public/ecommerce-products/media/category_image/category-3-1768944749183.svg',
      displayOrder: 3,
      isActive: true,
      objectFit: 'cover',
      objectPosition: '50% 50%'
    },
    {
      type: 'CATEGORY_IMAGE' as const,
      section: 'category-4',
      title: 'Pareja',
      url: 'https://vffoaqdmxdyojufjztcu.supabase.co/storage/v1/object/public/ecommerce-products/media/category_image/category-4-1768944876890.svg',
      displayOrder: 4,
      isActive: true,
      objectFit: 'cover',
      objectPosition: '50% 50%'
    },
    {
      type: 'CATEGORY_IMAGE' as const,
      section: 'category-5',
      title: 'Electricos',
      url: 'https://vffoaqdmxdyojufjztcu.supabase.co/storage/v1/object/public/ecommerce-products/media/category_image/category-5-1768944890312.svg',
      displayOrder: 5,
      isActive: true,
      objectFit: 'cover',
      objectPosition: '50% 50%'
    },
    {
      type: 'CATEGORY_IMAGE' as const,
      section: 'category-6',
      title: 'Condones',
      url: 'https://vffoaqdmxdyojufjztcu.supabase.co/storage/v1/object/public/ecommerce-products/media/category_image/category-6-1768944899357.svg',
      displayOrder: 6,
      isActive: true,
      objectFit: 'cover',
      objectPosition: '50% 50%'
    }
  ];

  for (const categoryImage of categoryImages) {
    await prisma.mediaAsset.upsert({
      where: {
        type_section: {
          type: categoryImage.type,
          section: categoryImage.section
        }
      },
      update: {},
      create: categoryImage
    });
  }

  console.log('✅ Media assets seeded successfully!');
}

seedMediaAssets()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

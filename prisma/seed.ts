import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new Pool({ 
  connectionString,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  ssl: connectionString.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const COMMUNES = [
  { name: 'Cocody', deliveryFee: 2000 },
  { name: 'Plateau', deliveryFee: 1500 },
  { name: 'Marcory', deliveryFee: 2000 },
  { name: 'Riviera', deliveryFee: 2500 },
  { name: 'Angré', deliveryFee: 2500 },
  { name: 'Treichville', deliveryFee: 1500 },
  { name: 'Koumassi', deliveryFee: 2000 },
  { name: 'Adjamé', deliveryFee: 1500 },
  { name: 'Yopougon', deliveryFee: 3000 },
  { name: 'Abobo', deliveryFee: 3000 },
];

const SEED_ACCOUNTS = [
  { email: 'admin@zangochap.ci', phone: '0700000000', password: 'demo', name: 'Super Admin', role: 'ADMIN', initials: 'SA' },
  { email: 'com@zangochap.ci', phone: '0700000001', password: 'demo', name: 'Aya Konan', role: 'COMMERCIAL', initials: 'AK' },
  { email: 'stock@zangochap.ci', phone: '0700000002', password: 'demo', name: 'Kone Bakary', role: 'STOCK', initials: 'KB' },
];

const SEED_PRODUCTS = [
  {
    name: "Veste Chemise Dusk J24",
    category: "Mode Homme",
    price: 5900,
    description: "Veste chemise élégante et confortable pour homme.",
    image: "https://zangochap.com/img/Veste-Chemise-Dusk-J24.jpg",
    variants: [{ size: "M", color: "Gris", stock: 10 }]
  },
  {
    name: "TEE SHIRT LBR67",
    category: "T shirt",
    price: 2500,
    description: "T-shirt en coton de qualité supérieure.",
    image: "https://zangochap.com/img/TEE-SHIRT-LBR67.jpg",
    variants: [{ size: "L", color: "Blanc", stock: 20 }]
  },
  {
    name: "Pantalon velour V927",
    category: "Mode Homme",
    price: 5900,
    description: "Pantalon en velours côtelé avec coupe moderne.",
    image: "https://zangochap.com/img/Pantalon-velour-V927.jpg",
    variants: [{ size: "42", color: "Marron", stock: 15 }]
  },
  {
    name: "Sac Bandoulière Lacoste L51",
    category: "Accessoires",
    price: 3900,
    description: "Sac bandoulière pratique et stylé pour le quotidien.",
    image: "https://zangochap.com/img/Sac-Bandouliere-Lacoste-L51.jpg",
    variants: [{ size: "Unique", color: "Noir", stock: 5 }]
  },
  {
    name: "PANTALON DE COSTUME SLIM",
    category: "Mode Homme",
    price: 9000,
    description: "Pantalon de costume coupe slim, idéal pour les occasions formelles.",
    image: "https://zangochap.com/img/Pantalon-Costume-Slim.jpg",
    variants: [{ size: "40", color: "Noir", stock: 8 }]
  },
  {
    name: "Polo Ralph Lauren A RAYURE",
    category: "Mode Homme",
    price: 7900,
    description: "Polo classique à rayures avec logo brodé.",
    image: "https://zangochap.com/img/Polo-Ralph-Lauren-Rayure.jpg",
    variants: [{ size: "XL", color: "Bleu/Blanc", stock: 12 }]
  },
  {
    name: "CARDIGAN A COL CHEMISE",
    category: "Mode Homme",
    price: 9500,
    description: "Cardigan moderne avec col chemise intégré.",
    image: "https://zangochap.com/img/Cardigan-Col-Chemise.jpg",
    variants: [{ size: "L", color: "Gris Anthracite", stock: 7 }]
  },
  {
    name: "PANTALON CHASSEUR BAS DIRECT",
    category: "Mode Homme",
    price: 9500,
    description: "Pantalon style cargo/chasseur avec finitions robustes.",
    image: "https://zangochap.com/img/Pantalon-Chasseur.jpg",
    variants: [{ size: "44", color: "Kaki", stock: 10 }]
  },
  {
    name: "JEANS 510",
    category: "Mode Homme",
    price: 4900,
    description: "Le classique Jeans 510, durable et indémodable.",
    image: "https://zangochap.com/img/JEANS-510.jpg",
    variants: [{ size: "32", color: "Bleu Brut", stock: 25 }]
  },
  {
    name: "Basket féminine FD78",
    category: "Mode Femme",
    price: 4900,
    description: "Baskets légères et stylées pour femmes.",
    image: "https://zangochap.com/img/Basket-Feminine-FD78.jpg",
    variants: [{ size: "38", color: "Rose", stock: 14 }]
  }
];

async function main() {
  console.log('🌱 Starting Seed...');

  // 1. Communes
  console.log('📍 Seeding Communes...');
  for (const c of COMMUNES) {
    await prisma.commune.upsert({
      where: { name: c.name },
      update: { deliveryFee: c.deliveryFee },
      create: c
    });
  }

  // 2. Utilisateurs & Migration Mots de passe
  console.log('👤 Seeding Staff & Migrating passwords...');
  let adminUser: any;
  for (const acc of SEED_ACCOUNTS) {
    const hashedPassword = await bcrypt.hash(acc.password, 10);
    adminUser = await prisma.user.upsert({
      where: { email: acc.email },
      update: {},
      create: {
        email: acc.email,
        phone: acc.phone,
        password: hashedPassword,
        name: acc.name,
        role: acc.role as any,
        initials: acc.initials,
      }
    });
  }

  // 2b. Migrer les utilisateurs existants qui n'auraient pas de mdp haché
  const allUsers = await prisma.user.findMany();
  for (const user of allUsers) {
    if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      console.log(`🔒 Hashing existing password for: ${user.email || user.phone}`);
      const hashed = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed }
      });
    }
  }

  // 3. Produits & Catégories
  console.log('📦 Seeding Products...');
  for (const p of SEED_PRODUCTS) {
    const slug = p.name.toLowerCase().replace(/ /g, '-').replace(/'/g, '');
    
    // Créer d'abord la catégorie
    const category = await prisma.category.upsert({
      where: { name: p.category },
      update: {},
      create: { name: p.category, slug: p.category.toLowerCase() }
    });

    // Créer le produit
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        price: p.price,
        oldPrice: (p as any).oldPrice || null,
        description: p.description,
        material: (p as any).material || null,
        origin: (p as any).origin || null,
        status: 'PUBLISHED',
        isFeatured: (p as any).isFeatured || false,
        category: { connect: { id: category.id } },
        createdBy: { connect: { id: adminUser.id } },
        images: {
          create: [{ url: p.image, name: p.name }]
        },
        variants: {
          create: p.variants.map(v => ({
            size: v.size,
            color: v.color,
            stock: v.stock,
            location: 'STOCK-A'
          }))
        }
      }
    });
  }

  console.log('✅ Seed Finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

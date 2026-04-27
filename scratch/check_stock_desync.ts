
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDesync() {
  const products = await prisma.product.findMany({
    include: { variants: true }
  });

  console.log("--- Checking Product Stock Desync ---");
  for (const p of products) {
    const variantTotal = p.variants.reduce((s, v) => s + v.stock, 0);
    if (p.stock !== variantTotal) {
      console.log(`❌ Product "${p.name}" (ID: ${p.id}) desync: p.stock=${p.stock}, sum(variants)=${variantTotal}`);
    }
  }

  console.log("\n--- Checking Variant Stock Desync ---");
  const variants = await prisma.productVariant.findMany({
    include: { stockLevels: true, product: { select: { name: true } } }
  });

  for (const v of variants) {
    const levelTotal = v.stockLevels.reduce((s, sl) => s + sl.quantity, 0);
    if (v.stock !== levelTotal) {
      console.log(`❌ Variant "${v.size}/${v.color}" for "${v.product.name}" (ID: ${v.id}) desync: v.stock=${v.stock}, sum(levels)=${levelTotal}`);
    }
  }
}

checkDesync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

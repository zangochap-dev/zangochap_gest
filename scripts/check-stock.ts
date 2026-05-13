import prisma from "../lib/prisma";

async function main() {
  const levels = await prisma.stockLevel.findMany({
    take: 10,
    where: {
      position: { not: null }
    },
    include: {
      variant: {
        include: {
          product: true
        }
      },
      warehouse: true
    }
  });

  console.log("--- 10 premiers emplacements importés ---");
  levels.forEach(l => {
    console.log(`Produit: ${l.variant.product.name} (${l.variant.size})`);
    console.log(`Entrepôt: ${l.warehouse.name}`);
    console.log(`Position (SKU): ${l.position}`);
    console.log('-----------------------------------------');
  });
}

main().finally(() => prisma.$disconnect());

import "dotenv/config";
import prisma from "../lib/prisma";
import { syncProductStock } from "../lib/stock-sync";

const DEFAULT_WAREHOUSE_NAMES = [
  "Entrepôt Principal",
  "Entrepôt  principal",
  "Entrepot Principal",
  "Entrepot  principal",
  "Magasin Principal",
];

const shouldFixNegatives = process.argv.includes("--fix-negatives");
const shouldMergeDefaults = process.argv.includes("--merge-default-warehouses");
const shouldSyncAll = process.argv.includes("--sync-all");

function cleanName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

async function audit() {
  const [products, negativeLevels, warehouses] = await Promise.all([
    prisma.product.findMany({
      include: { variants: { include: { stockLevels: true } } },
    }),
    prisma.stockLevel.findMany({
      where: { quantity: { lt: 0 } },
      include: {
        warehouse: true,
        variant: { include: { product: { select: { id: true, name: true } } } },
      },
      orderBy: { quantity: "asc" },
    }),
    prisma.warehouse.findMany({
      include: { stocks: { select: { quantity: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  let productDesync = 0;
  let variantDesync = 0;
  for (const product of products) {
    const variantTotal = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
    const levelTotal = product.variants.reduce(
      (sum, variant) => sum + variant.stockLevels.reduce((levelSum, level) => levelSum + level.quantity, 0),
      0,
    );
    if (product.stock !== variantTotal || product.stock !== levelTotal) productDesync++;

    for (const variant of product.variants) {
      const levelTotalForVariant = variant.stockLevels.reduce((sum, level) => sum + level.quantity, 0);
      if (variant.stock !== levelTotalForVariant) variantDesync++;
    }
  }

  const warehouseGroups = new Map<string, typeof warehouses>();
  for (const warehouse of warehouses) {
    const key = cleanName(warehouse.name);
    warehouseGroups.set(key, [...(warehouseGroups.get(key) || []), warehouse]);
  }

  return {
    products: products.length,
    productDesync,
    variantDesync,
    negativeLevels,
    warehouses,
    duplicateLikeWarehouses: Array.from(warehouseGroups.values()).filter((group) => group.length > 1),
  };
}

async function fixNegativeLevels(levels: Awaited<ReturnType<typeof audit>>["negativeLevels"]) {
  const touchedProductIds = new Set<string>();

  for (const level of levels) {
    const delta = Math.abs(level.quantity);
    await prisma.$transaction(async (tx) => {
      await tx.stockLevel.update({
        where: { id: level.id },
        data: { quantity: 0 },
      });

      await tx.stockMovement.create({
        data: {
          variantId: level.variantId,
          warehouseId: level.warehouseId,
          type: "ADJUSTMENT",
          quantity: delta,
          reason: `Correction automatique stock négatif (${level.quantity} -> 0)`,
          by: "system",
          byName: "Maintenance stock",
        },
      });
    });
    touchedProductIds.add(level.variant.product.id);
  }

  for (const productId of touchedProductIds) {
    await syncProductStock(productId);
  }

  return { touchedProducts: touchedProductIds.size, fixedLevels: levels.length };
}

async function mergeDefaultWarehouses() {
  const candidates = await prisma.warehouse.findMany({
    where: { name: { in: DEFAULT_WAREHOUSE_NAMES } },
    include: { stocks: true },
  });
  if (candidates.length <= 1) return { mergedWarehouses: 0, movedRows: 0 };

  const canonical = candidates.find((warehouse) => warehouse.name === "Entrepôt Principal") || candidates[0];
  const duplicates = candidates.filter((warehouse) => warehouse.id !== canonical.id);
  let movedRows = 0;
  const touchedProductIds = new Set<string>();

  for (const warehouse of duplicates) {
    for (const stock of warehouse.stocks) {
      const quantity = Math.max(0, stock.quantity);
      const variant = await prisma.productVariant.findUnique({
        where: { id: stock.variantId },
        select: { productId: true },
      });
      if (variant) touchedProductIds.add(variant.productId);

      await prisma.$transaction(async (tx) => {
        const target = await tx.stockLevel.findUnique({
          where: {
            variantId_warehouseId: {
              variantId: stock.variantId,
              warehouseId: canonical.id,
            },
          },
        });

        if (target) {
          await tx.stockLevel.update({
            where: { id: target.id },
            data: {
              quantity: { increment: quantity },
              position: target.position || stock.position,
            },
          });
          await tx.stockLevel.delete({ where: { id: stock.id } });
        } else {
          await tx.stockLevel.update({
            where: { id: stock.id },
            data: { warehouseId: canonical.id, quantity },
          });
        }
      });
      movedRows++;
    }

    const remaining = await prisma.stockLevel.count({ where: { warehouseId: warehouse.id } });
    if (remaining === 0) {
      await prisma.warehouse.delete({ where: { id: warehouse.id } });
    }
  }

  for (const productId of touchedProductIds) {
    await syncProductStock(productId);
  }

  return { mergedWarehouses: duplicates.length, movedRows };
}

async function syncAllProducts() {
  const products = await prisma.product.findMany({ select: { id: true } });
  for (const product of products) {
    await syncProductStock(product.id);
  }
  return { syncedProducts: products.length };
}

async function main() {
  const before = await audit();
  console.log(JSON.stringify({
    mode: shouldFixNegatives || shouldMergeDefaults || shouldSyncAll ? "repair" : "audit",
    products: before.products,
    productDesync: before.productDesync,
    variantDesync: before.variantDesync,
    negativeLevels: before.negativeLevels.length,
    warehouses: before.warehouses.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      total: warehouse.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
      rows: warehouse.stocks.length,
    })),
    duplicateLikeWarehouses: before.duplicateLikeWarehouses.map((group) => group.map((warehouse) => warehouse.name)),
  }, null, 2));

  if (shouldFixNegatives) {
    console.log(JSON.stringify({ fixedNegatives: await fixNegativeLevels(before.negativeLevels) }, null, 2));
  }

  if (shouldMergeDefaults) {
    console.log(JSON.stringify({ mergedDefaults: await mergeDefaultWarehouses() }, null, 2));
  }

  if (shouldFixNegatives || shouldMergeDefaults || shouldSyncAll) {
    console.log(JSON.stringify({ syncAll: await syncAllProducts() }, null, 2));
    const after = await audit();
    console.log(JSON.stringify({
      after: {
        productDesync: after.productDesync,
        variantDesync: after.variantDesync,
        negativeLevels: after.negativeLevels.length,
      },
    }, null, 2));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

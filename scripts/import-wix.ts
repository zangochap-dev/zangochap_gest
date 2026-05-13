import "dotenv/config";
import prisma from "../lib/prisma";
import fs from "fs";
import path from "path";

const WIX_IMAGE_PREFIX = "https://static.wixstatic.com/media/";

async function main() {
  console.log("🚀 Démarrage de l'importation Wix optimisée...");

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  });

  if (!admin) {
    console.error("❌ Aucun utilisateur administrateur trouvé.");
    return;
  }

  const filePath = path.join(process.cwd(), "csvjson.json");
  if (!fs.existsSync(filePath)) {
    console.error("❌ Fichier csvjson.json introuvable.");
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const productMap = new Map();

  for (const item of data) {
    const handleId = item.handleId;
    if (!handleId) continue;

    if (item.fieldType === "Product") {
      productMap.set(handleId, { ...item, variants: [], allImages: new Set() });
      if (item.productImageUrl) productMap.get(handleId).allImages.add(item.productImageUrl);
    } else if (item.fieldType === "Variant") {
      const parent = productMap.get(handleId);
      if (parent) {
        parent.variants.push(item);
        if (item.productImageUrl) parent.allImages.add(item.productImageUrl);
      }
    }
  }

  console.log(`✅ ${productMap.size} produits prêts à l'import.`);

  const warehouseCache = new Map();
  let importedCount = 0;
  let skippedCount = 0;
  let totalProcessed = 0;
  const totalToProcess = productMap.size;

  for (const [handleId, p] of productMap.entries()) {
    totalProcessed++;
    try {
      // 1. Vérifier si le produit existe déjà par sa Ref (handleId Wix)
      const existingProduct = await prisma.product.findUnique({
        where: { ref: handleId }
      });

      if (existingProduct) {
        skippedCount++;
        // console.log(`⏭️  [${totalProcessed}/${totalToProcess}] Déjà présent : ${p.name}`);
        continue;
      }

      console.log(`📥 [${totalProcessed}/${totalToProcess}] Importation de : ${p.name}...`);

      const price = parseFloat(p.price) || 0;
      let oldPrice = null;

      if (p.discountValue > 0) {
        if (p.discountMode === "PERCENT") {
          oldPrice = price / (1 - (p.discountValue / 100));
        } else {
          oldPrice = price + p.discountValue;
        }
      }

      const imagesData = Array.from(p.allImages).map((url: any) => ({
        url: url.startsWith("http") ? url : `${WIX_IMAGE_PREFIX}${url}`,
        name: p.name
      }));

      // Trouver le premier SKU non vide pour Product.location
      const firstSku = Array.from(p.variants)
        .map((v: any) => v.sku)
        .find(s => s && s.trim() !== "") || (p.sku && p.sku.trim() !== "" ? p.sku : null);

      let categoryId = undefined;
      if (p.collection) {
        const catName = p.collection.split(";")[0].trim();
        if (catName) {
          const category = await prisma.category.upsert({
            where: { name: catName },
            update: {},
            create: { name: catName, slug: catName.toLowerCase().replace(/\s+/g, '-') }
          });
          categoryId = category.id;
        }
      }

      const totalStock = p.variants.reduce((sum: number, v: any) => sum + (parseInt(v.inventory) || 0), parseInt(p.inventory) || 0);

      const product = await prisma.product.create({
        data: {
          name: p.name,
          ref: handleId,
          description: p.description || "",
          price: price,
          oldPrice: oldPrice,
          stock: totalStock,
          status: "DRAFT",
          location: firstSku,
          creatorId: admin.id,
          categoryId: categoryId,
          images: { create: imagesData }
        }
      });

      const variantsToProcess = p.variants.length > 0 ? p.variants : [p];
      for (const v of variantsToProcess) {
        const rawSku = (v.sku && v.sku.trim() !== "") ? v.sku.trim() : null;
        const warehouseName = "Entrepôt Principal";
        
        let warehouseId = warehouseCache.get(warehouseName);
        if (!warehouseId) {
          const warehouse = await prisma.warehouse.upsert({
            where: { name: warehouseName },
            update: {},
            create: { name: warehouseName, location: "Importé de Wix" }
          });
          warehouseId = warehouse.id;
          warehouseCache.set(warehouseName, warehouseId);
        }

        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            size: String(v.productOptionDescription1 || "Standard"),
            color: String(v.productOptionDescription2 || "Standard"),
            stock: parseInt(v.inventory) || 0,
          }
        });

        await prisma.stockLevel.create({
          data: {
            variantId: variant.id,
            warehouseId: warehouseId,
            quantity: parseInt(v.inventory) || 0,
            position: rawSku
          }
        });
      }

      importedCount++;
    } catch (e) {
      console.error(`❌ Erreur sur ${p.name}:`, e);
    }
  }

  console.log(`\n✨ Terminé !`);
  console.log(`📊 Résultat : ${importedCount} nouveaux, ${skippedCount} ignorés (déjà là).`);
}

main().finally(() => prisma.$disconnect());

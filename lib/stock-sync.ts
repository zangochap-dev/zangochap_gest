
import prisma from "./prisma";

/**
 * Synchronise les stocks d'un produit en remontant la chaîne :
 * StockLevel -> ProductVariant -> Product
 */
export async function syncProductStock(productId: string) {
  // 1. Récupérer toutes les variantes du produit avec leurs niveaux de stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        include: {
          stockLevels: true
        }
      }
    }
  });

  if (!product) return;

  let totalProductStock = 0;

  // 2. Mettre à jour chaque variante
  for (const variant of product.variants) {
    const variantStock = variant.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0);
    
    // Mettre à jour la variante si le stock a changé
    if (variant.stock !== variantStock) {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: variantStock }
      });
    }
    
    totalProductStock += variantStock;
  }

  // 3. Mettre à jour le produit global
  if (product.stock !== totalProductStock) {
    await prisma.product.update({
      where: { id: productId },
      data: { stock: totalProductStock }
    });
  }

  return totalProductStock;
}

/**
 * Synchronise une seule variante (utile pour les opérations spécifiques aux variantes)
 */
export async function syncVariantStock(variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { stockLevels: true }
  });

  if (!variant) return;

  const variantStock = variant.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0);
  
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: variantStock }
  });

  // Déclencher la synchro du produit parent
  await syncProductStock(variant.productId);
  
  return variantStock;
}

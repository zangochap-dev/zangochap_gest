import type { CollectionItem } from "./types";

export function buildCollectionItems(orders: any[], products: any[]): CollectionItem[] {
  const productMap = new Map(products.map((product: any) => [product.id, product]));
  const toCollect: CollectionItem[] = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.productId) {
        toCollect.push({
          order,
          item,
          product: {
            id: "CUSTOM",
            name: item.name,
            images: [],
            variants: [],
            stock: 0,
            isCustom: true,
          },
        });
        continue;
      }

      const product = productMap.get(item.productId);
      if (!product) continue;

      toCollect.push({ order, item, product });
    }
  }

  return toCollect;
}

export function getCollectionLabel(status: string, note?: string) {
  const statusMarker = `COLLECTION_STATUS:${status}`;
  const labels: Record<string, string> = {
    collected: `${statusMarker} collecte`,
    unavailable: `${statusMarker} marque indisponible chez fournisseur`,
    alternative: `${statusMarker} collecte en alternative (${note || "non specifiee"})`,
  };

  return labels[status] || status;
}

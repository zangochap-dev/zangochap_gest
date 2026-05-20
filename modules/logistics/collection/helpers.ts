import type { CollectionItem } from "./types";

export const COLLECTION_STOCK_THRESHOLD = 4;

type CollectionOrderItem = {
  id?: string;
  productId?: string | null;
  variantId?: string | null;
  name?: string;
  size?: string | null;
  color?: string | null;
  qty?: number | string | null;
};

type CollectionProductVariant = {
  id: string;
  size?: string | null;
  color?: string | null;
  stock?: number | null;
};

type CollectionProduct = {
  id: string;
  name?: string;
  stock?: number | null;
  variants?: CollectionProductVariant[];
};

type CollectionOrder = {
  items: CollectionOrderItem[];
};

export function getCollectionStockLevel(item: CollectionOrderItem, product: CollectionProduct) {
  const variant = item.variantId
    ? product.variants?.find((variant) => variant.id === item.variantId)
    : product.variants?.find((variant) => variant.size === item.size && variant.color === item.color);

  return Number((variant ? variant.stock : product.stock) || 0);
}

export function shouldSendToCollection(item: CollectionOrderItem, product: CollectionProduct) {
  const requestedQty = Number(item.qty) || 1;
  const stockLevel = getCollectionStockLevel(item, product);
  return stockLevel < requestedQty || stockLevel - requestedQty <= COLLECTION_STOCK_THRESHOLD;
}

export function buildCollectionItems(orders: CollectionOrder[], products: CollectionProduct[]): CollectionItem[] {
  const productMap = new Map(products.map((product) => [product.id, product]));
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

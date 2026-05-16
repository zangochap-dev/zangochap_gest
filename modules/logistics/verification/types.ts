import type { Order, OrderItem, Product, ProductVariant } from "@prisma/client";

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  images?: { url: string }[];
}

export interface OrderItemWithProduct extends OrderItem {
  product?: ProductWithVariants | null;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
}

export interface PreviewItemData {
  url: string;
  name: string;
  size?: string;
  color?: string;
}

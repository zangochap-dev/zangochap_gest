import type { Order, OrderItem, Product, ProductImage, ProductVariant, StockLevel, User, Warehouse } from "@prisma/client";

export type PackingHistoryEntry = {
  at?: string;
  action: string;
  byName?: string;
};

export type PackingOrderItem = OrderItem;

export type PackingOrder = Omit<Order, "history"> & {
  history: PackingHistoryEntry[] | null;
  items: PackingOrderItem[];
};

export type PackingStockLevel = StockLevel & {
  warehouse: Warehouse;
};

export type PackingProductVariant = ProductVariant & {
  stockLevels: PackingStockLevel[];
};

export type ProductWithVariants = Product & {
  variants: PackingProductVariant[];
  images?: ProductImage[];
};

export type PackingUser = Pick<User, "id" | "name" | "email" | "role"> & {
  initials?: string | null;
};

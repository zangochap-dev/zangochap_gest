export interface ProductImage {
  id: string;
  url: string;
  altText?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: {
    products: number;
  };
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
  location?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  emoji?: string | null;
  description?: string | null;
  images: ProductImage[];
  category?: Category | null;
  variants: ProductVariant[];
  stock: number;
  createdAt: string | Date;
}

export interface Commune {
  id: string;
  name: string;
  deliveryFee: number;
}

export interface StockMovement {
  id: string;
  variantId: string;
  warehouseId?: string | null;
  type: 'SALE' | 'RESTOCK' | 'RETURN' | 'EXCHANGE' | 'ADJUSTMENT' | 'DAMAGE' | 'LOSS';
  quantity: number;
  reason?: string | null;
  orderId?: string | null;
  by: string;
  byName: string;
  createdAt: string | Date;
  variant: ProductVariant & { product: Product };
  warehouse?: { id: string; name: string } | null;
}

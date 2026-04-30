import { OrderStatus } from "@prisma/client";

export interface RiderOrderItem {
  id: string;
  name: string;
  size: string;
  color: string;
  qty: number;
  price: number;
  emoji?: string | null;
  image?: string | null;
  isCustom: boolean;
  isGift: boolean;
  isDelivered: boolean;
}

export interface RiderOrder {
  id: string;
  ref: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string | null;
  customerLocation?: string | null;
  commune?: string | null;
  total: number;
  deliveryFee: number;
  deliveryNote?: string | null;
  status: OrderStatus;
  items: RiderOrderItem[];
  discount: number;
  isCommercialContacted?: boolean;
  updatedAt: string | Date;
  createdAt: string | Date;
}

export interface RiderStats {
  cash: number;
  count: number;
  deliveredToday: number;
}

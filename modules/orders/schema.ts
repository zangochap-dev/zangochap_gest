import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const OrderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  size: z.string(),
  color: z.string(),
  qty: z.number().min(1),
  price: z.number().min(0),
  emoji: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  customerName: z.string().min(2, "Nom requis"),
  customerPhone: z.string().min(8, "Téléphone requis"),
  customerPhone2: z.string().optional(),
  customerLocation: z.string().optional(),
  commune: z.string().optional(),
  total: z.number().min(0),
  deliveryFee: z.number().default(0),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING),
  commercialId: z.string(),
  items: z.array(OrderItemSchema).min(1, "Au moins un article requis"),
  promoCode: z.string().optional(),
  discount: z.number().default(0),
  notes: z.string().optional(),
});

export type OrderItemInput = z.infer<typeof OrderItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

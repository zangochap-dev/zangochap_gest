import { z } from "zod";

export const CollectionStatusSchema = z.enum(["collected", "unavailable", "alternative"]);

export const MarkCollectionSchema = z.object({
  orderId: z.string().min(1),
  productId: z.string().min(1),
  status: CollectionStatusSchema,
  orderItemId: z.string().min(1).optional(),
  note: z.string().trim().max(500).optional(),
});

export type CollectionStatus = z.infer<typeof CollectionStatusSchema>;
export type MarkCollectionInput = z.infer<typeof MarkCollectionSchema>;

export type CollectionPageData = {
  toCollect: CollectionItem[];
  user: unknown;
  categories: unknown[];
  warehouses: unknown[];
};

export type CollectionItem = {
  order: any;
  item: any;
  product: any;
};

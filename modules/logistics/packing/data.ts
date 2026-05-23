import { OrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/actions";
import type { PackingOrder } from "./types";

const PACKING_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.PARTIAL,
  OrderStatus.UNAVAILABLE,
  OrderStatus.PACKED,
  OrderStatus.REPROGRAMMED,
];

export async function getPackingOrders(): Promise<PackingOrder[]> {
  return prisma.order.findMany({
    where: {
      deletedAt: null,
      status: { in: PACKING_ORDER_STATUSES },
    },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 300,
  }) as Promise<PackingOrder[]>;
}

export async function getPackingPageData() {
  const user = await getSession();
  const orders = await getPackingOrders();

  const productIds = Array.from(
    new Set(orders.flatMap((order) => order.items.map((item) => item.productId)).filter(Boolean)),
  ) as string[];

  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          variants: {
            include: {
              stockLevels: {
                include: {
                  warehouse: true,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      })
    : [];

  return JSON.parse(
    JSON.stringify({
      orders,
      products,
      user,
    }),
  );
}

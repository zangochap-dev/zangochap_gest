import { OrderStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export type SidebarCounts = {
  orders: number;
  packing: number;
  collection: number;
  toProcess: number;
  myDeliveries: number;
};

export type SidebarCountsUser = {
  id?: string | null;
  role?: string | null;
};

export const emptySidebarCounts: SidebarCounts = {
  orders: 0,
  packing: 0,
  collection: 0,
  toProcess: 0,
  myDeliveries: 0,
};

export async function getSidebarCountsForUser(user?: SidebarCountsUser | null): Promise<SidebarCounts> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeOrderWhere = { deletedAt: null };
  const publicToProcessWhere = {
    ...activeOrderWhere,
    status: OrderStatus.TO_PROCESS,
    commercialId: null,
    commercialName: "Site Web",
  };
  const role = user?.role?.toLowerCase();

  const [ordersCount, packingCount, collectionCount, toProcessCount, deliveriesCount] = await Promise.all([
    prisma.order.count({
      where: {
        ...activeOrderWhere,
        status: OrderStatus.CONFIRMED,
        createdAt: { gte: today },
      },
    }),
    prisma.order.count({
      where: {
        ...activeOrderWhere,
        status: OrderStatus.CONFIRMED,
        createdAt: { gte: today },
      },
    }),
    prisma.order.count({
      where: {
        ...activeOrderWhere,
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.PENDING, OrderStatus.PARTIAL],
        },
        createdAt: { gte: today },
      },
    }),
    prisma.order.count({
      where: publicToProcessWhere,
    }),
    user?.id && role === "livreur"
      ? prisma.order.count({
          where: {
            ...activeOrderWhere,
            deliverymanId: user.id,
            status: {
              notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
            },
          },
        })
      : Promise.resolve(0),
  ]);

  return {
    orders: ordersCount,
    packing: packingCount,
    collection: collectionCount,
    toProcess: toProcessCount,
    myDeliveries: deliveriesCount,
  };
}

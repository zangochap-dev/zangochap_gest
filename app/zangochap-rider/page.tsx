import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import DeliveryClient from "./DeliveryClient";
import { RiderOrder } from "./types";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const user = await getSession();
  
  // Security is handled by layout.tsx, but redundant check here for safety
  if (!user) redirect("/zangochap-manager");

  const ordersRaw = await prisma.order.findMany({
    where: {
      deliverymanId: user.id,
    },
    orderBy: { updatedAt: "desc" },
    include: { items: true },
    take: 50,
  });

  // Safe serialization for Client Components (converting Dates and Decimals)
  const orders: RiderOrder[] = ordersRaw.map(o => ({
    ...o,
    total: Number(o.total),
    deliveryFee: Number(o.deliveryFee),
    discount: Number(o.discount || 0),
    isCommercialContacted: o.isCommercialContacted,
    updatedAt: o.updatedAt.toISOString(),
    createdAt: o.createdAt.toISOString(),
    deliveryDate: o.deliveryDate?.toISOString() || null,
    items: o.items.map(i => ({
      ...i,
      price: Number(i.price),
      verifiedAt: i.verifiedAt?.toISOString() || null,
    })),
  })) as any;

  return (
    <DeliveryClient orders={orders} user={user} />
  );
}

import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import AdminDeliveryClient from "./AdminDeliveryClient";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  const user = await getSession();
  if (!user || user.role !== 'admin') redirect("/zangochap-manager");

  const [activeOrders, archivedOrders, deliverymen] = await Promise.all([
    prisma.order.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED'] },
      },
      orderBy: { updatedAt: "desc" },
      include: { items: true },
    }),
    prisma.order.findMany({
      where: {
        deletedAt: null,
        status: { in: ['CANCELLED', 'DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED'] },
      },
      orderBy: { updatedAt: "desc" },
      include: { items: true },
      take: 250,
    }),
    prisma.user.findMany({
      where: { role: 'LIVREUR' },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    }),
  ]);

  return (
    <>
      <Topbar title="Gestion" subtitle="des livraisons" />
      <AdminDeliveryClient 
        activeOrders={JSON.parse(JSON.stringify(activeOrders))}
        archivedOrders={JSON.parse(JSON.stringify(archivedOrders))}
        deliverymen={deliverymen} 
      />
    </>
  );
}

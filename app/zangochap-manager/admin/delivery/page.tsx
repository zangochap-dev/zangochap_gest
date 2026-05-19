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

  const orders = await prisma.order.findMany({
    where: { 
      status: { notIn: ['CANCELLED', 'DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED'] }
    },
    orderBy: { updatedAt: "desc" },
    include: { items: true },
  });

  const deliverymen = await prisma.user.findMany({
    where: { role: 'LIVREUR' },
    select: { 
      id: true, 
      name: true, 
      phone: true,
      _count: {
        select: {
          orders: {
            where: { status: { notIn: ['DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED', 'CANCELLED'] } }
          }
        }
      }
    },
  });

  return (
    <>
      <Topbar title="Gestion" subtitle="des livraisons" />
      <AdminDeliveryClient 
        orders={JSON.parse(JSON.stringify(orders))} 
        deliverymen={deliverymen} 
      />
    </>
  );
}

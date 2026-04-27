import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getSession();
  
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, commercial: true },
  });

  const products = await prisma.product.findMany({
    include: { variants: true, images: true },
    orderBy: { name: 'asc' },
  });

  const staffUsers = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, email: true },
  });

  const deliverymen = staffUsers.filter(u => u.phone); // Or keep specific logic if needed, but let's pass all to client for matching.

  return (
    <>
      <Topbar title="Gestion des" subtitle="commandes" />
      <OrdersClient 
        initialOrders={JSON.parse(JSON.stringify(orders))} 
        products={JSON.parse(JSON.stringify(products))} 
        deliverymen={deliverymen}
        staffUsers={staffUsers}
        user={user} 
      />
    </>
  );
}

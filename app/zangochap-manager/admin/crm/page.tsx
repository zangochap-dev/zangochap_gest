import React from "react";
import prisma from "@/lib/prisma";
import CRMClient from "./crm-client";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function CRMPage() {
  const [customers, buyerOrders] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { lastOrderAt: 'desc' },
    }),
    prisma.order.findMany({
      where: {
        deletedAt: null,
        status: { not: 'CANCELLED' as any },
      },
      select: {
        id: true,
        ref: true,
        customerName: true,
        customerPhone: true,
        customerPhone2: true,
        customerLocation: true,
        commune: true,
        total: true,
        deliveryFee: true,
        discount: true,
        status: true,
        commercialName: true,
        createdAt: true,
        items: { select: { name: true, qty: true, price: true, size: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    }),
  ]);

  return (
    <>
      <Topbar title="Gestion" subtitle="Clients (CRM)" />
      <CRMClient
        initialCustomers={JSON.parse(JSON.stringify(customers))}
        buyerOrders={JSON.parse(JSON.stringify(buyerOrders))}
      />
    </>
  );
}

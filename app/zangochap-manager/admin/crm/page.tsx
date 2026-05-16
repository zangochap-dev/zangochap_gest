import React from "react";
import prisma from "@/lib/prisma";
import CRMClient from "./crm-client";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function CRMPage() {
  // Yesterday boundaries
  const now = new Date();
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
  const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

  const [customers, yesterdayOrders] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { lastOrderAt: 'desc' },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        status: { notIn: ['CANCELLED', 'TO_PROCESS'] as any },
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
    }),
  ]);

  return (
    <>
      <Topbar title="Gestion" subtitle="Clients (CRM)" />
      <CRMClient
        initialCustomers={JSON.parse(JSON.stringify(customers))}
        yesterdayBuyers={JSON.parse(JSON.stringify(yesterdayOrders))}
      />
    </>
  );
}

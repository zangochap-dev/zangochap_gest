import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import PackingClient from "./PackingClient";

export const dynamic = "force-dynamic";

export default async function PackingPage() {
  const user = await getSession();

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PREPARING', 'PACKED', 'PARTIAL', 'TO_PROCESS'] }
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 200 // Limite pour éviter les problèmes de performance au chargement initial
  });

  const products = await prisma.product.findMany({
    include: { 
      variants: {
        include: {
          stockLevels: {
            include: { warehouse: true }
          }
        }
      },
      category: true,
      supplier: true
    },
  });

  return (
    <React.Suspense fallback={<div className="p-8 text-center opacity-50">Chargement du service emballage...</div>}>
      <Topbar title="Service" subtitle="emballage" />
      <PackingClient
        initialOrders={JSON.parse(JSON.stringify(orders))}
        products={JSON.parse(JSON.stringify(products))}
        user={user ? JSON.parse(JSON.stringify(user)) : null}
      />
    </React.Suspense>
  );
}

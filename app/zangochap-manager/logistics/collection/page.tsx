import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import CollectionClient from "./CollectionClient";
import { getSession } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const user = await getSession();

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const warehouses = await prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['CONFIRMED', 'TO_PROCESS', 'PENDING', 'PACKED', 'PARTIAL'] }
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 300 // Limit for performance, but enough for recent logistics
  });

  const productIds = Array.from(new Set(orders.flatMap(o => o.items.map(i => i.productId)).filter(Boolean)));

  const products = await prisma.product.findMany({
    where: { id: { in: productIds as string[] } },
    include: { variants: { include: { stockLevels: { include: { warehouse: true } } } }, category: true },
  });

  // Build toCollect items
  const productMap = new Map(products.map((p: any) => [p.id, p]));
  const toCollect: any[] = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.productId) continue;

      const product = productMap.get(item.productId);
      if (!product) continue;

      toCollect.push({
        order,
        item,
        product,
      });
    }
  }

  // Final serialization to ensure no complex objects reach the client
  const data = JSON.parse(JSON.stringify({
    toCollect,
    user,
    categories,
    warehouses
  }));

  return (
    <React.Suspense fallback={<div className="p-8 text-center opacity-50">Chargement de la collecte...</div>}>
      <Topbar title="Logistique" subtitle="Collecte" />
      <CollectionClient 
        toCollect={data.toCollect} 
        user={data.user} 
        categories={data.categories} 
        warehouses={data.warehouses}
      />
    </React.Suspense>
  );
}

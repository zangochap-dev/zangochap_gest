import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { TableCard, EmptyState, StatusBadge } from "@/components/UI";
import { formatPrice } from "@/lib/constants";
import ShortagesClient from "./ShortagesClient";

export const dynamic = "force-dynamic";

export default async function ShortagesPage() {
  const products = await prisma.product.findMany({
    where: { stock: 0 },
    include: { 
      variants: {
        include: {
          stockLevels: {
            include: { warehouse: true }
          }
        }
      }, 
      images: true 
    },
    orderBy: { name: 'asc' },
  });

  const orders = await prisma.order.findMany({
    where: { status: { notIn: ['CANCELLED', 'DELIVERED'] } },
    include: { items: true },
  });

  // For each OOS product, find waiting orders
  const oosData = products.map(p => {
    const waitingOrders: any[] = [];
    orders.forEach(o => {
      o.items.forEach(i => {
        if (i.productId === p.id) {
          waitingOrders.push({
            ref: o.ref,
            commercial: o.commercialName || '—',
            qty: i.qty,
            size: i.size,
            color: i.color,
          });
        }
      });
    });
    return { product: JSON.parse(JSON.stringify(p)), waitingOrders };
  });

  return (
    <>
      <Topbar title="Ruptures" subtitle="de stock" />
      <ShortagesClient oosData={oosData} />
    </>
  );
}

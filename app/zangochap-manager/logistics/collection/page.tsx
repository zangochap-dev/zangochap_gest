import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import CollectionClient from "./CollectionClient";
import { getSession } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const user = await getSession();

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['CONFIRMED', 'TO_PROCESS', 'PENDING'] }
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });

  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  // Build toCollect items
  const productMap = new Map(products.map(p => [p.id, p]));
  const toCollect: any[] = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.productId) continue;

      const product = productMap.get(item.productId);
      if (!product) continue;

      // Check specific variant stock
      const variant = product.variants.find((v: any) => v.size === item.size && v.color === item.color);

      // If variant exists and stock is 0, OR if no variants and global stock is 0
      const isOutOfStock = variant ? variant.stock <= 0 : product.stock <= 0;

      if (isOutOfStock) {
        toCollect.push({
          order: JSON.parse(JSON.stringify(order)),
          item: JSON.parse(JSON.stringify(item)),
          product: JSON.parse(JSON.stringify(product)),
        });
      }
    }
  }

  return (
    <>
      <Topbar title="À" subtitle="collecter" />
      <CollectionClient toCollect={toCollect} user={user} />
    </>
  );
}

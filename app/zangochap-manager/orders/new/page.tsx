import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/actions";
import NewOrderClient from "./NewOrderClient";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const user = await getSession();

  // Fetch sales counts for this user to sort by popularity
  const salesStats = user?.id ? await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        commercialId: user.id
      },
      productId: { not: null }
    },
    _sum: {
      qty: true
    }
  }) : [];

  const salesMap = new Map(salesStats.map(s => [s.productId, s._sum.qty || 0]));

  const products = await prisma.product.findMany({
    include: { variants: true, supplier: true, category: true, images: true },
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  // Sort: Popularity (sales count) DESC, then Name ASC
  const sortedProducts = products.sort((a, b) => {
    const countA = salesMap.get(a.id) || 0;
    const countB = salesMap.get(b.id) || 0;
    if (countB !== countA) return countB - countA;
    return a.name.localeCompare(b.name);
  });

  return (
    <NewOrderClient 
      products={JSON.parse(JSON.stringify(sortedProducts))} 
      user={user} 
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}

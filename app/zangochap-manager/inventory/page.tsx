import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.q) {
    const q = params.q.toLowerCase();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { variants: true, category: true, supplier: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
    }),
    prisma.product.count({ where })
  ]);

  return (
    <>
      <Topbar title="Stock" subtitle="& inventaire" />
      <InventoryClient 
        initialProducts={JSON.parse(JSON.stringify(products))} 
        totalCount={totalCount}
        currentPage={page}
        pageSize={limit}
      />
    </>
  );
}

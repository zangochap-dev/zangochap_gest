import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    filter?: string;
    q?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const user = await getSession();
  const params = await searchParams;

  const page = parseInt(params.page || "1");
  const limit = 50;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.filter === 'oos') {
    // Out of stock: No variants have stock > 0
    where.variants = {
      none: {
        stock: { gt: 0 }
      }
    };
  } else if (params.filter === 'low') {
    // Low stock: At least one variant is <= threshold 
    // Note: This is an approximation since thresholds are on product level
    // Better: Filter where product has variants and total stock is low
    where.variants = {
      some: {
        stock: { lte: 10 } // Default threshold approximation for server-side filter
      }
    };
  } else if (params.filter === 'in-stock') {
    where.variants = {
      some: {
        stock: { gt: 10 }
      }
    };
  }

  if (params.q) {
    const q = params.q.toLowerCase();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [products, totalCount, stats] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { variants: true, images: true, createdBy: true },
      take: limit,
      skip: skip,
    }),
    prisma.product.count({ where }),
    prisma.product.aggregate({
      _count: { id: true },
      _sum: { stock: true } // Note: this is legacy stock field, might not be accurate if using variants
    })
  ]);

  // For accurate stats, we might need a separate count for OOS
  const oosCount = await prisma.product.count({
    where: { variants: { none: { stock: { gt: 0 } } } }
  });

  return (
    <>
      <Topbar title="Catalogue" subtitle="produits" />
      <ProductsClient 
        initialProducts={JSON.parse(JSON.stringify(products))} 
        totalCount={totalCount}
        oosCount={oosCount}
        currentPage={page}
        pageSize={limit}
        user={user}
      />
    </>
  );
}

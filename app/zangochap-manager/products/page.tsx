import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import ProductsClient from "./ProductsClient";
import { getCategories, getSuppliers } from "@/modules/settings/actions";

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

  // Sequentialize queries to avoid "Connection terminated unexpectedly" 
  // which often happens in serverless/Neon environments with concurrent bursts
  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { variants: true, images: true, createdBy: true, category: true, subCategory: true, supplier: true },
    take: limit,
    skip: skip,
  });

  const totalCount = await prisma.product.count({ where });

  // For accurate stats, we might need a separate count for OOS
  const oosCount = await prisma.product.count({
    where: { variants: { none: { stock: { gt: 0 } } } }
  });

  const categories = await getCategories();
  const suppliers = await getSuppliers();

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
        categories={JSON.parse(JSON.stringify(categories))}
        suppliers={JSON.parse(JSON.stringify(suppliers))}
      />
    </>
  );
}

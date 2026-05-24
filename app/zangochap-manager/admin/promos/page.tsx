import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/actions";
import PromoClient from "./PromoClient";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  const user = await getSession();
  if (user?.role !== 'admin' && user?.role !== 'developer') {
    return <div className="content"><div className="empty"><h4>Accès refusé</h4></div></div>;
  }

  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { usages: true, products: true, categories: true },
  });

  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, name: true, emoji: true, categoryId: true },
    orderBy: { name: 'asc' }
  });

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <>
      <Topbar title="Gestion" subtitle="codes promos & remises" />
      <PromoClient 
        promos={JSON.parse(JSON.stringify(promos))} 
        user={user} 
        products={products}
        categories={categories}
      />
    </>
  );
}

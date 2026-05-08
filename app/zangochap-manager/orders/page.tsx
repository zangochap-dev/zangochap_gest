import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import OrdersClient from "./OrdersClient";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    commune?: string;
    q?: string;
    from?: string;
    to?: string;
    scope?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const user = await getSession();
  const params = await searchParams;
  
  const page = parseInt(params.page || "1");
  const limit = 50;
  const skip = (page - 1) * limit;

  const scope = params.scope || (user?.role === 'commercial' ? 'mine' : 'all');

  // Build filters
  const where: any = {};

  if (params.status && params.status !== 'all') {
    where.status = params.status.toUpperCase() as OrderStatus;
  } else {
    // Par défaut (ou si 'all'), on cache TOUJOURS les commandes TO_PROCESS
    // Elles sont réservées à la section "À traiter (site)"
    where.status = { not: OrderStatus.TO_PROCESS };
  }

  if (params.commune && params.commune !== 'all') {
    where.commune = params.commune;
  }

  if (params.q) {
    const q = params.q.toLowerCase();
    where.OR = [
      { ref: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { customerPhone: { contains: q } },
      { commercialName: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(params.from);
    if (params.to) where.createdAt.lte = new Date(params.to + 'T23:59:59');
  }

  // Role-based restrictions
  if (user?.role === 'commercial' && scope === 'mine') {
    // Commercials see their own OR website orders by default
    where.OR = [
      ...(where.OR || []),
      { commercialId: user.id },
      { commercialName: user.name },
      { commercialName: "Site Web" }
    ];
  }

  const [orders, totalCount, products, staffUsers] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true, commercial: true },
      take: limit,
      skip: skip,
    }),
    prisma.order.count({ where }),
    prisma.product.findMany({
      include: { variants: true, images: true },
      orderBy: { name: 'asc' },
      take: 100, // Still limited for safety, but we might need more or pagination for products too
    }),
    prisma.user.findMany({
      select: { id: true, name: true, phone: true, email: true },
    })
  ]);

  const deliverymen = staffUsers.filter(u => u.phone);

  return (
    <>
      <Topbar title="Gestion des" subtitle="commandes" />
      <OrdersClient 
        initialOrders={JSON.parse(JSON.stringify(orders))} 
        totalCount={totalCount}
        products={JSON.parse(JSON.stringify(products))} 
        deliverymen={deliverymen}
        staffUsers={staffUsers}
        user={user} 
        currentPage={page}
        pageSize={limit}
      />
    </>
  );
}

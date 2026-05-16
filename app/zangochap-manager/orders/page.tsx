import React from "react"; // Re-sync schema
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
    dateType?: string;
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
  const where: any = {
    deletedAt: null
  };

  if (params.status && params.status !== 'all') {
    where.status = params.status.toUpperCase() as OrderStatus;
  } else {
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
    const dateField = params.dateType === 'delivery' ? 'deliveryDate' : 'createdAt';
    where[dateField] = {};
    if (params.from) where[dateField].gte = new Date(params.from + 'T00:00:00');
    if (params.to) where[dateField].lte = new Date(params.to + 'T23:59:59.999');
  }

  // Role-based restrictions — use AND to combine with search, not overwrite OR
  if (user?.role === 'commercial' && scope === 'mine') {
    const scopeFilter = {
      OR: [
        { commercialId: user.id },
        { commercialName: user.name },
        { commercialName: "Site Web" }
      ]
    };
    // If there's already a search OR, combine with AND
    if (where.OR) {
      const searchOR = where.OR;
      delete where.OR;
      where.AND = [{ OR: searchOR }, scopeFilter];
    } else {
      where.OR = scopeFilter.OR;
    }
  }

  // Run only what we need: orders + count + staff (for assignment)
  const [orders, totalCount, staffUsers] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true, commercial: true },
      take: limit,
      skip: skip,
    }),
    prisma.order.count({ where }),
    prisma.user.findMany({
      select: { id: true, name: true, phone: true, email: true },
    })
  ]);

  const deliverymen = staffUsers.filter(u => u.phone);

  // Final serialization
  const data = JSON.parse(JSON.stringify({
    orders,
    deliverymen,
    staffUsers,
    user
  }));

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <>
      <Topbar title="Gestion des" subtitle="commandes" />
      <OrdersClient 
        initialOrders={data.orders} 
        totalCount={totalCount}
        products={[]}
        deliverymen={data.deliverymen}
        staffUsers={data.staffUsers}
        user={data.user} 
        currentPage={page}
        pageSize={limit}
        todayStr={todayStr}
      />
    </>
  );
}

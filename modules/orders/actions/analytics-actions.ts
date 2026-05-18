"use server";

import prisma from "@/lib/prisma";
import { ensureAuth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import {
  emptySidebarCounts,
  getSidebarCountsForUser,
  type SidebarCountsUser,
} from "@/modules/orders/actions/sidebar-counts";

// ============ SIDEBAR COUNTS ============
export async function getSidebarCounts(user?: SidebarCountsUser | string) {
  try {
    return getSidebarCountsForUser(typeof user === "string" ? { id: user } : user);
  } catch {
    return emptySidebarCounts;
  }
}

// ============ DASHBOARD STATS ============
export async function getDashboardStats() {
  const session = await ensureAuth();
  if (!['admin', 'commercial', 'stock', 'packing', 'collection'].includes(session.role.toLowerCase())) {
    throw new Error("Accès au tableau de bord restreint.");
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Core Counts
  const [todayOrders, monthOrders, productsCount, toProcessCount, packingQueueCount] = await Promise.all([
    prisma.order.count({ where: { deletedAt: null, createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { deletedAt: null, createdAt: { gte: monthStart } } }),
    prisma.product.count(),
    prisma.order.count({ where: { deletedAt: null, status: 'TO_PROCESS' } }),
    prisma.order.count({ where: { deletedAt: null, status: 'CONFIRMED' } }),
  ]);

  // 2. Revenue (Delivered only)
  const deliveredOrders = await prisma.order.findMany({
    where: { deletedAt: null, status: 'DELIVERED' },
    select: { total: true, createdAt: true, commune: true, commercialName: true }
  });

  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const todayRevenue = deliveredOrders
    .filter(o => new Date(o.createdAt) >= todayStart)
    .reduce((sum, o) => sum + o.total, 0);

  // 3. Top Communes
  const communeMap: Record<string, number> = {};
  deliveredOrders.forEach(o => {
    if (o.commune) communeMap[o.commune] = (communeMap[o.commune] || 0) + o.total;
  });
  const topCommunes = Object.entries(communeMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 4. Commercial Leaderboard
  const commercialMap: Record<string, { revenue: number; count: number }> = {};
  deliveredOrders.forEach(o => {
    const name = o.commercialName || 'Web';
    if (!commercialMap[name]) commercialMap[name] = { revenue: 0, count: 0 };
    commercialMap[name].revenue += o.total;
    commercialMap[name].count += 1;
  });
  const leaderboard = Object.entries(commercialMap)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 5. Recent Activity
  const recentOrders = await prisma.order.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { items: true }
  });

  // 6. Conversions & Trends
  const allOrdersCount = await prisma.order.count({ where: { deletedAt: null } });
  const conversionRate = allOrdersCount > 0 ? Math.round((deliveredOrders.length / allOrdersCount) * 100) : 0;

  const outOfStockCount = await prisma.product.count({
    where: {
      variants: {
        none: {
          stock: { gt: 0 }
        }
      }
    }
  });

  const activeOrders = await prisma.order.findMany({
    where: {
      deletedAt: null,
      status: { in: ['CONFIRMED', 'TO_PROCESS', 'PENDING', 'PARTIAL'] },
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const productIds = Array.from(
    new Set(activeOrders.flatMap(order => order.items.map(item => item.productId)).filter(Boolean)),
  ) as string[];

  const productsForCollection = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { variants: true },
      })
    : [];
  const productMap = new Map(productsForCollection.map(product => [product.id, product]));

  const collectionQueueCount = activeOrders.reduce((count, order) => {
    return count + order.items.filter(item => {
      if (!item.productId) return false;
      const product = productMap.get(item.productId);
      if (!product) return false;
      const requestedQty = Number(item.qty) || 1;
      const variant = item.variantId
        ? product.variants.find(v => v.id === item.variantId)
        : product.variants.find(v => v.size === item.size && v.color === item.color);
      if (variant) return Number(variant.stock || 0) < requestedQty;
      return Number(product.stock || 0) < requestedQty;
    }).length;
  }, 0);

  return {
    todayOrders,
    todayRevenue,
    totalRevenue,
    conversionRate,
    outOfStockCount,
    toProcessCount,
    packingQueueCount,
    collectionQueueCount,
    topCommunes,
    leaderboard,
    recentOrders,
    monthOrders,
    productsCount
  };
}

// ============ PERFORMANCE STATS ============
export async function getPerformanceStats(dateFrom?: string, dateTo?: string) {
  await ensureAuth(["admin"]);
  const now = new Date();
  const start = dateFrom ? new Date(dateFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();

  const whereDate: Prisma.DateTimeFilter = { gte: start, lte: end };

  // 1. COMMERCIALS
  const commercials = await prisma.user.findMany({
    where: { role: 'COMMERCIAL' },
    select: {
      id: true,
      name: true,
      orders: {
        where: { deletedAt: null, createdAt: whereDate },
        select: { total: true, status: true },
      },
    },
  });
  const commercialsStats = commercials.map(c => ({
    id: c.id,
    name: c.name,
    sales: c.orders.length,
    delivered: c.orders.filter(o => o.status === 'DELIVERED').length,
    revenue: c.orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.total, 0),
  }));

  // 2. PACKING
  const packers = await prisma.user.findMany({
    where: { role: 'PACKING' },
    select: { id: true, name: true, email: true }
  });

  const packingStats = await Promise.all(packers.map(async p => {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, packedBy: p.email, packedAt: whereDate },
      select: { status: true }
    });
    return {
      id: p.id,
      name: p.name,
      packed: orders.length,
      partial: orders.filter(o => o.status === 'PARTIAL').length,
      errors: orders.filter(o => o.status === 'PARTIAL').length,
    };
  }));

  // 3. COLLECTION
  const collectors = await prisma.user.findMany({
    where: { role: 'COLLECTION' },
    select: { id: true, name: true }
  });

  const collectorStats = await Promise.all(collectors.map(async c => {
    const records = await prisma.collectionRecord.findMany({
      where: { by: c.id, createdAt: whereDate },
      select: { status: true }
    });
    return {
      id: c.id,
      name: c.name,
      count: records.length,
      collected: records.filter(r => r.status === 'collected').length,
      unavailable: records.filter(r => r.status === 'unavailable').length,
      alternative: records.filter(r => r.status === 'alternative').length,
    };
  }));

  // 4. DELIVERY
  const deliverymen = await prisma.user.findMany({
    where: { role: 'LIVREUR' },
    select: { id: true, name: true }
  });
  const deliveryStats = await Promise.all(deliverymen.map(async d => {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, deliverymanId: d.id, createdAt: whereDate },
      select: { status: true }
    });
    return {
      id: d.id,
      name: d.name,
      total: orders.length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length,
      successRate: orders.length > 0 ? Math.round((orders.filter(o => o.status === 'DELIVERED').length / orders.length) * 100) : 0
    };
  }));

  // Summary Metrics
  const summary = {
    totalRevenue: commercialsStats.reduce((sum, c) => sum + c.revenue, 0),
    totalOrders: commercialsStats.reduce((sum, c) => sum + c.sales, 0),
    avgOrderValue: commercialsStats.reduce((sum, c) => sum + c.sales, 0) > 0
      ? Math.round(commercialsStats.reduce((sum, c) => sum + c.revenue, 0) / commercialsStats.reduce((sum, c) => sum + (c.delivered || 1), 0))
      : 0,
    globalSuccessRate: deliveryStats.length > 0
      ? Math.round(deliveryStats.reduce((sum, d) => sum + d.delivered, 0) / (deliveryStats.reduce((sum, d) => sum + d.total, 0) || 1) * 100)
      : 0
  };

  return { commercialsStats, packingStats, collectorStats, deliveryStats, summary };
}

// ============ USER PERFORMANCE DETAILS ============
export async function getUserPerformanceDetails(userId: string, role: string, dateFrom?: string, dateTo?: string) {
  const start = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
  const whereDate: Prisma.DateTimeFilter = { gte: start, lte: end };

  if (role === 'COMMERCIAL') {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, commercialId: userId, createdAt: whereDate },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { items: true }
    });
    return { orders };
  }

  if (role === 'LIVREUR') {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, deliverymanId: userId, createdAt: whereDate },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return { orders };
  }

  if (role === 'COLLECTION') {
    const records = await prisma.collectionRecord.findMany({
      where: { by: userId, createdAt: whereDate },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return { records };
  }

  if (role === 'PACKING') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { orders: [] };
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, packedBy: user.email, packedAt: whereDate },
      orderBy: { packedAt: 'desc' },
      take: 50
    });
    return { orders };
  }

  return { data: [] };
}

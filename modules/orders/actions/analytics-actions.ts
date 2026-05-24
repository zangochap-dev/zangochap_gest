"use server";

import prisma from "@/lib/prisma";
import { ensureAuth } from "@/lib/auth";
import { OrderStatus, type Prisma } from "@prisma/client";
import {
  emptySidebarCounts,
  getSidebarCountsForUser,
  type SidebarCountsUser,
} from "@/modules/orders/actions/sidebar-counts";
import { shouldShowInCollectionQueue } from "@/modules/logistics/collection/helpers";

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
  if (!['admin', 'commercial', 'stock', 'packing', 'collection', 'developer'].includes(session.role.toLowerCase())) {
    throw new Error("Accès au tableau de bord restreint.");
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const publicToProcessWhere = {
    deletedAt: null,
    status: OrderStatus.TO_PROCESS,
    commercialId: null,
    commercialName: 'Site Web',
  };

  // 1. Core Counts
  const [todayOrders, monthOrders, productsCount, toProcessCount, packingQueueCount] = await Promise.all([
    prisma.order.count({ where: { deletedAt: null, status: { not: OrderStatus.TO_PROCESS }, createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { deletedAt: null, status: { not: OrderStatus.TO_PROCESS }, createdAt: { gte: monthStart } } }),
    prisma.product.count(),
    prisma.order.count({ where: publicToProcessWhere }),
    prisma.order.count({ where: { deletedAt: null, status: OrderStatus.CONFIRMED } }),
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
    where: { deletedAt: null, status: { not: OrderStatus.TO_PROCESS } },
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
      status: { in: [OrderStatus.CONFIRMED, OrderStatus.PENDING, OrderStatus.PARTIAL] },
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
      if (!item.productId) return true;
      const product = productMap.get(item.productId);
      if (!product) return false;
      return shouldShowInCollectionQueue(order, item, product);
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

  // 1. COMMERCIALS — Based on orders they created
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
  const commercialsStats = commercials.map(c => {
    const delivered = c.orders.filter(o => o.status === 'DELIVERED');
    const cancelled = c.orders.filter(o => o.status === 'CANCELLED' || o.status === 'RETURNED');
    const revenue = delivered.reduce((sum, o) => sum + o.total, 0);
    const convRate = c.orders.length > 0 ? Math.round((delivered.length / c.orders.length) * 100) : 0;
    return {
      id: c.id,
      name: c.name,
      sales: c.orders.length,
      delivered: delivered.length,
      cancelled: cancelled.length,
      revenue,
      convRate,
      prime: Math.round(revenue * 0.01),
    };
  });

  // 2. PACKING — Based on packedBy field
  const packers = await prisma.user.findMany({
    where: { role: 'PACKING' },
    select: { id: true, name: true, email: true }
  });

  const packingStats = await Promise.all(packers.map(async p => {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, packedBy: p.email, packedAt: whereDate },
      select: { status: true }
    });
    const partialCount = orders.filter(o => o.status === 'PARTIAL').length;
    const completedCount = orders.length - partialCount;
    const score = orders.length > 0 ? Math.round((completedCount / orders.length) * 100) : 100;
    return {
      id: p.id,
      name: p.name,
      packed: orders.length,
      completed: completedCount,
      partial: partialCount,
      score,
    };
  }));

  // 3. COLLECTION — Based on CollectionRecord
  const collectors = await prisma.user.findMany({
    where: { role: 'COLLECTION' },
    select: { id: true, name: true }
  });

  const collectorStats = await Promise.all(collectors.map(async c => {
    const records = await prisma.collectionRecord.findMany({
      where: { by: c.id, createdAt: whereDate },
      select: { status: true }
    });
    const collected = records.filter(r => r.status === 'collected').length;
    const unavailable = records.filter(r => r.status === 'unavailable').length;
    const alternative = records.filter(r => r.status === 'alternative').length;
    const successRate = records.length > 0 ? Math.round((collected / records.length) * 100) : 0;
    return {
      id: c.id,
      name: c.name,
      count: records.length,
      collected,
      unavailable,
      alternative,
      successRate,
    };
  }));

  // 4. DELIVERY — Based on deliverymanId
  const deliverymen = await prisma.user.findMany({
    where: { role: 'LIVREUR' },
    select: { id: true, name: true }
  });
  const deliveryStats = await Promise.all(deliverymen.map(async d => {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, deliverymanId: d.id, createdAt: whereDate },
      select: { status: true, total: true }
    });
    const delivered = orders.filter(o => o.status === 'DELIVERED');
    const returned = orders.filter(o => o.status === 'RETURNED' || o.status === 'CANCELLED');
    const revenue = delivered.reduce((sum, o) => sum + o.total, 0);
    return {
      id: d.id,
      name: d.name,
      total: orders.length,
      delivered: delivered.length,
      returned: returned.length,
      revenue,
      successRate: orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0
    };
  }));

  // Summary Metrics
  const totalDeliverySorties = deliveryStats.reduce((sum, d) => sum + d.total, 0);
  const totalDelivered = deliveryStats.reduce((sum, d) => sum + d.delivered, 0);
  const totalPackedAll = packingStats.reduce((sum, p) => sum + p.packed, 0);
  const totalCollectedAll = collectorStats.reduce((sum, c) => sum + c.count, 0);

  const summary = {
    totalRevenue: commercialsStats.reduce((sum, c) => sum + c.revenue, 0),
    totalOrders: commercialsStats.reduce((sum, c) => sum + c.sales, 0),
    avgOrderValue: totalDelivered > 0
      ? Math.round(commercialsStats.reduce((sum, c) => sum + c.revenue, 0) / totalDelivered)
      : 0,
    globalSuccessRate: totalDeliverySorties > 0
      ? Math.round((totalDelivered / totalDeliverySorties) * 100)
      : 0,
    totalPacked: totalPackedAll,
    totalCollected: totalCollectedAll,
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
      select: {
        ref: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
        commune: true,
      }
    });
    const delivered = orders.filter(o => o.status === 'DELIVERED');
    const revenue = delivered.reduce((sum, o) => sum + o.total, 0);
    return {
      orders,
      summary: {
        total: orders.length,
        delivered: delivered.length,
        revenue,
        convRate: orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0,
      }
    };
  }

  if (role === 'LIVREUR') {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, deliverymanId: userId, createdAt: whereDate },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        ref: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
        commune: true,
        deliveredAt: true,
      }
    });
    const delivered = orders.filter(o => o.status === 'DELIVERED');
    const returned = orders.filter(o => o.status === 'RETURNED' || o.status === 'CANCELLED');
    return {
      orders,
      summary: {
        total: orders.length,
        delivered: delivered.length,
        returned: returned.length,
        revenue: delivered.reduce((sum, o) => sum + o.total, 0),
        successRate: orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0,
      }
    };
  }

  if (role === 'COLLECTION') {
    const records = await prisma.collectionRecord.findMany({
      where: { by: userId, createdAt: whereDate },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    const collected = records.filter(r => r.status === 'collected').length;
    const unavailable = records.filter(r => r.status === 'unavailable').length;
    return {
      records,
      summary: {
        total: records.length,
        collected,
        unavailable,
        successRate: records.length > 0 ? Math.round((collected / records.length) * 100) : 0,
      }
    };
  }

  if (role === 'PACKING') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { orders: [], summary: { total: 0, completed: 0, partial: 0, score: 100 } };
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, packedBy: user.email, packedAt: whereDate },
      orderBy: { packedAt: 'desc' },
      take: 50,
      select: {
        ref: true,
        customerName: true,
        status: true,
        packedAt: true,
        createdAt: true,
      }
    });
    const partialCount = orders.filter(o => o.status === 'PARTIAL').length;
    const completedCount = orders.length - partialCount;
    return {
      orders,
      summary: {
        total: orders.length,
        completed: completedCount,
        partial: partialCount,
        score: orders.length > 0 ? Math.round((completedCount / orders.length) * 100) : 100,
      }
    };
  }

  return { data: [] };
}

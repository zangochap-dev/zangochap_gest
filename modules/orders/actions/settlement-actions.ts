"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/modules/auth/actions";
import { ensureAuth } from "@/lib/auth";
import { isRole } from "../helpers";

// ============ PENDING SETTLEMENTS ============
export async function getPendingSettlements() {
  await ensureAuth(["admin"]);
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['DELIVERED', 'PARTIALLY_DELIVERED'] },
      settlementId: null,
      deliverymanId: { not: null }
    },
    include: {
      items: { select: { name: true, qty: true, price: true } },
    },
    orderBy: { createdAt: 'desc' }
  });
  return orders;
}

// ============ SETTLEMENT HISTORY ============
export async function getSettlementHistory() {
  await ensureAuth(["admin"]);
  const settlements = await prisma.settlement.findMany({
    where: { status: 'COMPLETED' },
    select: {
      id: true,
      deliverymanId: true,
      amount: true,
      productsAmount: true,
      deliveryFeesAmount: true,
      ordersCount: true,
      status: true,
      notes: true,
      by: true,
      createdAt: true,
      deliveryman: { select: { name: true } },
      orders: { select: { id: true, ref: true, customerName: true, total: true, deliveryFee: true, discount: true } },
    } as any,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return settlements;
}

// ============ CREATE SETTLEMENT ============
export async function createSettlement(deliverymanId: string, orderIds: string[], amount: number, notes?: string) {
  const session = await getSession();
  if (!session || !isRole(session, 'admin')) throw new Error("Accès refusé");

  if (!deliverymanId || orderIds.length === 0) throw new Error("Aucune commande à régler.");

  const orders = await prisma.order.findMany({
    where: {
      id: { in: orderIds },
      deliverymanId,
      settlementId: null,
      status: { in: ['DELIVERED', 'PARTIALLY_DELIVERED'] },
    }
  });
  if (orders.length !== orderIds.length) {
    throw new Error("Certaines commandes sont déjà réglées ou ne sont pas éligibles.");
  }

  const productsAmount = orders.reduce((sum, o) => sum + Math.max(0, Number(o.total || 0) - Number(o.discount || 0)), 0);
  const deliveryFeesAmount = orders.reduce((sum, o) => sum + Number(o.deliveryFee || 0), 0);
  const computedAmount = productsAmount + deliveryFeesAmount;

  const settlement = await prisma.settlement.create({
    data: {
      deliverymanId,
      amount: computedAmount,
      productsAmount,
      deliveryFeesAmount,
      ordersCount: orderIds.length,
      notes: notes || (amount !== computedAmount ? `Montant recalculé côté serveur: ${computedAmount}` : undefined),
      by: session.name,
      status: 'COMPLETED',
      orders: {
        connect: orderIds.map(id => ({ id })),
      },
    },
  });

  revalidatePath("/zangochap-manager/admin/delivery");
  revalidatePath("/zangochap-manager/admin/delivery/settlement");
  revalidatePath("/zangochap-manager/admin/settlements");
  return settlement;
}

// ============ SETTLEMENT STATS BY PAYMENT METHOD ============
export async function getSettlementStats(from?: string, to?: string, commercialId?: string, method?: string) {
  const session = await getSession();
  if (!session || !isRole(session, 'admin')) throw new Error("Accès refusé");

  const where: any = {
    paymentMethod: method ? method : { not: null },
  };

  if (commercialId) where.commercialId = commercialId;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      ref: true,
      total: true,
      deliveryFee: true,
      discount: true,
      paymentMethod: true,
      customerName: true,
      createdAt: true,
      commercialName: true,
      status: true,
    } as any,
    orderBy: { createdAt: 'desc' }
  });

  const stats: Record<string, { count: number, total: number }> = {};

  orders.forEach((o: any) => {
    const method = String(o.paymentMethod || 'Inconnu');
    if (!stats[method]) stats[method] = { count: 0, total: 0 };
    stats[method].count += 1;
    stats[method].total += (Number(o.total || 0) + Number(o.deliveryFee || 0) - Number(o.discount || 0));
  });

  const methods = Object.entries(stats).map(([method, data]) => ({
    method,
    count: data.count,
    total: data.total
  })).sort((a, b) => b.total - a.total);

  return { methods, orders } as any;
}

// ============ RIDER SETTLEMENT STATS ============
export async function getRiderSettlementStats(from?: string, to?: string, riderId?: string) {
  const session = await getSession();
  if (!session || !isRole(session, 'admin')) throw new Error("Accès refusé");

  const where: any = {};
  if (riderId) {
    where.deliverymanId = riderId;
  } else {
    where.deliverymanId = { not: null };
  }
  where.OR = [
    { status: { in: ['DELIVERED', 'PARTIALLY_DELIVERED'] }, settlementId: null },
    { status: { in: ['RETURNED', 'CANCELLED', 'REPRO_DISPO'] } },
  ];

  if (from || to) {
    where.updatedAt = {};
    if (from) where.updatedAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.updatedAt.lte = toDate;
    }
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      ref: true,
      total: true,
      deliveryFee: true,
      discount: true,
      paymentMethod: true,
      customerName: true,
      updatedAt: true,
      deliverymanId: true,
      deliverymanName: true,
      settlementId: true,
      status: true,
      returnReason: true,
      isCommercialContacted: true,
    } as any,
    orderBy: { updatedAt: 'desc' }
  });

  const riderMap: Record<string, {
    id: string,
    name: string,
    orders: any[],
    totalDeliveryFees: number,
    totalProducts: number,
    totalGrandTotal: number,
    totalCashToCollect: number,
    returnedCount: number
  }> = {};

  orders.forEach((o: any) => {
    const rId = String(o.deliverymanId || 'unknown');
    if (!riderMap[rId]) {
      riderMap[rId] = {
        id: rId,
        name: String(o.deliverymanName || 'Inconnu'),
        orders: [],
        totalDeliveryFees: 0,
        totalProducts: 0,
        totalGrandTotal: 0,
        totalCashToCollect: 0,
        returnedCount: 0
      };
    }

    const rider = riderMap[rId];
    rider.orders.push(o);

    if (['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.status)) {
      const productTotal = Number(o.total || 0) - Number(o.discount || 0);
      const deliveryFee = Number(o.deliveryFee || 0);
      const grandTotal = productTotal + deliveryFee;

      rider.totalProducts += productTotal;
      rider.totalDeliveryFees += deliveryFee;
      rider.totalGrandTotal += grandTotal;

      if (o.paymentMethod?.toLowerCase().includes('cash')) {
        rider.totalCashToCollect += grandTotal;
      }
    } else if (['RETURNED', 'CANCELLED'].includes(o.status)) {
      rider.returnedCount += 1;
    }
  });

  const riders = Object.values(riderMap).sort((a, b) => b.totalGrandTotal - a.totalGrandTotal);

  return { riders, orders };
}

// ============ TOGGLE COMMERCIAL CONTACTED ============
export async function toggleCommercialContacted(orderId: string, value: boolean) {
  const session = await getSession();
  if (!session || !isRole(session, 'admin', 'commercial')) {
    throw new Error("Accès refusé");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { isCommercialContacted: value }
  });

  revalidatePath("/zangochap-manager/admin/settlements");
  revalidatePath("/zangochap-rider");
  return { success: true };
}

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "../auth/actions";
import { syncProductStock } from "@/lib/stock-sync";
import { uploadImage } from "@/lib/upload";
import { COMMUNES } from "@/lib/constants";

// ============ ACCESS HELPER ============
// Triggering recompilation for new schema fields... (v1)
async function ensureAuth(roles?: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");
  if (roles && !roles.includes(session.role.toLowerCase())) {
    throw new Error("Action non autorisée pour votre profil.");
  }
  return session;
}

// ============ ACCESS HELPER ============
function checkOrderAccess(order: any, session: any) {
  if (!session) return false;
  const role = session.role?.toUpperCase();
  
  if (role === 'ADMIN') return true;
  
  if (role === 'COMMERCIAL') {
    return order.commercialId === session.id;
  }
  
  if (role === 'LIVREUR') {
    return order.deliverymanId === session.id;
  }

  if (['PACKING', 'STOCK', 'COLLECTION'].includes(role)) return true; // Logistics roles can access all orders for processing
  
  return false;
}

// ============ GENERATORS ============
export async function generateUniqueRef(commune?: string, typePrefix?: string) {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  const count = await prisma.order.count();
  let nextSequence = count + 1;

  if (lastOrder) {
    // Extract trailing digits using regex
    const match = lastOrder.ref.match(/(\d+)$/);
    if (match) {
      const lastSeq = parseInt(match[1], 10);
      if (!isNaN(lastSeq) && lastSeq >= count) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  // Get prefix from COMMUNES or default to 'CD'
  const communePrefix = (commune && COMMUNES[commune]) || 'BJ';
  
  const basePrefix = typePrefix && typePrefix !== 'Standard' 
    ? `${typePrefix.toUpperCase().replace(/É/g, 'E')}${communePrefix}` 
    : communePrefix;

  let finalRef = '';
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 50) {
    finalRef = `${basePrefix}${nextSequence.toString().padStart(4, '0')}`;
    const existing = await prisma.order.findUnique({ where: { ref: finalRef } });
    if (!existing) {
      isUnique = true;
    } else {
      nextSequence++;
      attempts++;
    }
  }

  return isUnique ? finalRef : `${basePrefix}${Date.now().toString().slice(-5)}`;
}

// ============ STOCK MOVEMENTS ============
async function recordStockMovement(data: {
  variantId: string;
  warehouseId?: string;
  type: 'SALE' | 'RESTOCK' | 'RETURN' | 'EXCHANGE' | 'ADJUSTMENT' | 'DAMAGE' | 'LOSS';
  quantity: number;
  reason?: string;
  orderId?: string;
  session: any;
}) {
  await prisma.stockMovement.create({
    data: {
      variantId: data.variantId,
      warehouseId: data.warehouseId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      orderId: data.orderId,
      by: data.session.id || data.session.email,
      byName: data.session.name,
    },
  });
}

export async function getOrder(id: string) {
  const session = await ensureAuth();
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });
  if (order && !checkOrderAccess(order, session)) {
    throw new Error("Accès refusé à cette commande.");
  }
  return order;
}

// ============ CREATE ORDER ============
export async function createOrder(data: {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerLocation: string;
  commune: string;
  deliveryFee?: number;
  deliveryNote?: string;
  items: Array<{
    productId?: string;
    name: string;
    size: string;
    color: string;
    qty: number;
    price: number;
    emoji?: string;
    image?: string;
    isCustom?: boolean;
    isGift?: boolean;
    notes?: string;
    desc?: string;
  }>;
  promoCode?: string;
  discount?: number;
  notes?: string;
  type?: string;
  total?: number;
  deliveryDate?: string;
  paymentMethod?: string;
  status?: string;
}) {
  const session = await getSession();

  // Process Images for custom items
  for (const item of data.items) {
    if (item.image && item.image.startsWith('data:image')) {
      item.image = await uploadImage(item.image, `order-item-${Date.now()}`);
    }
  }

  // ── ── Validation du stock désactivée pour permettre la vente en rupture (flux tendu) ── ──
  // L'ordre sera créé et passera en collecte normalement.

  const ref = await generateUniqueRef(data.commune || undefined, data.type);
  const calculatedTotal = data.items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const finalTotal = data.total !== undefined ? Number(data.total) : calculatedTotal;

  const customer = await upsertCustomerFromOrder({
    name: data.customerName,
    phone: data.customerPhone,
    phone2: data.customerPhone2,
    location: data.customerLocation,
    commune: data.commune,
    orderAmount: finalTotal + (data.deliveryFee || 0),
  });

  const order = await prisma.order.create({
    data: {
      ref,
      customerId: customer.id,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerPhone2: data.customerPhone2,
      customerLocation: data.customerLocation,
      commune: data.commune,
      total: finalTotal,
      deliveryFee: Number(data.deliveryFee || 0),
      deliveryNote: data.deliveryNote,
      paymentMethod: data.paymentMethod,
      status: (data.status as any) || (session ? 'CONFIRMED' : 'TO_PROCESS'),
      commercialId: session?.id || null,
      commercialName: session?.name || "Site Web",
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      promoCode: data.promoCode,
      discount: Number(data.discount || 0),
      notes: data.notes,
      type: data.type,
      confirmedAt: new Date(),
      confirmedByName: session ? session.name : "Client Web",
      items: {
        create: data.items.map(item => ({
          name: item.name,
          size: item.size,
          color: item.color,
          qty: Number(item.qty),
          price: Number(item.price),
          emoji: item.emoji || '📦',
          image: item.image || null,
          productId: item.isCustom ? null : item.productId,
          isCustom: item.isCustom || false,
          isGift: item.isGift || false,
          notes: item.notes || item.desc || null,
        })),
      },
      history: [
        {
          at: new Date().toISOString(),
          action: session ? "Commande créée par commercial" : "Commande passée sur le site web",
          by: session ? session.email : "public",
          byName: session ? session.name : "Client Web",
        },
      ],
    },
    include: { items: true },
  });

  // Record promo usage if applicable
  if (data.promoCode) {
    try {
      await prisma.promoUsage.create({
        data: {
          promoCode: data.promoCode,
          orderId: order.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          orderTotal: finalTotal + (data.deliveryFee || 0)
        }
      });
    } catch (e) {
      console.error("Failed to record promo usage:", e);
    }
  }

  // Removed: await decrementStockForOrder(order, session || { name: 'Site Web', email: 'public' });

  revalidatePath("/zangochap-manager/orders");
  revalidatePath("/zangochap-manager/dashboard");
  return order;
}

// ============ UPDATE STATUS ============
export async function updateOrderStatus(orderId: string, newStatus: string, note?: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Commande introuvable");

  if (!checkOrderAccess(order, session)) {
    throw new Error("Accès refusé");
  }

  // Restriction: Commercials cannot mark as DELIVERED or PARTIALLY_DELIVERED
  const deliveryStatuses = ['DELIVERED', 'PARTIALLY_DELIVERED'];
  if (deliveryStatuses.includes(newStatus.toUpperCase()) && session.role.toUpperCase() === 'COMMERCIAL') {
    throw new Error("Seul un livreur ou un administrateur peut marquer une commande comme livrée.");
  }

  const statusLabels: Record<string, string> = {
    'PENDING': 'En attente',
    'CONFIRMED': 'Confirmée',
    'PACKED': 'Emballée',
    'ON_DELIVERY': 'En livraison',
    'DELIVERED': 'Livrée',
    'CANCELLED': 'Annulée',
    'RETURNED': 'Retournée',
    'EXCHANGED': 'Echange effectué',
    'REPROGRAMMED': 'Reprogrammée',
    'TO_PROCESS': 'À traiter',
    'PARTIALLY_DELIVERED': 'Livrée partiellement'
  };

  const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
  history.push({
    at: new Date().toISOString(),
    action: `Statut : ${statusLabels[newStatus.toUpperCase()] || newStatus}`,
    by: session.email,
    byName: session.name,
  });
  if (note) {
    history.push({
      at: new Date().toISOString(),
      action: `Note: ${note}`,
      by: session.email,
      byName: session.name,
    });
  }

  const updateData: any = {
    status: newStatus.toUpperCase(),
    history,
  };

  if (newStatus.toUpperCase() === 'PACKED') {
    updateData.packedBy = session.email;
    updateData.packedByName = session.name;
    updateData.packedAt = new Date();
    // Décrémenter le stock au moment de l'emballage
    await decrementStockForOrder(order, session);
  }

  // Si on annule l'emballage ou si on annule la commande alors que le stock était décrémenté
  if (['CANCELLED', 'RETURNED', 'EXCHANGED', 'CONFIRMED', 'PENDING'].includes(newStatus.toUpperCase()) && order.stockDecremented) {
    const type = newStatus.toUpperCase() === 'EXCHANGED' ? 'EXCHANGE' : 'RETURN';
    await restoreStockForOrder(order, session, type);
    updateData.stockDecremented = false;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      ...updateData,
      returnReason: (newStatus.toUpperCase() === 'RETURNED' || newStatus.toUpperCase() === 'CANCELLED') ? note : undefined
    },
  });

  revalidatePath("/zangochap-manager/orders");
  revalidatePath("/zangochap-manager/logistics");
  return { success: true };
}

export async function markPartialDelivery(orderId: string, deliveredQuantities: Record<string, number>, note?: string, includeDeliveryFee: boolean = true) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  if (session.role.toUpperCase() === 'COMMERCIAL') {
    throw new Error("Action réservée aux livreurs et administrateurs.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Commande introuvable");

  const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
  history.push({
    at: new Date().toISOString(),
    action: `Livraison partielle effectuée. Frais de livraison: ${includeDeliveryFee ? 'Maintenus' : 'Annulés'}`,
    by: session.email,
    byName: session.name,
  });

  if (note) {
    history.push({
      at: new Date().toISOString(),
      action: `Note de retour partiel: ${note}`,
      by: session.email,
      byName: session.name,
    });
  }

  let newSubtotal = 0;

  for (const item of order.items) {
    const dQty = deliveredQuantities[item.id] || 0;
    const returnedQty = item.qty - dQty;

    if (dQty === 0) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { isDelivered: false }
      });
    } else if (dQty === item.qty) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { isDelivered: true }
      });
      newSubtotal += (item.price * item.qty);
    } else if (dQty > 0 && dQty < item.qty) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { qty: dQty, isDelivered: true }
      });
      newSubtotal += (item.price * dQty);

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          name: item.name,
          size: item.size,
          color: item.color,
          qty: returnedQty,
          price: item.price,
          emoji: item.emoji,
          image: item.image,
          productId: item.productId,
          isCustom: item.isCustom,
          isGift: item.isGift,
          isDelivered: false
        }
      });
    }

    // Restauration du stock pour la quantité retournée
    if (returnedQty > 0 && order.stockDecremented && item.productId) {
      const variant = await prisma.productVariant.findFirst({
        where: { productId: item.productId, size: item.size, color: item.color }
      });

      if (variant) {
        // RÉCUPÉRATION DE L'ENTREPÔT D'ORIGINE (depuis l'historique des mouvements)
        const lastMovement = await prisma.stockMovement.findFirst({
          where: { orderId: order.id, variantId: variant.id, type: 'SALE' },
          orderBy: { createdAt: 'desc' }
        });

        const targetWarehouseId = lastMovement?.warehouseId || (await getOrCreateDefaultWarehouse()).id;

        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: { increment: returnedQty } }
        });
        
        await prisma.stockLevel.upsert({
          where: { variantId_warehouseId: { variantId: variant.id, warehouseId: targetWarehouseId } },
          update: { quantity: { increment: returnedQty } },
          create: { variantId: variant.id, warehouseId: targetWarehouseId, quantity: returnedQty }
        });

        await recordStockMovement({
          variantId: variant.id,
          warehouseId: targetWarehouseId,
          type: 'RESTOCK',
          quantity: returnedQty,
          orderId: order.id,
          session,
          reason: `Retour suite à livraison partielle (Qté: ${returnedQty})`
        });
      }
    }
  }

  const finalDeliveryFee = includeDeliveryFee ? order.deliveryFee : 0;
  // On s'assure que le total ne tombe pas en dessous de 0 (ex: gros coupon sur petit achat partiel)
  const finalTotal = Math.max(0, newSubtotal + finalDeliveryFee - order.discount);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PARTIALLY_DELIVERED',
      total: finalTotal,
      deliveryFee: finalDeliveryFee,
      history,
    }
  });

  revalidatePath("/zangochap-manager/orders");
  return { success: true };
}

// ============ ASSIGN TO DELIVERYMAN ============
export async function assignOrderToDeliveryman(orderId: string, deliverymanId: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Commande introuvable");

  if (!checkOrderAccess(order, session)) {
    throw new Error("Accès refusé");
  }

  const driver = await prisma.user.findUnique({ where: { id: deliverymanId } });
  if (!driver) throw new Error("Livreur introuvable");

  const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
  history.push({
    at: new Date().toISOString(),
    action: `Livreur attribué : ${driver.name}`,
    by: session.email,
    byName: session.name,
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      deliverymanId,
      deliverymanName: driver.name,
      status: 'ON_DELIVERY',
      history,
    },
  });

  revalidatePath("/zangochap-manager/orders");
  revalidatePath("/zangochap-rider");
  return { success: true };
}

export async function bulkAssignOrders(orderIds: string[], deliverymanId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error("Accès refusé");

  const driver = await prisma.user.findUnique({ where: { id: deliverymanId } });
  if (!driver) throw new Error("Livreur introuvable");

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } }
  });

  await Promise.all(orders.map(order => {
    const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
    history.push({
      at: new Date().toISOString(),
      action: `Attribution groupée au livreur : ${driver.name}`,
      by: session.email,
      byName: session.name,
    });

    return prisma.order.update({
      where: { id: order.id },
      data: {
        deliverymanId: driver.id,
        deliverymanName: driver.name,
        status: 'ON_DELIVERY',
        history,
      }
    });
  }));

  revalidatePath("/zangochap-manager/admin/delivery");
  return { success: true };
}

// ============ SETTLEMENTS ============
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

export async function createSettlement(deliverymanId: string, orderIds: string[], amount: number, notes?: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error("Accès refusé");

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } }
  });

  const productsAmount = orders.reduce((sum, o) => sum + (Number(o.total || 0) - Number(o.deliveryFee || 0)), 0);
  const deliveryFeesAmount = orders.reduce((sum, o) => sum + Number(o.deliveryFee || 0), 0);

  const settlement = await prisma.settlement.create({
    data: {
      deliverymanId,
      amount,
      productsAmount,
      deliveryFeesAmount,
      ordersCount: orderIds.length,
      notes,
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

// ============ PERFORMANCE ============
export async function getPerformanceStats(dateFrom?: string, dateTo?: string) {
  await ensureAuth(["admin"]);
  const now = new Date();
  const start = dateFrom ? new Date(dateFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();

  const whereDate: any = { gte: start, lte: end };

  // 1. COMMERCIALS
  const commercials = await prisma.user.findMany({
    where: { role: 'COMMERCIAL' },
    select: {
      id: true,
      name: true,
      orders: {
        where: { createdAt: whereDate },
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
      where: { packedBy: p.email, packedAt: whereDate },
      select: { status: true }
    });
    return {
      id: p.id,
      name: p.name,
      packed: orders.length,
      partial: orders.filter(o => o.status === 'PARTIAL').length,
      errors: orders.filter(o => o.status === 'PARTIAL').length, // Simple metric for demo
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
      where: { deliverymanId: d.id, createdAt: whereDate },
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

export async function getUserPerformanceDetails(userId: string, role: string, dateFrom?: string, dateTo?: string) {
  const start = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
  const whereDate: any = { gte: start, lte: end };

  if (role === 'COMMERCIAL') {
    const orders = await prisma.order.findMany({
      where: { commercialId: userId, createdAt: whereDate },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { items: true }
    });
    return { orders };
  }
  
  if (role === 'LIVREUR') {
    const orders = await prisma.order.findMany({
      where: { deliverymanId: userId, createdAt: whereDate },
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
      where: { packedBy: user.email, packedAt: whereDate },
      orderBy: { packedAt: 'desc' },
      take: 50
    });
    return { orders };
  }

  return { data: [] };
}

export async function getDashboardStats() {
  const session = await ensureAuth();
  // Restricted access: only specific roles see the global dashboard metrics
  if (!['admin', 'commercial', 'stock', 'packing', 'collection'].includes(session.role.toLowerCase())) {
    throw new Error("Accès au tableau de bord restreint.");
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Core Counts
  const [todayOrders, totalOrders, monthOrders, productsCount] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.product.count()
  ]);

  // 2. Revenue (Delivered only)
  const deliveredOrders = await prisma.order.findMany({
    where: { status: 'DELIVERED' },
    select: { total: true, createdAt: true, commune: true, commercialName: true }
  });

  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  
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
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { items: true }
  });

  // 6. Conversions & Trends
  const allOrdersCount = await prisma.order.count();
  const conversionRate = allOrdersCount > 0 ? Math.round((deliveredOrders.length / allOrdersCount) * 100) : 0;
  
  // OOS: Consider a product OOS only if it has no stock at all (across all variants)
  const outOfStockCount = await prisma.product.count({ 
    where: { 
      variants: {
        none: {
          stock: { gt: 0 }
        }
      }
    } 
  });

  return {
    todayOrders,
    totalRevenue,
    conversionRate,
    outOfStockCount,
    topCommunes,
    leaderboard,
    recentOrders,
    monthOrders,
    productsCount
  };
}

// ============ STOCK HISTORY ============
export async function getStockHistory() {
  await ensureAuth(["admin", "stock"]);
  const movements = await prisma.stockMovement.findMany({
    include: {
      variant: { include: { product: true } },
      warehouse: true
    },
    orderBy: { createdAt: 'desc' },
    take: 500
  });
  return movements;
}

// ============ HELPERS ============
async function upsertCustomerFromOrder(data: {
  name: string; phone: string; phone2?: string; location?: string; commune?: string; orderAmount: number;
}) {
  const existing = await prisma.customer.findUnique({ where: { phone: data.phone } });
  if (existing) {
    return prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        phone2: data.phone2 || existing.phone2,
        location: data.location || existing.location,
        commune: data.commune || existing.commune,
        totalOrders: { increment: 1 },
        totalSpent: { increment: data.orderAmount },
        lastOrderAt: new Date(),
      },
    });
  }
  return prisma.customer.create({
    data: {
      name: data.name, phone: data.phone, phone2: data.phone2, location: data.location, commune: data.commune,
      totalOrders: 1, totalSpent: data.orderAmount, lastOrderAt: new Date(),
    },
  });
}

// ============ WAREHOUSE HELPERS ============
export async function getOrCreateDefaultWarehouse() {
  let warehouse = await prisma.warehouse.findFirst({
    where: { name: "EntrepÃƒÂ´t Principal" }
  });

  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: "EntrepÃƒÂ´t Principal",
        location: "SiÃƒÂ¨ge Zangochap"
      }
    });
  }
  return warehouse;
}

async function decrementStockForOrder(order: any, session: any) {
  if (order.stockDecremented) return;

  for (const item of order.items) {
    if (item.isCustom || item.isGift || !item.productId) continue;

    const variant = await prisma.productVariant.findFirst({
      where: { productId: item.productId, size: item.size, color: item.color },
    });

    if (variant) {
      const warehouse = await getOrCreateDefaultWarehouse();
      
      // Update or create stock level for this warehouse
      await prisma.stockLevel.upsert({
        where: {
          variantId_warehouseId: {
            variantId: variant.id,
            warehouseId: warehouse.id
          }
        },
        update: { quantity: { decrement: item.qty } },
        create: {
          variantId: variant.id,
          warehouseId: warehouse.id,
          quantity: -item.qty
        }
      });

      // Also update global variant stock for backward compatibility
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: { decrement: item.qty } },
      });

      await recordStockMovement({
        variantId: variant.id, 
        warehouseId: warehouse.id,
        type: 'SALE', 
        quantity: -item.qty, 
        orderId: order.id, 
        session,
      });
    }
  }

  const pIds = [...new Set(order.items.filter((i: any) => i.productId).map((i: any) => i.productId))];
  for (const pid of pIds) {
    await syncProductStock(pid as string);
  }

  await prisma.order.update({ where: { id: order.id }, data: { stockDecremented: true } });
}

async function restoreStockForOrder(order: any, session: any, type: 'RETURN' | 'EXCHANGE' | 'ADJUSTMENT' = 'RETURN') {
  for (const item of order.items) {
    if (item.isCustom || item.isGift || !item.productId) continue;
    const variant = await prisma.productVariant.findFirst({
      where: { productId: item.productId, size: item.size, color: item.color },
    });
    if (variant) {
      const warehouse = await getOrCreateDefaultWarehouse();
      
      // Update global variant stock
      await prisma.productVariant.update({ 
        where: { id: variant.id }, 
        data: { stock: { increment: item.qty } } 
      });

      // Update warehouse stock level
      await prisma.stockLevel.upsert({
        where: { variantId_warehouseId: { variantId: variant.id, warehouseId: warehouse.id } },
        update: { quantity: { increment: item.qty } },
        create: { variantId: variant.id, warehouseId: warehouse.id, quantity: item.qty }
      });

      await recordStockMovement({ 
        variantId: variant.id, 
        warehouseId: warehouse.id,
        type: type as any, 
        quantity: item.qty, 
        orderId: order.id, 
        session 
      });
    }
  }
  const pIds = [...new Set(order.items.filter((i: any) => i.productId).map((i: any) => i.productId))];
  for (const pid of pIds) {
    await syncProductStock(pid as string);
  }
}

// Additional missing exports
export async function deleteOrder(orderId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error("AccÃƒÂ¨s refusÃƒÂ©");
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (order?.stockDecremented) await restoreStockForOrder(order, session, 'ADJUSTMENT');
  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/zangochap-manager/orders");
  return { success: true };
}

export async function addOrderHistoryEntry(orderId: string, action: string) {
  const session = await getSession();
  if (!session) return;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
  history.push({ at: new Date().toISOString(), action, by: session.email, byName: session.name });
  await prisma.order.update({ where: { id: orderId }, data: { history } });
}

export async function updateOrderDetails(orderId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifiÃƒÂ©");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !checkOrderAccess(order, session)) throw new Error("AccÃƒÂ¨s refusÃƒÂ©");
  const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
  history.push({ at: new Date().toISOString(), action: "DÃƒÂ©tails modifiÃƒÂ©s", by: session.email, byName: session.name });
  await prisma.order.update({ where: { id: orderId }, data: { ...data, history } });
  revalidatePath("/zangochap-manager/orders");
}

export async function duplicateOrder(orderId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifiÃƒÂ©");

  const original = await prisma.order.findUnique({ where: { id: orderId } });
  if (!original) throw new Error("Commande originale introuvable");

  // On construit les notes en incluant le motif de l'ÃƒÂ©change si prÃƒÂ©sent
  let finalNotes = data.notes || "";
  if (data.type === 'Echange' && data.exchangeReason) {
    finalNotes = `MOTIF Ãƒâ€°CHANGE: ${data.exchangeReason}${finalNotes ? `\n---\n${finalNotes}` : ''}`;
  }

  // On utilise createOrder pour bÃƒÂ©nÃƒÂ©ficier de toute la logique de stock/client/ref
  const newOrder = await createOrder({
    ...data,
    notes: finalNotes || `DupliquÃƒÂ©e depuis ${original.ref}`,
  });

  return newOrder;
}

export async function reprogramOrder(orderId: string, deliveryDate: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifiÃƒÂ©");
  
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !checkOrderAccess(order, session)) throw new Error("AccÃƒÂ¨s refusÃƒÂ©");

  const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
  history.push({ 
    at: new Date().toISOString(), 
    action: `ReprogrammÃƒÂ©e pour le ${deliveryDate}`, 
    by: session.email, 
    byName: session.name 
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryDate: new Date(deliveryDate),
      type: "Reprogrammé",
      status: "REPROGRAMMED",
      history
    }
  });

  revalidatePath("/zangochap-manager/orders");
  return { success: true };
}

// Refreshing stats logic for new schema fields (paymentMethod)...
export async function getSettlementStats(from?: string, to?: string, commercialId?: string, method?: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error("Accès refusé");

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

export async function getRiderSettlementStats(from?: string, to?: string, riderId?: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error("Accès refusé");

  const where: any = {};
  if (riderId) {
    where.deliverymanId = riderId;
  } else {
    where.deliverymanId = { not: null };
  }

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

export async function toggleCommercialContacted(orderId: string, value: boolean) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'COMMERCIAL')) {
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


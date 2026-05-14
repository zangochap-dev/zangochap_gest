"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/modules/auth/actions";
import { syncProductStock } from "@/lib/stock-sync";
import { getOrCreateDefaultWarehouse, updateOrderStatus } from "@/modules/orders/actions";

// ============ COLLECTION RECORDS ============
export async function getCollectionRecords(filters?: { byName?: string }) {
  const where: any = {};
  if (filters?.byName) where.byName = filters.byName;

  return prisma.collectionRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function markCollection(orderId: string, productId: string, status: string, orderItemId?: string, note?: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  // Create collection record
  await prisma.collectionRecord.create({
    data: {
      orderId,
      productId,
      status,
      by: session.email,
      byName: session.name,
    },
  });

  // Add to order history
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    const labelMap: Record<string, string> = {
      collected: 'collecté',
      unavailable: 'marqué indisponible chez fournisseur',
      alternative: `collecté en alternative (${note || 'non spécifiée'})`,
    };
    const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
    history.push({
      at: new Date().toISOString(),
      action: `${session.name} a ${labelMap[status]} : ${product?.name || productId}`,
      by: session.email,
      byName: session.name,
    });
    await prisma.order.update({
      where: { id: orderId },
      data: { history },
    });
  }

  // If collected, add 1 to stock (ATOMIC at variant level if possible)
  if (status === 'collected') {
    if (orderItemId) {
      const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
      if (item && item.productId) {
        const variant = await prisma.productVariant.findFirst({
          where: { productId: item.productId, size: item.size, color: item.color }
        });

        if (variant) {
          const warehouse = await getOrCreateDefaultWarehouse();
          await prisma.stockLevel.upsert({
            where: { variantId_warehouseId: { variantId: variant.id, warehouseId: warehouse.id } },
            update: { quantity: { increment: 1 } },
            create: { variantId: variant.id, warehouseId: warehouse.id, quantity: 1 }
          });
          
          // The syncProductStock below will handle updating ProductVariant.stock and Product.stock
        }
      }
    } else {
      // Fallback for old calls without orderItemId
      await prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: 1 } },
      });
    }

    // Always synchronize to be sure
    await syncProductStock(productId);

    // --- AUTOMATION: AUTO-STATUS TRANSITION ---
    // Check if the order is now fully available (all items have stock > 0)
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    });

    if (updatedOrder && updatedOrder.status === 'CONFIRMED') {
      const allAvailable = updatedOrder.items.every(item => {
        if (!item.productId) return true; // Custom items are always "available"
        return (item.product?.stock || 0) > 0;
      });

      if (allAvailable) {
        // Utiliser la fonction standard pour déclencher le déstockage et la cohérence des statuts
        await updateOrderStatus(orderId, 'PACKED', 'Système : Tous les articles sont disponibles (Auto)');
      }
    }
  }

  revalidatePath("/zangochap-manager/logistics");
  revalidatePath("/zangochap-manager/logistics/packing");
  revalidatePath("/zangochap-manager/logistics/collection");
  revalidatePath("/zangochap-manager/orders");
  revalidatePath("/zangochap-manager/dashboard");
  return { success: true };
}

// ============ ITEMS TO COLLECT ============
export async function getItemsToCollect() {
  const orders = await prisma.order.findMany({
    where: { status: { notIn: ['CANCELLED', 'DELIVERED'] } },
    include: { items: true },
  });

  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  const productMap = new Map(products.map(p => [p.id, p]));
  const toCollect: Array<{
    order: any;
    item: any;
    product: any;
  }> = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.productId) continue;
      const product = productMap.get(item.productId);
      if (product) {
        toCollect.push({ order, item, product });
      }
    }
  }

  return toCollect;
}

// ============ VERIFICATION ============
export async function toggleItemVerification(orderItemId: string, isVerified: boolean) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const item = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      isVerified,
      verifiedAt: isVerified ? new Date() : null,
    },
    include: { order: true }
  });

  // Add history log
  const history = Array.isArray(item.order.history) ? [...(item.order.history as any[])] : [];
  history.push({
    at: new Date().toISOString(),
    action: `Vérification : Article "${item.name}" marqué comme ${isVerified ? 'VÉRIFIÉ ✓' : 'NON VÉRIFIÉ ✕'}`,
    by: session.email,
    byName: session.name,
  });

  await prisma.order.update({
    where: { id: item.orderId },
    data: { history }
  });

  revalidatePath("/zangochap-manager/logistics/verification");
  return { success: true };
}

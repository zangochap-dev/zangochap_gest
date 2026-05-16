"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "../auth/actions";
import { checkOrderAccess, getOrCreateDefaultWarehouse } from "./helpers";
import { decrementStockForOrder, restoreStockForOrder, recordStockMovement } from "./stock";

// ============ UPDATE ORDER STATUS ============
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

  // Commercials can now also mark as DELIVERED or PARTIALLY_DELIVERED if needed
  const deliveryStatuses = ['DELIVERED', 'PARTIALLY_DELIVERED'];

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
    await decrementStockForOrder(order, session);
  }

  // Restore stock for non-shipping statuses
  const shippingStatuses = ['PACKED', 'ON_DELIVERY', 'DELIVERED', 'PARTIALLY_DELIVERED'];
  if (!shippingStatuses.includes(newStatus.toUpperCase()) && order.stockDecremented) {
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
  revalidatePath("/zangochap-manager/logistics/packing");
  revalidatePath("/zangochap-manager/logistics/collection");
  revalidatePath("/zangochap-manager/dashboard");
  revalidatePath("/zangochap-rider");
  return { success: true };
}

// ============ PARTIAL DELIVERY ============
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

  // Log original quantities for audit trail before any modification
  const originalQties = order.items.map((i: any) => `${i.name}(${i.size}/${i.color}): ${i.qty}`).join(', ');
  history.push({
    at: new Date().toISOString(),
    action: `Livraison partielle effectuée. Qté originales: [${originalQties}]. Frais de livraison: ${includeDeliveryFee ? 'Maintenus' : 'Annulés'}`,
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
        data: {
          qty: dQty,
          isDelivered: true,
          notes: `[Livré partiellement: ${dQty}/${item.qty} — original: ${item.qty}]${item.notes ? ' ' + item.notes : ''}`
        }
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
          isDelivered: false,
          notes: `[Retour: ${returnedQty}/${item.qty} — original: ${item.qty}]`
        }
      });
    }

    // Restore stock for returned items
    if (returnedQty > 0 && order.stockDecremented && item.productId) {
      const variant = await prisma.productVariant.findFirst({
        where: { productId: item.productId, size: item.size, color: item.color }
      });

      if (variant) {
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
  revalidatePath("/zangochap-manager/dashboard");
  revalidatePath("/zangochap-rider");
  revalidatePath("/zangochap-manager/admin/delivery");
  return { success: true };
}

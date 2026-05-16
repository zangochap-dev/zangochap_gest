"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "../auth/actions";
import { ensureAuth } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";
import { checkOrderAccess, generateUniqueRef, upsertCustomerFromOrder } from "./helpers";
import { restoreStockForOrder } from "./stock";

// ============ GET ORDER ============
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
    variantId?: string;
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

  // Process images & resolve product IDs
  const processedItems = [];

  for (const item of data.items) {
    if (item.image && item.image.startsWith('data:image')) {
      item.image = await uploadImage(item.image, `order-item-${Date.now()}`);
    }

    // Custom items: no product creation — stored directly as OrderItem
    const productId = item.isCustom ? null : (item.productId || null);
    const variantId = item.isCustom ? null : (item.variantId || null);

    processedItems.push({
      ...item,
      productId,
      variantId
    });
  }

  const calculatedTotal = processedItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const finalTotal = data.total !== undefined ? Number(data.total) : calculatedTotal;

  const customer = await upsertCustomerFromOrder({
    name: data.customerName,
    phone: data.customerPhone,
    phone2: data.customerPhone2,
    location: data.customerLocation,
    commune: data.commune,
    orderAmount: finalTotal + (data.deliveryFee || 0),
  });

  // ATOMIC RETRY LOOP: handles concurrency collisions on 'ref'
  let order;
  for (let attempt = 0; attempt < 10; attempt++) {
    const ref = await generateUniqueRef(data.commune || undefined, data.type);
    try {
      order = await prisma.order.create({
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
            create: processedItems.map(item => ({
              name: item.name,
              size: item.size,
              color: item.color,
              qty: Number(item.qty),
              price: Number(item.price),
              emoji: item.emoji || '📦',
              image: item.image || null,
              productId: item.productId,
              variantId: item.variantId,
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
      
      // Success! Break the loop
      break;
    } catch (e: any) {
      // P2002 is Prisma code for Unique constraint violation
      const isRefCollision = e.code === 'P2002' && e.meta?.target?.includes('ref');
      if (isRefCollision && attempt < 9) {
        console.log(`Ref collision detected on ${ref}, retrying... (attempt ${attempt + 1})`);
        continue;
      }
      throw e;
    }
  }

  if (!order) throw new Error("Échec de création de la commande après plusieurs tentatives.");

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

  revalidatePath("/zangochap-manager/orders");
  revalidatePath("/zangochap-manager/dashboard");

  return { order: JSON.parse(JSON.stringify(order)) };
}

// ============ DELETE ORDER (SOFT DELETE) ============
export async function deleteOrder(orderId: string) {
  const session = await getSession();
  if (!session || !['admin', 'commercial'].includes(session.role?.toLowerCase())) throw new Error("Accès refusé");
  
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("Commande introuvable");

  // Restore stock if it was already decremented
  if (order.stockDecremented) {
    await restoreStockForOrder(order, session, 'ADJUSTMENT');
  }

  const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
  history.push({ 
    at: new Date().toISOString(), 
    action: "Commande SUPPRIMÉE (Soft Delete)", 
    by: session.email, 
    byName: session.name 
  });

  // Soft delete: Update status to CANCELLED and mark the ref
  await prisma.order.update({ 
    where: { id: orderId }, 
    data: { 
      status: 'CANCELLED',
      deletedAt: new Date(),
      ref: order.ref.startsWith('[SUPPRIMÉ]') ? order.ref : `[SUPPRIMÉ] ${order.ref}`,
      history,
      stockDecremented: false // Ensure it stays false after restoration
    } 
  });

  revalidatePath("/zangochap-manager/orders");
  revalidatePath("/zangochap-manager/dashboard");
  return { success: true };
}

// ============ UPDATE ORDER DETAILS (whitelist) ============
export async function updateOrderDetails(orderId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || !checkOrderAccess(order, session)) throw new Error("Accès refusé");

  // SECURITY: whitelist only editable fields
  const ALLOWED_FIELDS = ['customerName', 'customerPhone', 'customerPhone2', 'customerLocation', 'commune', 'deliveryFee', 'deliveryNote', 'notes', 'total'] as const;
  const sanitized: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if (data[key] !== undefined) {
      sanitized[key] = (key === 'deliveryFee' || key === 'total') ? Number(data[key]) || 0 : String(data[key]);
    }
  }

  const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
  history.push({ at: new Date().toISOString(), action: "Détails modifiés", by: session.email, byName: session.name });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { ...sanitized, history } });

      // Handle Items update if provided
      if (data.items && Array.isArray(data.items)) {
        const existingItems = await tx.orderItem.findMany({ where: { orderId: order.id } });
        const existingIds = existingItems.map(i => i.id);
        const incomingIds = data.items.map((i: any) => i.id).filter(Boolean);

        // Delete items that were removed
        const toDelete = existingIds.filter(id => !incomingIds.includes(id));
        if (toDelete.length > 0) {
          await tx.orderItem.deleteMany({ where: { id: { in: toDelete } } });
        }

        // Process images for new items and Upsert
        for (const item of data.items) {
          let imageUrl = item.image;
          if (imageUrl && imageUrl.startsWith('data:image')) {
            imageUrl = await uploadImage(imageUrl, `order-item-${Date.now()}`);
          }

          const isExisting = item.id && existingIds.includes(item.id);
          const itemData = {
            productId: item.productId || null,
            variantId: item.variantId || null,
            name: item.name,
            size: item.size || '-',
            color: item.color || '-',
            qty: parseInt(item.qty) || 1,
            price: parseInt(item.price) || 0,
            emoji: item.emoji,
            image: imageUrl,
            isCustom: item.isCustom || false,
            isGift: item.isGift || false,
          };

          if (isExisting) {
            await tx.orderItem.update({
              where: { id: item.id },
              data: itemData
            });
          } else {
            await tx.orderItem.create({
              data: {
                ...itemData,
                orderId: order.id
              }
            });
          }
        }
      }
    });
    revalidatePath("/zangochap-manager/orders");
  } catch (e: any) {
    console.error("Order Details Update Error:", e);
    throw new Error(e.message || "Erreur lors de la mise à jour des détails");
  }
}

// ============ ADD HISTORY ENTRY ============
export async function addOrderHistoryEntry(orderId: string, action: string) {
  const session = await getSession();
  if (!session) return;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
  history.push({ at: new Date().toISOString(), action, by: session.email, byName: session.name });
  await prisma.order.update({ where: { id: orderId }, data: { history } });
}

// ============ DUPLICATE ORDER ============
export async function duplicateOrder(orderId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const original = await prisma.order.findUnique({ where: { id: orderId } });
  if (!original) throw new Error("Commande originale introuvable");

  let finalNotes = data.notes || "";
  if (data.type === 'Echange' && data.exchangeReason) {
    finalNotes = `MOTIF ÉCHANGE: ${data.exchangeReason}${finalNotes ? `\n---\n${finalNotes}` : ''}`;
  }

  const newOrder = await createOrder({
    ...data,
    notes: finalNotes || `Dupliquée depuis ${original.ref}`,
  });

  return newOrder;
}

// ============ REPROGRAM ORDER ============
export async function reprogramOrder(orderId: string, deliveryDate: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !checkOrderAccess(order, session)) throw new Error("Accès refusé");

  const history = Array.isArray(order.history) ? [...(order.history as any[])] : [];
  history.push({
    at: new Date().toISOString(),
    action: `Reprogrammée pour le ${deliveryDate}`,
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

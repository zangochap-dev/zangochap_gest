import prisma from "@/lib/prisma";
import { syncProductStock } from "@/lib/stock-sync";
import { ensureAuth } from "@/lib/auth";
import { getOrCreateDefaultWarehouse } from "./helpers";

// ============ STOCK MOVEMENT RECORDING ============
export async function recordStockMovement(data: {
  variantId: string;
  warehouseId?: string;
  type: 'SALE' | 'RESTOCK' | 'RETURN' | 'EXCHANGE' | 'ADJUSTMENT' | 'DAMAGE' | 'LOSS';
  quantity: number;
  reason?: string;
  orderId?: string;
  session: any;
}, tx: any = prisma) {
  await tx.stockMovement.create({
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

// ============ DECREMENT STOCK (on packing) ============
export async function decrementStockForOrder(order: any, session: any, tx: any = prisma) {
  if (order.stockDecremented) return;

  for (const item of order.items) {
    if (item.isCustom || item.isGift || !item.productId) continue;

    const variant = item.variantId ? await tx.productVariant.findUnique({ where: { id: item.variantId } }) : await tx.productVariant.findFirst({
      where: { productId: item.productId, size: item.size, color: item.color },
    });

    if (variant) {
      // Find a warehouse that has enough stock for this variant
      const existingStock = await tx.stockLevel.findFirst({
        where: { variantId: variant.id, quantity: { gte: item.qty } },
        orderBy: { quantity: 'desc' }
      });

      const targetWarehouseId = existingStock?.warehouseId || (await getOrCreateDefaultWarehouse()).id;

      // Update or create stock level for this warehouse
      await tx.stockLevel.upsert({
        where: {
          variantId_warehouseId: {
            variantId: variant.id,
            warehouseId: targetWarehouseId
          }
        },
        update: { quantity: { decrement: item.qty } },
        create: {
          variantId: variant.id,
          warehouseId: targetWarehouseId,
          quantity: -item.qty
        }
      });

      // Also update global variant stock for backward compatibility
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: { decrement: item.qty } },
      });

      await recordStockMovement({
        variantId: variant.id,
        warehouseId: targetWarehouseId,
        type: 'SALE',
        quantity: -item.qty,
        orderId: order.id,
        session,
      }, tx);
    }
  }

  const pIds = [...new Set(order.items.filter((i: any) => i.productId).map((i: any) => i.productId))];
  for (const pid of pIds) {
    await syncProductStock(pid as string);
  }

  await tx.order.update({ where: { id: order.id }, data: { stockDecremented: true } });
}

// ============ RESTORE STOCK (on cancel/return) ============
export async function restoreStockForOrder(order: any, session: any, type: 'RETURN' | 'EXCHANGE' | 'ADJUSTMENT' = 'RETURN', tx: any = prisma) {
  for (const item of order.items) {
    if (item.isCustom || item.isGift || !item.productId) continue;
    const variant = item.variantId ? await tx.productVariant.findUnique({ where: { id: item.variantId } }) : await tx.productVariant.findFirst({
      where: { productId: item.productId, size: item.size, color: item.color },
    });
    if (variant) {
      // Find where this item was pulled from (to restore to the same warehouse)
      const lastMovement = await tx.stockMovement.findFirst({
        where: { orderId: order.id, variantId: variant.id, type: 'SALE' },
        orderBy: { createdAt: 'desc' }
      });

      const targetWarehouseId = lastMovement?.warehouseId || (await getOrCreateDefaultWarehouse()).id;

      // Update global variant stock
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: { increment: item.qty } }
      });

      // Update warehouse stock level
      await tx.stockLevel.upsert({
        where: { variantId_warehouseId: { variantId: variant.id, warehouseId: targetWarehouseId } },
        update: { quantity: { increment: item.qty } },
        create: { variantId: variant.id, warehouseId: targetWarehouseId, quantity: item.qty }
      });

      await recordStockMovement({
        variantId: variant.id,
        warehouseId: targetWarehouseId,
        type: type as any,
        quantity: item.qty,
        orderId: order.id,
        session
      }, tx);
    }
  }
  const pIds = [...new Set(order.items.filter((i: any) => i.productId).map((i: any) => i.productId))];
  for (const pid of pIds) {
    await syncProductStock(pid as string);
  }
}

// ============ STOCK HISTORY (server action) ============
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

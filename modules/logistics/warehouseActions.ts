"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/modules/auth/actions";
import { setVariantWarehouseStock, transferVariantStock } from "@/modules/orders/actions/stock";

export async function getWarehouses() {
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { stocks: true }
      },
      stocks: {
        select: { quantity: true }
      }
    }
  });

  // Calculate total items manually or via separate query if performance is an issue, 
  // but for a dozen warehouses, this is fine.
  return warehouses.map(w => ({
    ...w,
    totalItems: w.stocks.reduce((acc, s) => acc + s.quantity, 0)
  }));
}

export async function getWarehouseStock(warehouseId: string) {
  return await prisma.stockLevel.findMany({
    where: { warehouseId },
    include: {
      variant: {
        include: {
          product: {
            include: { images: true }
          }
        }
      }
    },
    orderBy: { variant: { product: { name: 'asc' } } }
  });
}

export async function deleteWarehouse(id: string) {
  // Check if warehouse has stock
  const stock = await prisma.stockLevel.aggregate({
    where: { warehouseId: id },
    _sum: { quantity: true }
  });

  if ((stock._sum.quantity || 0) > 0) {
    throw new Error("Impossible de supprimer un entrepôt qui contient encore du stock.");
  }

  await prisma.warehouse.delete({ where: { id } });
  revalidatePath("/zangochap-manager/logistics/warehouses");
  return { success: true };
}

export async function createWarehouse(data: { name: string; location?: string }) {
  const warehouse = await prisma.warehouse.create({
    data: {
      name: data.name,
      location: data.location,
    }
  });
  revalidatePath("/zangochap-manager/logistics/warehouses");
  return warehouse;
}

export async function updateWarehouse(id: string, data: { name: string; location?: string; isActive?: boolean }) {
  const warehouse = await prisma.warehouse.update({
    where: { id },
    data
  });
  revalidatePath("/zangochap-manager/logistics/warehouses");
  return warehouse;
}

export async function getVariantStockDetails(variantId: string) {
  return await prisma.stockLevel.findMany({
    where: { variantId },
    include: { warehouse: true }
  });
}

export async function transferStock(data: {
  variantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  qty: number;
  reason?: string;
}) {
  const { variantId, fromWarehouseId, toWarehouseId, qty } = data;
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  await prisma.$transaction(async (tx) => {
    await transferVariantStock({
      variantId,
      fromWarehouseId,
      toWarehouseId,
      quantity: qty,
      reason: data.reason,
      session,
    }, tx as any);
  });
  
  revalidatePath("/zangochap-manager/logistics/warehouses");
  revalidatePath("/zangochap-manager/products");
  revalidatePath("/zangochap-manager/inventory");
  return { success: true };
}

export async function adjustStock(data: {
  variantId: string;
  warehouseId: string;
  newQuantity: number;
  reason?: string;
}) {
  const { variantId, warehouseId, newQuantity } = data;
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  await prisma.$transaction(async (tx) => {
    await setVariantWarehouseStock({
      variantId,
      warehouseId,
      newQuantity,
      reason: data.reason,
      session,
    }, tx as any);
  });

  revalidatePath("/zangochap-manager/logistics/warehouses");
  revalidatePath("/zangochap-manager/products");
  revalidatePath("/zangochap-manager/inventory");
  return { success: true };
}

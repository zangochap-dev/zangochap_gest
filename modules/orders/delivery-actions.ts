"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "../auth/actions";
import { checkOrderAccess, isRole } from "./helpers";

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
      history,
    },
  });

  revalidatePath("/zangochap-manager/orders");
  revalidatePath("/zangochap-rider");
  revalidatePath("/zangochap-manager/admin/delivery");
  revalidatePath("/zangochap-manager/dashboard");
  return { success: true };
}

// ============ BULK ASSIGN ============
export async function bulkAssignOrders(orderIds: string[], deliverymanId: string) {
  const session = await getSession();
  if (!session || !isRole(session, 'admin')) throw new Error("Accès refusé");

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
        history,
      }
    });
  }));

  revalidatePath("/zangochap-manager/admin/delivery");
  return { success: true };
}

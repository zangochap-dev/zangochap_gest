"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/modules/auth/actions";

export async function toggleItemVerification(orderItemId: string, isVerified: boolean) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifie");

  const item = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      isVerified,
      verifiedAt: isVerified ? new Date() : null,
    },
    include: { order: true },
  });

  const history = Array.isArray(item.order.history) ? [...(item.order.history as any[])] : [];
  history.push({
    at: new Date().toISOString(),
    action: `Verification : Article "${item.name}" marque comme ${isVerified ? "VERIFIE" : "NON VERIFIE"}`,
    by: session.email,
    byName: session.name,
  });

  await prisma.order.update({
    where: { id: item.orderId },
    data: { history },
  });

  revalidatePath("/zangochap-manager/logistics/verification");
  revalidatePath("/zangochap-manager/logistics/packing");
  return { success: true };
}

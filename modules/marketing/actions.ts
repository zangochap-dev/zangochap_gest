"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { ensureAuth } from "@/lib/auth";

export async function createPromoCode(data: any) {
  await ensureAuth(["admin"]);
  const promo = await prisma.promoCode.create({
    data: {
      code: data.code.toUpperCase(),
      label: data.label,
      type: data.type,
      value: parseInt(data.value) || 0,
      giftProductId: data.giftProductId,
      rule: data.rule,
      minAmount: parseInt(data.minAmount) || 0,
      maxGlobalUses: data.maxGlobalUses ? parseInt(data.maxGlobalUses) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      creatorId: data.creatorId,
      isActive: true,
    }
  });

  revalidatePath("/zangochap-manager/marketing");
  return promo;
}

export async function togglePromoStatus(code: string, isActive: boolean) {
  await ensureAuth(["admin"]);
  await prisma.promoCode.update({
    where: { code },
    data: { isActive }
  });
  revalidatePath("/zangochap-manager/marketing");
}

export async function deletePromoCode(code: string) {
  await ensureAuth(["admin"]);
  await prisma.promoCode.delete({
    where: { code }
  });
  revalidatePath("/zangochap-manager/marketing");
}

"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import bcrypt from "bcryptjs";

export async function registerCustomer(formData: any) {
  const { name, phone, email, password } = formData;

  const existing = await prisma.user.findFirst({
    where: { phone }
  });

  if (existing) {
    throw new Error("Ce numéro de téléphone est déjà utilisé.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      password: hashedPassword,
      role: 'CUSTOMER'
    }
  });

  const cookieStore = await cookies();
  cookieStore.set("zc_customer", user.id, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30 // 30 jours
  });

  return { success: true };
}

export async function loginCustomer(phone: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { phone, role: 'CUSTOMER' }
  });

  if (!user) {
    throw new Error("Identifiants incorrects.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Identifiants incorrects.");
  }

  const cookieStore = await cookies();
  cookieStore.set("zc_customer", user.id, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30
  });

  return { success: true };
}

export async function logoutCustomer() {
  const cookieStore = await cookies();
  cookieStore.delete("zc_customer");
  revalidatePath("/");
}

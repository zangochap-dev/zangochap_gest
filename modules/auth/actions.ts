"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import bcrypt from "bcryptjs";

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { success: false, error: "Email et mot de passe requis." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: "Identifiants incorrects." };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { success: false, error: "Identifiants incorrects." };
  }

  const sessionData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.toLowerCase(),
    initials: user.initials || user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
  };

  (await cookies()).set("zc_user", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  if (user.role === 'LIVREUR') {
    redirect("/zangochap-manager/delivery");
  } else {
    redirect("/zangochap-manager/dashboard");
  }
}

export async function logoutAction() {
  (await cookies()).delete("zc_user");
  redirect("/zangochap-manager");
}

export async function getSession() {
  const userCookie = (await cookies()).get("zc_user");
  if (!userCookie) return null;
  try {
    return JSON.parse(userCookie.value);
  } catch {
    return null;
  }
}

// ============ ACCOUNT MANAGEMENT ============
export async function getAccounts() {
  return prisma.user.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createAccount(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) return { success: false, error: "Email déjà utilisé" };

  const initials = data.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone,
      password: hashedPassword,
      role: data.role.toUpperCase() as any,
      initials,
    },
  });

  revalidatePath("/zangochap-manager/admin/team");
  return { success: true };
}

export async function updateAccount(email: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
}) {
  const updateData: any = {};
  if (data.name) {
    updateData.name = data.name;
    updateData.initials = data.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }
  if (data.email) updateData.email = data.email.toLowerCase();
  if (data.phone) updateData.phone = data.phone;
  if (data.role) updateData.role = data.role.toUpperCase();
  if (data.password && data.password.length >= 4) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({
    where: { email },
    data: updateData,
  });

  revalidatePath("/zangochap-manager/admin/team");
  return { success: true };
}

export async function deleteAccount(email: string) {
  await prisma.user.delete({ where: { email } });
  revalidatePath("/zangochap-manager/admin/team");
  return { success: true };
}

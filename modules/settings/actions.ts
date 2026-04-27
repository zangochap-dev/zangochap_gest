"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============ CATEGORIES ============
export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } }
  });
}

export async function createCategory(name: string) {
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  const cat = await prisma.category.create({ data: { name, slug } });
  revalidatePath("/zangochap-manager/admin/settings/categories");
  return cat;
}

export async function updateCategory(id: string, name: string) {
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  const cat = await prisma.category.update({ where: { id }, data: { name, slug } });
  revalidatePath("/zangochap-manager/admin/settings/categories");
  return cat;
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/zangochap-manager/admin/settings/categories");
}

// ============ SUPPLIERS ============
export async function getSuppliers() {
  return prisma.supplier.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } }
  });
}

export async function createSupplier(name: string, contact?: string) {
  const s = await prisma.supplier.create({ data: { name, contact } });
  revalidatePath("/zangochap-manager/admin/settings/suppliers");
  return s;
}

export async function updateSupplier(id: string, name: string, contact?: string) {
  const s = await prisma.supplier.update({ where: { id }, data: { name, contact } });
  revalidatePath("/zangochap-manager/admin/settings/suppliers");
  return s;
}

export async function deleteSupplier(id: string) {
  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/zangochap-manager/admin/settings/suppliers");
}

// ============ COMMUNES ============
export async function getCommunes() {
  return prisma.commune.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createCommune(name: string, deliveryFee: number) {
  const c = await prisma.commune.create({ data: { name, deliveryFee } });
  revalidatePath("/zangochap-manager/admin/settings/communes");
  revalidatePath("/cart"); // Refresh public cart
  return c;
}

export async function updateCommune(id: string, name: string, deliveryFee: number) {
  const c = await prisma.commune.update({ where: { id }, data: { name, deliveryFee } });
  revalidatePath("/zangochap-manager/admin/settings/communes");
  revalidatePath("/cart");
  return c;
}

export async function deleteCommune(id: string) {
  await prisma.commune.delete({ where: { id } });
  revalidatePath("/zangochap-manager/admin/settings/communes");
  revalidatePath("/cart");
}

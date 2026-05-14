"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureAuth } from "@/lib/auth";

// ============ CATEGORIES ============
export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { 
      subCategories: { orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } },
      _count: { select: { products: true } } 
    }
  });
}

export async function createCategory(name: string) {
  await ensureAuth(["admin"]);
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  const cat = await prisma.category.create({ data: { name, slug } });
  revalidatePath("/zangochap-manager/admin/settings/categories");
  return cat;
}

export async function updateCategory(id: string, name: string) {
  await ensureAuth(["admin"]);
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  const cat = await prisma.category.update({ where: { id }, data: { name, slug } });
  revalidatePath("/zangochap-manager/admin/settings/categories");
  return cat;
}

export async function deleteCategory(id: string) {
  await ensureAuth(["admin"]);
  await prisma.category.delete({ where: { id } });
  revalidatePath("/zangochap-manager/admin/settings/categories");
}

// ============ SUB-CATEGORIES ============
export async function createSubCategory(categoryId: string, name: string) {
  await ensureAuth(["admin"]);
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  const subCat = await prisma.subCategory.create({ data: { name, slug, categoryId } });
  revalidatePath("/zangochap-manager/admin/settings/categories");
  return subCat;
}

export async function updateSubCategory(id: string, name: string) {
  await ensureAuth(["admin"]);
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  const subCat = await prisma.subCategory.update({ where: { id }, data: { name, slug } });
  revalidatePath("/zangochap-manager/admin/settings/categories");
  return subCat;
}

export async function deleteSubCategory(id: string) {
  await ensureAuth(["admin"]);
  await prisma.subCategory.delete({ where: { id } });
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
  await ensureAuth(["admin"]);
  const s = await prisma.supplier.create({ data: { name, contact } });
  revalidatePath("/zangochap-manager/admin/settings/suppliers");
  return s;
}

export async function updateSupplier(id: string, name: string, contact?: string) {
  await ensureAuth(["admin"]);
  const s = await prisma.supplier.update({ where: { id }, data: { name, contact } });
  revalidatePath("/zangochap-manager/admin/settings/suppliers");
  return s;
}

export async function deleteSupplier(id: string) {
  await ensureAuth(["admin"]);
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
  await ensureAuth(["admin"]);
  const c = await prisma.commune.create({ data: { name, deliveryFee } });
  revalidatePath("/zangochap-manager/admin/settings/communes");
  revalidatePath("/cart"); // Refresh public cart
  return c;
}

export async function updateCommune(id: string, name: string, deliveryFee: number) {
  await ensureAuth(["admin"]);
  const c = await prisma.commune.update({ where: { id }, data: { name, deliveryFee } });
  revalidatePath("/zangochap-manager/admin/settings/communes");
  revalidatePath("/cart");
  return c;
}

export async function deleteCommune(id: string) {
  await ensureAuth(["admin"]);
  await prisma.commune.delete({ where: { id } });
  revalidatePath("/zangochap-manager/admin/settings/communes");
  revalidatePath("/cart");
}

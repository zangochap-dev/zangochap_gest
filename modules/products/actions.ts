"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/modules/auth/actions";
import { uploadToS3 } from "@/lib/s3";
import { Prisma } from "@prisma/client";
import { getOrCreateDefaultWarehouse } from "@/modules/orders/actions";
import { syncProductStock } from "@/lib/stock-sync";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// ============ FETCH ============
export async function getProducts(filters?: {
  search?: string;
  category?: string;
  inStock?: boolean;
  outOfStock?: boolean;
}) {
  const where: any = {};
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { ref: { contains: filters.search, mode: 'insensitive' } },
      { supplier: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }
  if (filters?.category) {
    where.category = { name: filters.category };
  }
  if (filters?.outOfStock) where.stock = 0;
  if (filters?.inStock) where.stock = { gt: 0 };

  return prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { 
      variants: {
        include: {
          stockLevels: {
            include: { warehouse: true }
          }
        }
      }, 
      images: { orderBy: { position: 'asc' } }, 
      createdBy: true,
      category: true,
      supplier: true
    },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { 
      variants: {
        include: {
          stockLevels: {
            include: { warehouse: true }
          }
        }
      }, 
      images: { orderBy: { position: 'asc' } }, 
      createdBy: true,
      category: true,
      supplier: true
    },
  });
}

// ============ CREATE ============
export async function createProduct(data: {
  name: string;
  ref?: string;
  emoji?: string;
  category: string;
  price: number;
  oldPrice?: number | null;
  description?: string;
  material?: string;
  origin?: string;
  supplier: string;
  location?: string;
  lowStockThreshold?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  variants: Array<{
    size: string;
    color: string;
    stock: number;
    location?: string;
  }>;
  images?: Array<{ name: string; dataUrl: string }>;
}) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  // 1. Upload images to S3
  const imageUrls = [];
  if (data.images) {
    for (const img of data.images) {
      if (img.dataUrl.startsWith('http')) {
        imageUrls.push({ name: img.name, url: img.dataUrl });
      } else {
        const url = await uploadToS3(img.dataUrl, img.name);
        imageUrls.push({ name: img.name, url });
      }
    }
  }

  const totalStock = data.variants.reduce((sum, v) => sum + v.stock, 0);
  const mainLocation = data.variants.find(v => v.location)?.location || data.location || '';
  const slug = `${slugify(data.name)}-${Math.floor(Math.random() * 1000)}`;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      ref: data.ref || null,
      emoji: data.emoji || '📦',
      slug,
      price: new Prisma.Decimal(data.price),
      oldPrice: data.oldPrice ? new Prisma.Decimal(data.oldPrice) : null,
      description: data.description || '',
      material: data.material || '',
      origin: data.origin || '',
      stock: totalStock,
      location: mainLocation,
      lowStockThreshold: data.lowStockThreshold,
      status: data.isPublished === false ? 'DRAFT' : 'PUBLISHED',
      isFeatured: data.isFeatured ?? false,
      createdBy: { connect: { id: session.id } },
      category: data.category ? {
        connectOrCreate: {
          where: { name: data.category },
          create: { name: data.category, slug: slugify(data.category) }
        }
      } : undefined,
      supplier: data.supplier ? {
        connectOrCreate: {
          where: { name: data.supplier },
          create: { name: data.supplier }
        }
      } : undefined,
      variants: {
        create: data.variants.map(v => ({
          size: v.size,
          color: v.color,
          stock: v.stock,
          location: v.location || '',
        })),
      },
      images: {
        create: imageUrls,
      },
    },
    include: { variants: true, images: true },
  });

  // Initialize stock levels in default warehouse
  const defaultWarehouse = await getOrCreateDefaultWarehouse();
  await Promise.all(product.variants.map(v => {
    const initialQty = data.variants.find(dv => dv.size === v.size && dv.color === v.color)?.stock || 0;
    return prisma.stockLevel.create({
      data: {
        variantId: v.id,
        warehouseId: defaultWarehouse.id,
        quantity: initialQty,
        position: v.location || null
      }
    });
  }));

  revalidatePath("/zangochap-manager/products");
  revalidatePath("/zangochap-manager/dashboard");
  revalidatePath("/");
  return product;
}

// ============ UPDATE VARIANTS ============
export async function updateProductVariants(productId: string, variants: Array<{
  id?: string;
  size: string;
  color: string;
  stock: number;
  location?: string;
}>) {
  // Delete existing variants and their stock levels (Cascade will handle StockLevel)
  await prisma.productVariant.deleteMany({ where: { productId } });
  
  const defaultWarehouse = await getOrCreateDefaultWarehouse();

  // Create new variants
  for (const v of variants) {
    const newVariant = await prisma.productVariant.create({
      data: {
        productId,
        size: v.size,
        color: v.color,
        stock: v.stock,
        location: v.location || '',
      }
    });

    // Create stock level in default warehouse
    await prisma.stockLevel.create({
      data: {
        variantId: newVariant.id,
        warehouseId: defaultWarehouse.id,
        quantity: v.stock,
        position: v.location || null
      }
    });
  }

  // Synchronize stock totals
  await syncProductStock(productId);

  revalidatePath("/zangochap-manager/products");
  revalidatePath("/zangochap-manager/logistics");
  return { success: true };
}

// ============ UPDATE PRODUCT ============
export async function updateProduct(id: string, data: Partial<{
  name: string;
  ref: string | null;
  emoji: string;
  category: string;
  price: number;
  oldPrice: number | null;
  description: string;
  material: string;
  origin: string;
  supplier: string;
  location: string;
  lowStockThreshold: number;
  isPublished: boolean;
  isFeatured: boolean;
}>) {
  const updateData: any = { ...data };
  
  // Remove UI-only fields and relation strings to prevent Prisma validation errors
  delete updateData.category;
  delete updateData.supplier;
  delete updateData.isPublished;
  
  if (data.price) updateData.price = new Prisma.Decimal(data.price);
  if (data.oldPrice !== undefined) updateData.oldPrice = data.oldPrice ? new Prisma.Decimal(data.oldPrice) : null;
  if (data.isPublished !== undefined) updateData.status = data.isPublished ? 'PUBLISHED' : 'DRAFT';
  
  // Handle Category relation properly
  if (data.category && data.category.trim() !== "") {
    updateData.category = {
      connectOrCreate: {
        where: { name: data.category },
        create: { name: data.category, slug: slugify(data.category) }
      }
    };
  }

  // Handle Supplier relation properly
  if (data.supplier && data.supplier.trim() !== "") {
    updateData.supplier = {
      connectOrCreate: {
        where: { name: data.supplier },
        create: { name: data.supplier }
      }
    };
  }

  await prisma.product.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/zangochap-manager/products");
  revalidatePath("/");
  return { success: true };
}

// ============ DELETE ============
export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/zangochap-manager/products");
  revalidatePath("/");
  return { success: true };
}

// ============ MARK SENT TO SUPPLIER ============
export async function markProductSent(productId: string) {
  await prisma.product.update({
    where: { id: productId },
    data: { sentToSupplierAt: new Date() },
  });
  revalidatePath("/zangochap-manager/products");
  return { success: true };
}

// ============ MAINTENANCE ============
export async function fixAllProductStocks() {
  const products = await prisma.product.findMany({
    select: { id: true }
  });

  let fixedCount = 0;
  for (const p of products) {
    await syncProductStock(p.id);
    fixedCount++;
  }

  revalidatePath("/zangochap-manager/products");
  revalidatePath("/zangochap-manager/dashboard");
  revalidatePath("/");
  
  return { success: true, count: fixedCount };
}

// ============ STOCK MOVEMENTS ============
export async function getStockMovements(productId?: string) {
  const where: any = {};
  if (productId) {
    where.variant = { productId };
  }

  return prisma.stockMovement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      variant: {
        include: { product: true }
      },
      warehouse: true
    },
    take: 50
  });
}

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/modules/auth/actions";
import { ensureAuth } from "@/lib/auth";
import { uploadImage, deleteImageFromR2 } from "@/lib/upload";
import { Prisma } from "@prisma/client";
import { getOrCreateDefaultWarehouse } from "@/modules/orders/helpers";
import { syncProductStock } from "@/lib/stock-sync";
import { getBestAutomaticDiscount, CartItem } from "@/lib/promo-engine";


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
  subCategory?: string;
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
  if (filters?.subCategory) {
    where.subCategory = { name: filters.subCategory };
  }
  if (filters?.outOfStock) where.stock = 0;
  if (filters?.inStock) where.stock = { gt: 0 };

  const products = await prisma.product.findMany({
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
      subCategory: true,
      supplier: true
    },
  });

  return JSON.parse(JSON.stringify(products));
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
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
      subCategory: true,
      supplier: true
    },
  });

  return JSON.parse(JSON.stringify(product));
}

// ============ CREATE ============
export async function createProduct(data: {
  name: string;
  ref?: string;
  emoji?: string;
  category: string;
  subCategory?: string;
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
  warehouseId?: string;
}) {
  const session = await ensureAuth(["admin", "stock", "commercial"]);

  // 1. Upload images to S3
  const imageUrls = [];
  if (data.images) {
    for (const img of data.images) {
      if (img.dataUrl.startsWith('http')) {
        imageUrls.push({ name: img.name, url: img.dataUrl });
      } else {
        const url = await uploadImage(img.dataUrl, img.name);
        imageUrls.push({ name: img.name, url });
      }
    }
  }

  const totalStock = data.variants.reduce((sum, v) => sum + v.stock, 0);
  const mainLocation = data.variants.find(v => v.location)?.location || data.location || '';
  const slug = `${slugify(data.name)}-${Math.floor(Math.random() * 1000)}`;

  let resolvedCategoryId: string | undefined = undefined;
  if (data.category && data.category.trim() !== '') {
    const cat = await prisma.category.upsert({
      where: { name: data.category.trim() },
      update: {},
      create: { name: data.category.trim(), slug: slugify(data.category) }
    });
    resolvedCategoryId = cat.id;
  }

  let resolvedSubCategoryId: string | undefined = undefined;
  if (data.subCategory && data.subCategory.trim() !== '' && resolvedCategoryId) {
    const subCatSlug = slugify(data.subCategory);
    const subCat = await prisma.subCategory.upsert({
      where: { slug: subCatSlug },
      update: {},
      create: { name: data.subCategory.trim(), slug: subCatSlug, categoryId: resolvedCategoryId }
    });
    resolvedSubCategoryId = subCat.id;
  }

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
      category: resolvedCategoryId ? { connect: { id: resolvedCategoryId } } : undefined,
      subCategory: resolvedSubCategoryId ? { connect: { id: resolvedSubCategoryId } } : undefined,
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

  // Initialize stock levels in selected or default warehouse
  const targetWarehouseId = data.warehouseId || (await getOrCreateDefaultWarehouse()).id;
  await Promise.all(product.variants.map(v => {
    const initialQty = data.variants.find(dv => dv.size === v.size && dv.color === v.color)?.stock || 0;
    return prisma.stockLevel.create({
      data: {
        variantId: v.id,
        warehouseId: targetWarehouseId,
        quantity: initialQty,
        position: v.location || null
      }
    });
  }));

  revalidatePath("/zangochap-manager/products");
  revalidatePath("/zangochap-manager/dashboard");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(product));
}

// ============ UPDATE VARIANTS ============
export async function updateProductVariants(productId: string, variants: Array<{
  id?: string;
  size: string;
  color: string;
  stock: number;
  location?: string;
}>) {
  await ensureAuth(["admin", "stock", "packing", "collection", "commercial"]);
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
  revalidatePath("/zangochap-manager/logistics/packing");
  revalidatePath("/zangochap-manager/logistics/collection");
  revalidatePath("/zangochap-manager/dashboard");
  revalidatePath("/");
  return { success: true };
}

// ============ UPDATE PRODUCT ============
export async function updateProduct(id: string, data: Partial<{
  name: string;
  ref: string | null;
  emoji: string;
  category: string;
  subCategory: string;
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
  variants?: Array<{ size: string; color: string; stock: number; location: string }>;
  images?: Array<{ name: string; dataUrl: string }>;
  warehouseId?: string;
}>) {
  await ensureAuth(["admin", "stock", "commercial"]);
  const updateData: any = { ...data };
  
  // Remove UI-only fields and relation strings to prevent Prisma validation errors
  delete updateData.category;
  delete updateData.subCategory;
  delete updateData.supplier;
  delete updateData.isPublished;
  delete updateData.variants;
  delete updateData.images;
  delete updateData.warehouseId;
  
  if (data.price) updateData.price = new Prisma.Decimal(data.price);
  if (data.oldPrice !== undefined) updateData.oldPrice = data.oldPrice ? new Prisma.Decimal(data.oldPrice) : null;
  if (data.isPublished !== undefined) updateData.status = data.isPublished ? 'PUBLISHED' : 'DRAFT';
  
  // Handle Category & SubCategory
  if (data.category !== undefined) {
    if (data.category && data.category.trim() !== "") {
      const cat = await prisma.category.upsert({
        where: { name: data.category.trim() },
        update: {},
        create: { name: data.category.trim(), slug: slugify(data.category) }
      });
      updateData.category = { connect: { id: cat.id } };
      
      if (data.subCategory && data.subCategory.trim() !== "") {
        const subCatSlug = slugify(data.subCategory);
        const subCat = await prisma.subCategory.upsert({
          where: { slug: subCatSlug },
          update: {},
          create: { name: data.subCategory.trim(), slug: subCatSlug, categoryId: cat.id }
        });
        updateData.subCategory = { connect: { id: subCat.id } };
      } else if (data.subCategory === "") {
        updateData.subCategory = { disconnect: true };
      }
    } else {
      updateData.category = { disconnect: true };
      updateData.subCategory = { disconnect: true };
    }
  }

  // Handle Supplier
  if (data.supplier !== undefined) {
    if (data.supplier && data.supplier.trim() !== "") {
      updateData.supplier = {
        connectOrCreate: {
          where: { name: data.supplier.trim() },
          create: { name: data.supplier.trim() }
        }
      };
    } else {
      updateData.supplier = { disconnect: true };
    }
  }

  // Handle Variants
  if (data.variants) {
    // Delete existing variants
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    
    const targetWarehouseId = data.warehouseId || (await getOrCreateDefaultWarehouse()).id;
    
    // Create new variants
    for (const v of data.variants) {
      const newVariant = await prisma.productVariant.create({
        data: {
          productId: id,
          size: v.size,
          color: v.color,
          stock: v.stock,
          location: v.location || '',
        }
      });
      // Create stock level in targeted warehouse
      await prisma.stockLevel.create({
        data: {
          variantId: newVariant.id,
          warehouseId: targetWarehouseId,
          quantity: v.stock,
          position: v.location || null
        }
      });
    }
    
    // Sync total stock
    const totalStock = data.variants.reduce((sum, v) => sum + v.stock, 0);
    updateData.stock = totalStock;
  }

  // Handle Images
  if (data.images) {
    // 1. Get current images to cleanup R2 later
    const oldImages = await prisma.productImage.findMany({
      where: { productId: id }
    });

    // Delete old image records
    await prisma.productImage.deleteMany({ where: { productId: id } });
    
    const imageUrls = [];
    for (const img of data.images) {
      if (img.dataUrl.startsWith('http')) {
        imageUrls.push({ name: img.name, url: img.dataUrl });
      } else {
        const url = await uploadImage(img.dataUrl, img.name);
        imageUrls.push({ name: img.name, url });
      }
    }
    
    updateData.images = {
      create: imageUrls
    };

    // 2. Cleanup R2 for removed images
    const newUrls = imageUrls.map(i => i.url);
    for (const oldImg of oldImages) {
      if (!newUrls.includes(oldImg.url)) {
        // Check if this image URL is used by other products before deleting from R2
        const isUsedElsewhere = await prisma.productImage.findFirst({
          where: {
            url: oldImg.url,
            productId: { not: id }
          }
        });

        if (!isUsedElsewhere) {
          await deleteImageFromR2(oldImg.url);
        }
      }
    }
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
  await ensureAuth(["admin", "commercial"]);

  // Fetch product with images to cleanup R2
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true }
  });

  if (product) {
    for (const img of product.images) {
      // Check if this image URL is used by other products before deleting from R2
      const isUsedElsewhere = await prisma.productImage.findFirst({
        where: {
          url: img.url,
          productId: { not: id }
        }
      });

      if (!isUsedElsewhere) {
        await deleteImageFromR2(img.url);
      }
    }
  }

  await prisma.product.delete({ where: { id } });
  revalidatePath("/zangochap-manager/products");
  revalidatePath("/");
  return { success: true };
}

// ============ MARK SENT TO SUPPLIER ============
export async function markProductSent(productId: string) {
  await ensureAuth(["admin", "stock", "collection", "commercial"]);
  await prisma.product.update({
    where: { id: productId },
    data: { sentToSupplierAt: new Date() },
  });
  revalidatePath("/zangochap-manager/products");
  return { success: true };
}

// ============ MAINTENANCE ============
export async function fixAllProductStocks() {
  await ensureAuth(["admin"]);
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

export async function getAutomaticDiscountAction(cart: CartItem[]) {
  try {
    return await getBestAutomaticDiscount(cart);
  } catch (e) {
    console.error("Error getting automatic discount:", e);
    return { code: null, amount: 0, label: null };
  }
}

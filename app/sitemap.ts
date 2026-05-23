import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Dynamic product pages
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      category: {
        name: {
          notIn: ["Entrepots", "Entrepôts", "cadeau", "Cadeau", "Gift"],
        },
      },
    },
    select: { id: true, slug: true, updatedAt: true },
  });

  const productPages: MetadataRoute.Sitemap = products.map((product: { id: string; slug: string; updatedAt: Date }) => ({
    url: `${SITE_URL}/product/${product.slug || product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Category pages (as search queries)
  const categories = await prisma.category.findMany({
    where: {
      name: {
        notIn: ["Entrepots", "Entrepôts", "cadeau", "Cadeau", "Gift"],
      },
    },
    select: { name: true },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat: { name: string }) => ({
    url: `${SITE_URL}/shop?category=${encodeURIComponent(cat.name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const subCategories = await prisma.subCategory.findMany({
    where: {
      category: {
        name: {
          notIn: ["Entrepots", "Entrepôts", "cadeau", "Cadeau", "Gift"],
        },
      },
    },
    select: { name: true },
  });

  const subCategoryPages: MetadataRoute.Sitemap = subCategories.map((sub: { name: string }) => ({
    url: `${SITE_URL}/shop?subCategory=${encodeURIComponent(sub.name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...subCategoryPages];
}

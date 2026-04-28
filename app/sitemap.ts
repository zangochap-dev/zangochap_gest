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
    {
      url: `${SITE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/compte`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Dynamic product pages
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, updatedAt: true },
  });

  const productPages: MetadataRoute.Sitemap = products.map((product: { id: string; updatedAt: Date }) => ({
    url: `${SITE_URL}/product/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Category pages (as search queries)
  const categories = await prisma.category.findMany({
    select: { name: true },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat: { name: string }) => ({
    url: `${SITE_URL}/search?q=${encodeURIComponent(cat.name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}

import React from "react";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import PublicLayout from "@/components/public/PublicLayout";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import {
  SITE_NAME,
  SITE_URL,
  SITE_LOCALE,
  SITE_CURRENCY,
  getProductSchema,
  getBreadcrumbSchema,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

// ============ DYNAMIC METADATA ============
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true, category: true },
  });

  if (!product) {
    return {
      title: `Produit introuvable — ${SITE_NAME}`,
    };
  }

  const title = `${product.name} — ${SITE_NAME}`;
  const description =
    product.description ||
    `Achetez ${product.name} sur ${SITE_NAME}. Livraison rapide à Abidjan et en Côte d'Ivoire.`;
  const imageUrl = product.images?.[0]?.url || `${SITE_URL}/og-image.png`;
  const productUrl = `${SITE_URL}/product/${product.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${product.id}`,
    },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url: productUrl,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 1067,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    other: {
      // Facebook / Instagram Shopping
      "product:price:amount": String(Number(product.price)),
      "product:price:currency": SITE_CURRENCY,
      "product:availability": "in stock",
      "product:condition": "new",
      "product:brand": SITE_NAME,
      ...(product.category && {
        "product:category": product.category.name,
      }),
    },
  };
}

// ============ PAGE COMPONENT ============
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true, variants: true, category: true },
  });

  if (!product) notFound();

  // JSON-LD Product Schema
  const productSchema = getProductSchema({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    slug: product.slug,
    images: product.images,
    category: product.category,
    material: product.material,
    origin: product.origin,
    stock: product.stock,
    variants: product.variants,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: SITE_URL },
    { name: "Boutique", url: `${SITE_URL}/shop` },
    ...(product.category
      ? [
          {
            name: product.category.name,
            url: `${SITE_URL}/shop?category=${encodeURIComponent(product.category.name)}`,
          },
        ]
      : []),
    { name: product.name, url: `${SITE_URL}/product/${product.id}` },
  ]);

  return (
    <PublicLayout>
      {/* Product JSON-LD — recognized by Google Shopping, Facebook, Pinterest */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <ProductDetailClient
        product={JSON.parse(JSON.stringify(product))}
      />
    </PublicLayout>
  );
}

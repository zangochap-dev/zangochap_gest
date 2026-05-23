import React, { Suspense } from "react";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getHomeCmsContent } from "@/modules/cms/actions";
import PublicLayout from "@/components/public/PublicLayout";
import ShopClient from "./ShopClient";
import {
  SITE_NAME,
  SITE_URL,
  SITE_LOCALE,
  DEFAULT_OG_IMAGE,
  getBreadcrumbSchema,
  getProductListSchema,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Boutique — ${SITE_NAME} | Tous nos articles mode`,
  description:
    "Parcourez notre collection complète de vêtements, chaussures et accessoires. Filtrez par catégorie, taille et prix. Livraison rapide à Abidjan et en Côte d'Ivoire.",
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: `${SITE_URL}/shop`,
    siteName: SITE_NAME,
    title: `Boutique — ${SITE_NAME}`,
    description:
      "Découvrez toute notre collection de mode. Vêtements, chaussures et accessoires pour homme et femme.",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `Boutique ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Boutique — ${SITE_NAME}`,
    description:
      "Toute notre collection de mode. Vêtements, chaussures et accessoires.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    where: { 
      status: 'PUBLISHED',
      category: {
        name: {
          notIn: ['Entrepôts', 'cadeau', 'Cadeau', 'Gift']
        }
      }
    },
    include: { images: true, category: true, variants: true, subCategory: true },
    orderBy: { createdAt: 'desc' }
  });

  const cms = await getHomeCmsContent();
  const featuredCategoryIds = cms.featuredCategoryIds || [];

  const categories = await prisma.category.findMany({
    where: featuredCategoryIds.length > 0 ? { id: { in: featuredCategoryIds } } : undefined,
    include: { 
      subCategories: true,
      _count: { select: { products: true } } 
    }
  });

  // JSON-LD
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: SITE_URL },
    { name: "Boutique", url: `${SITE_URL}/shop` },
  ]);

  const productListSchema = getProductListSchema(
    products.map((p: { id: string; slug: string; name: string; price: unknown; images: { url: string }[] }) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: Number(p.price),
      images: p.images,
    })),
    "Notre Collection"
  );

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productListSchema),
        }}
      />
      <Suspense fallback={<div className="min-h-screen py-10 text-center">Chargement de la boutique...</div>}>
        <ShopClient 
          initialProducts={JSON.parse(JSON.stringify(products))} 
          categories={JSON.parse(JSON.stringify(categories))}
        />
      </Suspense>
    </PublicLayout>
  );
}

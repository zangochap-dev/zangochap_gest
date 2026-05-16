import React from "react";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import PublicLayout from "@/components/public/PublicLayout";
import HomeClient from "./HomeClient";
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  SITE_TAGLINE,
  SITE_LOCALE,
  DEFAULT_OG_IMAGE,
  getOrganizationSchema,
  getWebSiteSchema,
  getProductListSchema,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  keywords: [
    "mode", "vêtements", "Côte d'Ivoire", "Abidjan", "boutique en ligne",
    "chaussures", "accessoires", "mode homme", "mode femme",
    "livraison Abidjan", "fashion", "Zangochap", "shopping CI",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Boutique de mode en ligne`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
    creator: "@zangochap",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when ready
    // google: "your-google-verification-code",
  },
};

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    include: { images: true, category: true },
    orderBy: { createdAt: 'desc' },
    take: 40
  });

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } }
  });

  const latestPromo = await prisma.promoCode.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  // JSON-LD Structured Data
  const organizationSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();
  const productListSchema = getProductListSchema(
    products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      images: p.images,
    })),
    "Nouveautés Zangochap"
  );

  return (
    <PublicLayout>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webSiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productListSchema),
        }}
      />
      <HomeClient 
        products={JSON.parse(JSON.stringify(products))} 
        categories={JSON.parse(JSON.stringify(categories))}
        latestPromo={JSON.parse(JSON.stringify(latestPromo))}
      />
    </PublicLayout>
  );
}

import React from "react";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import PublicLayout from "@/components/public/PublicLayout";
import HomeClient from "./HomeClient";
import { getHomeCmsContent } from "@/modules/cms/actions";
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  SITE_TAGLINE,
  SITE_LOCALE,
  DEFAULT_OG_IMAGE,
  getAbsoluteUrl,
  getOrganizationSchema,
  getWebSiteSchema,
  getProductListSchema,
  parseSeoKeywords,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getHomeCmsContent();
  const title = cms.siteSeoTitle || `${SITE_NAME} - ${SITE_TAGLINE}`;
  const description = cms.siteSeoDescription || SITE_DESCRIPTION;
  const image = getAbsoluteUrl(cms.siteOgImage || DEFAULT_OG_IMAGE);
  const keywords = parseSeoKeywords(cms.siteSeoKeywords);

  return {
    title,
    description,
    keywords: keywords.length > 0
      ? keywords
      : [
        "mode", "vetements", "Cote d'Ivoire", "Abidjan", "boutique en ligne",
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
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - Boutique de mode en ligne`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
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
}

export default async function HomePage() {
  const productsPromise = prisma.product.findMany({
    where: { 
      status: 'PUBLISHED',
      category: {
        name: {
          notIn: ['Entrepôts', 'cadeau', 'Cadeau', 'Gift']
        }
      }
    },
    include: { images: true, category: true, variants: true },
    orderBy: { createdAt: 'desc' },
    take: 40
  });

  const categoriesPromise = prisma.category.findMany({
    include: { _count: { select: { products: true } } }
  });

  const latestPromoPromise = prisma.promoCode.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  const [products, categories, latestPromo, homeCms] = await Promise.all([
    productsPromise,
    categoriesPromise,
    latestPromoPromise,
    getHomeCmsContent(),
  ]);

  // JSON-LD Structured Data
  const organizationSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();
  const productListSchema = getProductListSchema(
    products.map((p: { id: string; slug: string; name: string; price: unknown; images: { url: string }[] }) => ({
      id: p.id,
      slug: p.slug,
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
        cms={homeCms}
      />
    </PublicLayout>
  );
}

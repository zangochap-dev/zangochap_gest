import React from "react";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import PublicLayout from "@/components/public/PublicLayout";
import {
  SITE_NAME,
  SITE_URL,
  SITE_LOCALE,
  DEFAULT_OG_IMAGE,
  getBreadcrumbSchema,
} from "@/lib/seo";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q || "";

  return {
    title: query
      ? `Résultats pour "${query}" — ${SITE_NAME}`
      : `Recherche — ${SITE_NAME}`,
    description: query
      ? `Résultats de recherche pour "${query}" sur ${SITE_NAME}. Trouvez vêtements, chaussures et accessoires.`
      : `Recherchez parmi notre collection de mode sur ${SITE_NAME}.`,
    robots: { index: false, follow: true },
    alternates: {
      canonical: "/search",
    },
    openGraph: {
      type: "website",
      locale: SITE_LOCALE,
      url: `${SITE_URL}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      siteName: SITE_NAME,
      title: query
        ? `Résultats pour "${query}" — ${SITE_NAME}`
        : `Recherche — ${SITE_NAME}`,
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q || "";

  const products = await prisma.product.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        {
          category: {
            name: {
              notIn: ['Entrepôts', 'cadeau', 'Cadeau', 'Gift']
            }
          }
        }
      ],
      status: "PUBLISHED",
    },
    include: { images: true },
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: SITE_URL },
    { name: "Recherche", url: `${SITE_URL}/search` },
  ]);

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <SearchClient query={query} products={JSON.parse(JSON.stringify(products))} />
    </PublicLayout>
  );
}

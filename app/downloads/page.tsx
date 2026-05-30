import type { Metadata } from "next";
import PublicLayout from "@/components/public/PublicLayout";
import DownloadClient from "./DownloadClient";
import prisma from "@/lib/prisma";
import {
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  getAbsoluteUrl,
  getBreadcrumbSchema,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const title = `Telecharger l'application ${SITE_NAME}`;
const description =
  "Installez l'application Zangochap sur iPhone ou Android pour decouvrir les nouveautes, commander plus vite et suivre vos achats.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/downloads",
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: `${SITE_URL}/downloads`,
    siteName: SITE_NAME,
    title,
    description,
    images: [
      {
        url: getAbsoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Application mobile`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [getAbsoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

export default async function DownloadsPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: SITE_URL },
    { name: "Telecharger l'application", url: `${SITE_URL}/downloads` },
  ]);
  const availableProducts = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      category: {
        name: {
          notIn: ["Entrepots", "Entrepôts", "cadeau", "Cadeau", "Gift"],
        },
      },
      images: {
        some: {},
      },
    },
    include: {
      images: {
        take: 1,
        orderBy: { createdAt: "asc" },
      },
      category: true,
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const randomProducts = availableProducts
    .map((product) => ({ product, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 3)
    .map(({ product }) => product);

  const productCards = randomProducts.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category?.name || "Nouveaute",
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    image: product.images[0]?.url || "/images/hero_banner.png",
    href: `/product/${product.slug || product.id}`,
  }));

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <DownloadClient products={productCards} />
    </PublicLayout>
  );
}

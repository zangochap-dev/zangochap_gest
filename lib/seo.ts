// ============ SEO CONFIGURATION ============
// Centralized SEO constants for the public storefront

export const SITE_NAME = "Zangochap";
export const SITE_URL = "https://zangochap.com";
export const SITE_DESCRIPTION =
  "Zangochap — Boutique de mode en ligne en Côte d'Ivoire. Découvrez notre collection exclusive de vêtements, chaussures et accessoires pour homme et femme. Livraison rapide à Abidjan.";
export const SITE_TAGLINE = "La mode accessible, livrée chez vous";
export const SITE_LOCALE = "fr_CI";
export const SITE_CURRENCY = "XOF";
export const SITE_COUNTRY = "CI";
export const SITE_PHONE = "+22500000000";
export const SITE_EMAIL = "contact@zangochap.ci";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export function getAbsoluteUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function getProductUrl(product: { id: string; slug?: string | null }) {
  return `${SITE_URL}/product/${product.slug || product.id}`;
}

export function buildProductSeoDescription(product: {
  name: string;
  description?: string | null;
  category?: { name: string } | null;
}) {
  const source = product.description?.trim();
  const fallbackParts = [
    `Achetez ${product.name} sur ${SITE_NAME}`,
    product.category?.name ? `rayon ${product.category.name}` : "mode",
    "livraison rapide a Abidjan et en Cote d'Ivoire",
  ];
  const description = source && source.length >= 70 ? source : `${fallbackParts.join(", ")}.`;
  return description.length > 160 ? `${description.slice(0, 157).trim()}...` : description;
}

export function parseSeoKeywords(value?: string | null) {
  return (value || "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function isGoogleAnalyticsId(value?: string | null) {
  return /^G-[A-Z0-9]{6,}$/i.test((value || "").trim());
}

export function isFacebookPixelId(value?: string | null) {
  return /^\d{8,30}$/.test((value || "").trim());
}

// ============ JSON-LD HELPERS ============

/** Organization schema — appears on home + all pages */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_PHONE,
      contactType: "customer service",
      availableLanguage: ["French"],
      areaServed: "CI",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Abidjan",
      addressCountry: "CI",
    },
    sameAs: [
      "https://www.instagram.com/zangochap",
      "https://www.facebook.com/zangochap",
      "https://www.tiktok.com/@zangochap",
    ],
  };
}

/** WebSite schema — home page, enables Google sitelinks searchbox */
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "fr",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** BreadcrumbList schema */
export function getBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Product schema — for individual product pages (Google Shopping, Facebook Catalog, etc.) */
export function getProductSchema(product: {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  slug: string;
  images: { url: string }[];
  category?: { name: string } | null;
  material?: string | null;
  origin?: string | null;
  stock?: number;
  variants?: { size: string; color: string; stock: number }[];
}) {
  const imageUrls = product.images.map((img) => getAbsoluteUrl(img.url));
  const productUrl = getProductUrl(product);
  const inStock = (product.stock ?? 0) > 0 ||
    (product.variants?.some((v) => v.stock > 0) ?? false);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ||
      `${product.name} — Disponible sur Zangochap, votre boutique de mode en Côte d'Ivoire.`,
    image: imageUrls,
    url: productUrl,
    sku: product.slug || product.id,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    ...(product.category && {
      category: product.category.name,
    }),
    ...(product.material && {
      material: product.material,
    }),
    ...(product.origin && {
      countryOfOrigin: {
        "@type": "Country",
        name: product.origin,
      },
    }),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: SITE_CURRENCY,
      price: product.price,
      ...(product.oldPrice && {
        priceValidUntil: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString().split("T")[0],
      }),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "CI",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    // Aggregate variant sizes as additional properties
    ...(product.variants &&
      product.variants.length > 0 && {
        additionalProperty: [
          {
            "@type": "PropertyValue",
            propertyID: "size",
            name: "Tailles disponibles",
            value: [
              ...new Set(product.variants.map((v) => v.size)),
            ].join(", "),
          },
          {
            "@type": "PropertyValue",
            propertyID: "color",
            name: "Couleurs disponibles",
            value: [
              ...new Set(product.variants.map((v) => v.color)),
            ].join(", "),
          },
        ],
      }),
  };
}

/** ItemList schema — for shop/collection pages */
export function getProductListSchema(
  products: {
    id: string;
    slug?: string | null;
    name: string;
    price: number;
    images: { url: string }[];
  }[],
  listName: string = "Notre Collection"
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 30).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: getProductUrl(p),
      name: p.name,
      image: getAbsoluteUrl(p.images?.[0]?.url),
    })),
  };
}

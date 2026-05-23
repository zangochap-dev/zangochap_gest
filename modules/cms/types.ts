export type HomeCmsContent = {
  siteSeoTitle: string;
  siteSeoDescription: string;
  siteSeoKeywords: string;
  siteOgImage: string;
  googleAnalyticsId: string;
  facebookPixelId: string;
  announcement: string;
  heroImage: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroPrimaryLabel: string;
  heroPrimaryHref: string;
  heroSecondaryLabel: string;
  heroSecondaryHref: string;
  trustDelivery: string;
  trustQuality: string;
  trustPayment: string;
  categoriesEyebrow: string;
  categoriesTitle: string;
  categoriesDescription: string;
  categoriesEnabled: boolean;
  featuredCategoryIds: string[];
  collectionsEyebrow: string;
  collectionsTitle: string;
  collectionsEnabled: boolean;
  collectionsList: Array<{
    id: string;
    title: string;
    href: string;
    image: string;
  }>;
  flashTitle: string;
  flashDescription: string;
  flashEnabled: boolean;
  newArrivalsEyebrow: string;
  newArrivalsTitle: string;
  newArrivalsDescription: string;
  newArrivalsEnabled: boolean;
  newArrivalsLimit: string;
  catalogButtonLabel: string;
  popupEnabled: boolean;
  popupShowImage: boolean;
  popupImage: string;
  popupEyebrow: string;
  popupTitle: string;
  popupDescription: string;
  popupButtonLabel: string;
  popupButtonHref: string;
  popupSecondaryLabel: string;
  popupSecondaryHref: string;
  popupCloseLabel: string;
  popupTheme: string;
  popupPosition: string;
  popupSize: string;
  popupFrequency: string;
  popupDelayMs: string;
};

export const DEFAULT_HOME_CMS: HomeCmsContent = {
  siteSeoTitle: "Zangochap - Boutique de mode en ligne en Cote d'Ivoire",
  siteSeoDescription: "Achetez vetements, chaussures et accessoires sur Zangochap. Nouveautes mode, prix accessibles et livraison rapide a Abidjan.",
  siteSeoKeywords: "mode Cote d'Ivoire, vetements Abidjan, chaussures Abidjan, boutique en ligne, Zangochap",
  siteOgImage: "/og-image.png",
  googleAnalyticsId: "",
  facebookPixelId: "",
  announcement: "LIVRAISON OFFERTE A ABIDJAN - CODE ZANGO10 : -10% SUR VOTRE 1ERE COMMANDE",
  heroImage: "/images/hero_banner.png",
  heroEyebrow: "NOUVELLE COLLECTION 2026",
  heroTitle: "MIEUX S'HABILLER A PRIX BAS",
  heroDescription: "Zangochap offre une selection exceptionnelle de produits de qualite a des prix competitifs. Profitez d'une experience d'achat intuitive et d'un service client reactif.",
  heroPrimaryLabel: "DECOUVRIR LE SHOP",
  heroPrimaryHref: "/shop",
  heroSecondaryLabel: "CHAUSSURES",
  heroSecondaryHref: "/shop?category=Chaussures",
  trustDelivery: "Livraison 24h/48h Abidjan",
  trustQuality: "Qualite Garantie",
  trustPayment: "Paiement a la Livraison",
  categoriesEyebrow: "RAYONS",
  categoriesTitle: "CATEGORIES A DECOUVRIR",
  categoriesDescription: "Accedez rapidement aux rayons les plus importants du moment.",
  categoriesEnabled: true,
  featuredCategoryIds: [],
  collectionsEyebrow: "SELECTION",
  collectionsTitle: "NOS UNIVERS",
  collectionsEnabled: true,
  collectionsList: [
    {
      id: "shoes",
      title: "CHAUSSURES",
      href: "/shop?category=Chaussures",
      image: "/images/collection_shoes.png",
    },
    {
      id: "clothing",
      title: "VETEMENTS",
      href: "/shop?category=Vetements",
      image: "/images/collection_clothing.png",
    },
    {
      id: "accessories",
      title: "ACCESSOIRES",
      href: "/shop?category=Accessoires",
      image: "",
    },
  ],
  flashTitle: "VENTES FLASH",
  flashDescription: "Offres a duree limitee pour nos clients privilegies",
  flashEnabled: true,
  newArrivalsEyebrow: "CATALOGUE",
  newArrivalsTitle: "NOUVEAUTES",
  newArrivalsDescription: "Les dernieres pieces ajoutees a notre collection exclusive",
  newArrivalsEnabled: true,
  newArrivalsLimit: "24",
  catalogButtonLabel: "VOIR TOUT LE CATALOGUE",
  popupEnabled: false,
  popupShowImage: true,
  popupImage: "/images/hero_banner.png",
  popupEyebrow: "OFFRE SPECIALE",
  popupTitle: "Profitez des nouveautes Zangochap",
  popupDescription: "Decouvrez les derniers arrivages et commandez directement sur le site.",
  popupButtonLabel: "Voir le shop",
  popupButtonHref: "/shop",
  popupSecondaryLabel: "Plus tard",
  popupSecondaryHref: "",
  popupCloseLabel: "Non merci",
  popupTheme: "light",
  popupPosition: "center",
  popupSize: "medium",
  popupFrequency: "session",
  popupDelayMs: "900",
};

export function normalizeHomeCms(data: unknown): HomeCmsContent {
  const source = data && typeof data === "object" ? data as Partial<HomeCmsContent> : {};
  return {
    ...DEFAULT_HOME_CMS,
    ...Object.fromEntries(
      Object.entries(source).filter(([, value]) => typeof value === "string" && value !== ""),
    ),
    heroImage: typeof source.heroImage === "string" && source.heroImage.trim() !== "" ? source.heroImage : DEFAULT_HOME_CMS.heroImage,
    popupEnabled: typeof source.popupEnabled === "boolean"
      ? source.popupEnabled
      : DEFAULT_HOME_CMS.popupEnabled,
    popupShowImage: typeof source.popupShowImage === "boolean"
      ? source.popupShowImage
      : DEFAULT_HOME_CMS.popupShowImage,
    flashEnabled: typeof source.flashEnabled === "boolean"
      ? source.flashEnabled
      : DEFAULT_HOME_CMS.flashEnabled,
    collectionsEnabled: typeof source.collectionsEnabled === "boolean"
      ? source.collectionsEnabled
      : DEFAULT_HOME_CMS.collectionsEnabled,
    collectionsList: Array.isArray(source.collectionsList)
      ? source.collectionsList
      : DEFAULT_HOME_CMS.collectionsList,
    newArrivalsEnabled: typeof source.newArrivalsEnabled === "boolean"
      ? source.newArrivalsEnabled
      : DEFAULT_HOME_CMS.newArrivalsEnabled,
    categoriesEnabled: typeof source.categoriesEnabled === "boolean"
      ? source.categoriesEnabled
      : DEFAULT_HOME_CMS.categoriesEnabled,
    featuredCategoryIds: Array.isArray(source.featuredCategoryIds)
      ? source.featuredCategoryIds.filter((value): value is string => typeof value === "string")
      : DEFAULT_HOME_CMS.featuredCategoryIds,
  };
}

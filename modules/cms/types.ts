export type HomeCmsContent = {
  announcement: string;
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
  featuredCategoryIds: string[];
  collectionsEyebrow: string;
  collectionsTitle: string;
  shoesTitle: string;
  shoesHref: string;
  clothingTitle: string;
  clothingHref: string;
  accessoriesTitle: string;
  accessoriesHref: string;
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
  announcement: "LIVRAISON OFFERTE A ABIDJAN - CODE ZANGO10 : -10% SUR VOTRE 1ERE COMMANDE",
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
  featuredCategoryIds: [],
  collectionsEyebrow: "SELECTION",
  collectionsTitle: "NOS UNIVERS",
  shoesTitle: "CHAUSSURES",
  shoesHref: "/shop?category=Chaussures",
  clothingTitle: "VETEMENTS",
  clothingHref: "/shop?category=Vetements",
  accessoriesTitle: "ACCESSOIRES",
  accessoriesHref: "/shop?category=Accessoires",
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
      Object.entries(source).filter(([, value]) => typeof value === "string"),
    ),
    popupEnabled: typeof source.popupEnabled === "boolean"
      ? source.popupEnabled
      : DEFAULT_HOME_CMS.popupEnabled,
    popupShowImage: typeof source.popupShowImage === "boolean"
      ? source.popupShowImage
      : DEFAULT_HOME_CMS.popupShowImage,
    flashEnabled: typeof source.flashEnabled === "boolean"
      ? source.flashEnabled
      : DEFAULT_HOME_CMS.flashEnabled,
    newArrivalsEnabled: typeof source.newArrivalsEnabled === "boolean"
      ? source.newArrivalsEnabled
      : DEFAULT_HOME_CMS.newArrivalsEnabled,
    featuredCategoryIds: Array.isArray(source.featuredCategoryIds)
      ? source.featuredCategoryIds.filter((value): value is string => typeof value === "string")
      : DEFAULT_HOME_CMS.featuredCategoryIds,
  };
}

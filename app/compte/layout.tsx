import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, SITE_LOCALE, DEFAULT_OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Mon Compte — ${SITE_NAME}`,
  description: `Connectez-vous ou créez un compte sur ${SITE_NAME} pour suivre vos commandes, sauvegarder vos adresses et profiter d'avantages exclusifs.`,
  alternates: { canonical: "/compte" },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: `${SITE_URL}/compte`,
    siteName: SITE_NAME,
    title: `Mon Compte — ${SITE_NAME}`,
    description: `Gérez votre compte ${SITE_NAME}. Suivi de commandes, adresses sauvegardées et offres exclusives.`,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary",
    title: `Mon Compte — ${SITE_NAME}`,
    description: `Connectez-vous à votre compte ${SITE_NAME}.`,
  },
  robots: { index: false, follow: true },
};

export default function CompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

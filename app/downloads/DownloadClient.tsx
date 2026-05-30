"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  Download,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
} from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/ci/app/zangochap/id6737241287";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.zangochap.zangochap&pcampaignid=web_share";
const APP_STORE_BADGE_URL =
  "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/fr-fr?size=250x83";
const PLAY_STORE_BADGE_URL =
  "https://play.google.com/intl/en_us/badges/static/images/badges/fr_badge_web_generic.png";

const features = [
  {
    icon: Search,
    title: "Shopping plus rapide",
    description: "Retrouvez les nouveautes, collections et produits favoris en quelques gestes.",
  },
  {
    icon: Bell,
    title: "Alertes offres",
    description: "Recevez les promos, arrivages et ventes flash sans rater les bonnes tailles.",
  },
  {
    icon: Truck,
    title: "Suivi livraison",
    description: "Gardez vos commandes sous les yeux, de la validation jusqu'a la livraison.",
  },
];

type DownloadProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  image: string;
  href: string;
};

const fallbackProducts: DownloadProduct[] = [
  {
    id: "fallback-shoes",
    name: "Sneakers Urban",
    category: "Chaussures",
    price: 12500,
    oldPrice: null,
    image: "/images/collection_shoes.png",
    href: "/shop",
  },
  {
    id: "fallback-clothing",
    name: "Robe Signature",
    category: "Vetements",
    price: 15000,
    oldPrice: 18500,
    image: "/images/collection_clothing.png",
    href: "/shop",
  },
  {
    id: "fallback-premium",
    name: "Selection Premium",
    category: "Accessoires",
    price: 8500,
    oldPrice: null,
    image: "/images/hero_banner.png",
    href: "/shop",
  },
];

const productLayouts = [
  {
    className: "left-2 top-10 w-[190px] rotate-[-7deg] md:left-0 md:top-12 md:w-[220px]",
    delay: 0,
    badge: "New",
  },
  {
    className: "right-0 top-0 w-[205px] rotate-[5deg] md:right-4 md:w-[240px]",
    delay: 0.16,
    badge: "Recent",
  },
  {
    className:
      "bottom-3 left-1/2 w-[220px] -translate-x-1/2 rotate-[2deg] md:bottom-0 md:w-[260px]",
    delay: 0.28,
    badge: "Top",
  },
];

export default function DownloadClient({ products }: { products: DownloadProduct[] }) {
  const productCards = (products.length > 0 ? products : fallbackProducts).slice(0, 3);

  return (
    <div className="bg-white text-[#1A1614]">
      <section className="relative overflow-hidden bg-[#1A1614] text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/hero_banner.png"
            alt="Collection Zangochap"
            fill
            priority
            className="object-cover opacity-35"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,#1A1614_0%,rgba(26,22,20,0.94)_42%,rgba(26,22,20,0.62)_100%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100svh-64px)] max-w-[1240px] grid-cols-1 items-center gap-10 px-5 py-14 md:min-h-[720px] md:grid-cols-[1fr_420px] md:px-8 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-[680px] text-center md:text-left"
          >
            <span className="mb-4 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.32em] text-[#FF7A32]">
              <Download size={14} />
              Application mobile
            </span>
            <h1 className="font-display text-[40px] font-black uppercase leading-[0.95] tracking-normal md:text-[76px]">
              Zangochap dans votre poche
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-7 text-white/72 md:mx-0 md:text-lg">
              Decouvrez les nouveautes, commandez plus vite et suivez vos achats depuis l&apos;application Zangochap.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
              <StoreBadge
                href={APP_STORE_URL}
                imageSrc={APP_STORE_BADGE_URL}
                alt="Telecharger dans l'App Store"
                imageClassName="h-[64px] w-auto sm:h-[54px]"
              />
              <StoreBadge
                href={PLAY_STORE_URL}
                imageSrc={PLAY_STORE_BADGE_URL}
                alt="Disponible sur Google Play"
                imageClassName="h-[78px] w-auto sm:h-[66px]"
              />
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/56 md:justify-start">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#FF7A32]" />
                Paiement securise
              </span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span className="inline-flex items-center gap-2">
                <Truck size={15} className="text-[#FF7A32]" />
                Livraison rapide
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
            className="relative mx-auto h-[430px] w-full max-w-[420px] md:h-[500px]"
          >
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4541C]/18 blur-3xl" />
            <div className="absolute left-8 right-8 top-[42%] hidden h-24 -translate-y-1/2 rounded-md border border-white/10 bg-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl md:block" />
            <div className="absolute left-1/2 top-[47%] flex min-h-12 w-[min(86vw,330px)] -translate-x-1/2 items-center gap-3 rounded-md border border-white/14 bg-white/95 px-4 text-[#776A63] shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
              <Search size={17} className="text-[#D4541C]" />
              <span className="text-[12px] font-extrabold uppercase tracking-[0.14em]">
                Trouver mon style
              </span>
            </div>

            {productCards.map((product, index) => {
              const layout = productLayouts[index] || productLayouts[0];
              const badge = product.oldPrice && product.oldPrice > product.price
                ? `-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%`
                : layout.badge;

              return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{
                  opacity: 1,
                  y: [0, -12, 0],
                }}
                transition={{
                  opacity: { duration: 0.45, delay: layout.delay },
                  y: {
                    duration: 4.8,
                    delay: layout.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                className={`absolute overflow-hidden rounded-md border border-white/16 bg-white text-[#1A1614] shadow-[0_28px_70px_rgba(0,0,0,0.38)] ${layout.className}`}
              >
                <Link href={product.href} className="block">
                  <div className="relative aspect-[4/5] bg-[#F4F0EA]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 220px, 260px"
                    />
                    <span className="absolute left-3 top-3 rounded bg-[#D4541C] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      {badge}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4541C]">
                      {product.category}
                    </p>
                    <h2 className="mt-1 line-clamp-2 min-h-[42px] font-display text-[17px] font-black uppercase leading-tight">
                      {product.name}
                    </h2>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="font-display text-[16px] font-black">
                        {formatPrice(product.price)}
                      </span>
                      <span className="rounded bg-[#1A1614] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white">
                        Shop
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="bg-[#FAF9F6] px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-[1160px] gap-4 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="rounded-md border border-[#ECE8E2] bg-white p-6"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-[#FFF1EA] text-[#D4541C]">
                  <Icon size={21} />
                </div>
                <h2 className="font-display text-lg font-black uppercase text-[#1A1614]">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#6E625C]">{feature.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-[1120px] items-center gap-8 md:grid-cols-[1fr_360px]">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#D4541C]">
              <Sparkles size={14} />
              Experience Zangochap
            </span>
            <h2 className="font-display text-[30px] font-black uppercase leading-tight text-[#1A1614] md:text-[46px]">
              Lancez l&apos;app, trouvez le look, commandez.
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-7 text-[#6E625C]">
              La page mobile met l&apos;essentiel devant vous : recherche, categories, promos et panier. L&apos;objectif est simple : moins d&apos;attente, plus de bons choix.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <StoreBadge
                href={APP_STORE_URL}
                imageSrc={APP_STORE_BADGE_URL}
                alt="Telecharger dans l'App Store"
                imageClassName="h-[60px] w-auto sm:h-[50px]"
              />
              <StoreBadge
                href={PLAY_STORE_URL}
                imageSrc={PLAY_STORE_BADGE_URL}
                alt="Disponible sur Google Play"
                imageClassName="h-[73px] w-auto sm:h-[61px]"
              />
            </div>
          </div>

          <div className="rounded-md border border-[#ECE8E2] bg-[#1A1614] p-7 text-white">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-white/10 text-[#FF7A32]">
              <Smartphone size={24} />
            </div>
            <h3 className="font-display text-2xl font-black uppercase">Pret a shopper ?</h3>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Installez l&apos;application et gardez Zangochap avec vous, partout a Abidjan et en Cote d&apos;Ivoire.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded bg-white px-5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1A1614] transition-colors hover:bg-[#FF7A32] hover:text-white"
            >
              Voir la boutique
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} F`;
}

function StoreBadge({
  href,
  imageSrc,
  alt,
  imageClassName,
}: {
  href: string;
  imageSrc: string;
  alt: string;
  imageClassName: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[58px] items-center justify-center rounded-md transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF7A32]"
      aria-label={alt}
    >
      <img src={imageSrc} alt={alt} className={imageClassName} loading="lazy" />
    </a>
  );
}

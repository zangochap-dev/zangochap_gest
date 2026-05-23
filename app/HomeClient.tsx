"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Tag, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "@/components/public/ProductCard";
import { DEFAULT_HOME_CMS, HomeCmsContent } from "@/modules/cms/types";
import { Product, Category } from "@/lib/types";

export default function HomeClient({ products, categories, latestPromo, cms }: {
  products: Product[],
  categories: Category[],
  latestPromo: any,
  cms?: HomeCmsContent,
}) {
  const content = cms || DEFAULT_HOME_CMS;
  const newArrivalsLimit = Number.parseInt(content.newArrivalsLimit, 10) || 24;
  const flashSales = useMemo(() =>
    products.filter((p: Product) => p.oldPrice && Number(p.oldPrice) > Number(p.price)).slice(0, 4)
    , [products]);

  const newArrivals = useMemo(() =>
    products.slice(0, newArrivalsLimit)
    , [products, newArrivalsLimit]);

  const featuredCategories = useMemo(() => {
    const available = categories.filter((category) => (category._count?.products || 0) > 0);
    const selected = content.featuredCategoryIds.length > 0
      ? content.featuredCategoryIds
        .map((id) => available.find((category) => category.id === id))
        .filter((category): category is Category => Boolean(category))
      : available.slice(0, 6);

    return selected.slice(0, 8);
  }, [categories, content.featuredCategoryIds]);

  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-white w-full overflow-x-clip font-body">
      {content.announcement && (
        <div className="bg-[#1A1614] text-white py-2 text-center text-[10px] md:text-[11px] font-bold tracking-wider px-4">
          {content.announcement}
        </div>
      )}

      <section className="relative h-[75vh] md:h-[90vh] min-h-[500px] md:min-h-[600px] flex items-center justify-center md:justify-start px-6 md:px-[8%] text-white bg-[#1A1614] overflow-hidden">
        <div className="absolute inset-0 z-[1] w-full h-full">
          <Image src="/images/hero_banner.png" alt="ZangoChap Hero" fill priority className="object-cover opacity-70" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1614]/90 via-[#1A1614]/40 to-transparent"></div>
        </div>
        <div className="relative z-[2] max-w-[600px] w-full text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-[10px] md:text-[11px] font-extrabold tracking-[0.4em] text-[#D4541C] mb-4 md:mb-6 block uppercase">
              {content.heroEyebrow}
            </span>
            <h1 className="font-display text-[38px] md:text-[72px] lg:text-[86px] font-bold leading-[1] md:leading-[0.95] mb-5 md:mb-6 uppercase">
              {renderMultiline(content.heroTitle)}
            </h1>
            <p className="text-sm md:text-lg text-white/70 mb-8 md:text-white/70 md:mb-10 leading-relaxed font-light">
              {content.heroDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
              <Link href={content.heroPrimaryHref || "/shop"} className="px-7 py-3.5 md:px-9 md:py-4 bg-white text-[#1A1614] text-[11px] md:text-[12px] font-bold tracking-widest rounded transition-all hover:bg-[#D4541C] hover:text-white hover:-translate-y-1">
                {content.heroPrimaryLabel}
              </Link>
              <Link href={content.heroSecondaryHref || "/shop"} className="px-7 py-3.5 md:px-9 md:py-4 bg-white/10 text-white text-[11px] md:text-[12px] font-bold tracking-widest rounded backdrop-blur-md border border-white/20 transition-all hover:bg-white/20">
                {content.heroSecondaryLabel}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-10 p-4 md:p-6 border-b border-[#F0F0F0] bg-[#FAF9F6]">
        <div className="flex items-center gap-2.5 text-[11px] md:text-[12px] font-semibold text-[#555]">
          <Truck size={18} />
          <span>{content.trustDelivery}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] md:text-[12px] font-semibold text-[#555]">
          <ShieldCheck size={18} />
          <span>{content.trustQuality}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] md:text-[12px] font-semibold text-[#555]">
          <CreditCard size={18} />
          <span>{content.trustPayment}</span>
        </div>
      </section>

      {featuredCategories.length > 0 && (
        <section className="max-w-[1300px] mx-auto px-5 py-10 md:py-[54px]">
          <div className="mb-7 text-center">
            <span className="text-[9px] md:text-[10px] font-extrabold tracking-[0.3em] text-[#D4541C] block mb-2 uppercase">{content.categoriesEyebrow}</span>
            <h2 className="font-display text-[26px] md:text-[32px] font-bold text-[#1A1614] uppercase">{content.categoriesTitle}</h2>
            <p className="mt-3 text-[14px] text-[#777] max-w-[620px] mx-auto">{content.categoriesDescription}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {featuredCategories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${encodeURIComponent(category.name)}`}
                className="group flex min-h-[96px] flex-col justify-between rounded-lg border border-[#ECE8E2] bg-[#FAF9F6] p-4 text-[#1A1614] transition hover:border-[#D4541C] hover:bg-white hover:shadow-sm"
              >
                <span className="font-display text-[16px] md:text-[20px] font-bold uppercase leading-tight">{category.name}</span>
                <span className="mt-4 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#D4541C]">
                  Voir le rayon <ArrowRight size={12} className="transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {latestPromo && (
        <div className="bg-[#D4541C] text-white py-2 text-center text-[11px] md:text-[12px] font-medium tracking-wider">
          <Tag size={12} className="inline mr-2" />
          OFFRE : <strong>-{latestPromo.value}{latestPromo.type === "PERCENT" ? "%" : " F"}</strong> AVEC LE CODE
          <span className="bg-black/20 px-2 py-0.5 rounded font-extrabold ml-1">{latestPromo.code}</span>
        </div>
      )}

      <section className="max-w-[1300px] mx-auto px-5 py-10 md:py-[60px]">
        <div className="mb-8 md:mb-10 text-center">
          <span className="text-[9px] md:text-[10px] font-extrabold tracking-[0.3em] text-[#D4541C] block mb-2 md:mb-3 uppercase">{content.collectionsEyebrow}</span>
          <h2 className="font-display text-[26px] md:text-[32px] font-bold text-[#1A1614] mb-2 md:mb-3 uppercase">{content.collectionsTitle}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 md:gap-6 lg:h-[600px]">
          <Link href={content.shoesHref || "/shop"} className="group relative overflow-hidden rounded-lg block h-[300px] lg:h-full">
            <Image src="/images/collection_shoes.png" alt="Collection chaussures" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-1 md:gap-2">
              <h3 className="font-display text-[20px] md:text-[24px] lg:text-[40px] font-bold tracking-wider text-white uppercase leading-none">{content.shoesTitle}</h3>
              <span className="text-[10px] md:text-[12px] font-bold tracking-[0.2em] flex items-center gap-2 opacity-80 text-white uppercase">VOIR LA COLLECTION <ArrowRight size={12} /></span>
            </div>
          </Link>
          <div className="grid grid-cols-2 lg:flex lg:flex-col gap-4 md:gap-6">
            <Link href={content.clothingHref || "/shop"} className="group relative overflow-hidden rounded-lg block h-[200px] md:h-[250px] lg:h-auto lg:flex-1">
              <Image src="/images/collection_clothing.png" alt="Collection vetements" fill sizes="(max-width: 1024px) 50vw, 40vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-10 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-1">
                <h3 className="font-display text-[16px] md:text-[24px] font-bold tracking-wider text-white uppercase leading-none">{content.clothingTitle}</h3>
                <span className="hidden md:flex text-[10px] md:text-[12px] font-bold tracking-[0.2em] items-center gap-2 opacity-80 text-white uppercase">EXPLORER <ArrowRight size={12} /></span>
              </div>
            </Link>
            <Link href={content.accessoriesHref || "/shop"} className="group relative overflow-hidden rounded-lg block h-[200px] md:h-[250px] lg:h-auto lg:flex-1 bg-[#F3F1ED]">
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-10 bg-gradient-to-t from-black/20 to-transparent flex flex-col gap-1">
                <h3 className="font-display text-[16px] md:text-[24px] font-bold tracking-wider text-[#1A1614] lg:text-white uppercase leading-none text-center lg:text-left">{content.accessoriesTitle}</h3>
                <span className="hidden lg:flex text-[12px] font-bold tracking-[0.2em] items-center gap-2 opacity-80 text-white uppercase">DECOUVRIR <ArrowRight size={12} /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {content.flashEnabled && flashSales.length > 0 && (
        <section className="max-w-[1300px] mx-auto px-6 py-[60px]">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <Zap size={20} className="text-red-600 fill-red-600" />
              <h2 className="font-display text-[32px] font-bold text-[#1A1614] leading-none uppercase">{content.flashTitle}</h2>
              <CountdownTimer />
            </div>
            <p className="text-[15px] text-[#777] max-w-[600px]">{content.flashDescription}</p>
          </div>
          <motion.div
            variants={containerVars}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
          >
            {flashSales.map((p: Product) => (
              <motion.div key={p.id} variants={itemVars}>
                <ProductCard p={p} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {content.newArrivalsEnabled && (
        <section className="max-w-[1300px] mx-auto px-6 py-[60px]">
          <div className="mb-10 text-center">
            <span className="text-[10px] font-extrabold tracking-[0.3em] text-[#D4541C] block mb-3 uppercase">{content.newArrivalsEyebrow}</span>
            <h2 className="font-display text-[32px] font-bold text-[#1A1614] mb-3 uppercase">{content.newArrivalsTitle}</h2>
            <p className="text-[15px] text-[#777] max-w-[600px] mx-auto">{content.newArrivalsDescription}</p>
          </div>
          <motion.div
            variants={containerVars}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
          >
            {newArrivals.map((p: Product) => (
              <motion.div key={p.id} variants={itemVars}>
                <ProductCard p={p} />
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-10 flex justify-center">
            <Link href="/shop" className="inline-block px-12 py-4 border-[1.5px] border-[#1A1614] text-[#1A1614] font-extrabold text-[12px] tracking-[0.2em] transition-all hover:bg-[#1A1614] hover:text-white uppercase">
              {content.catalogButtonLabel}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function renderMultiline(text: string) {
  return text.split("\n").map((line, index) => (
    <React.Fragment key={`${line}-${index}`}>
      {index > 0 && <br />}
      {line}
    </React.Fragment>
  ));
}

function CountdownTimer() {
  const [time, setTime] = React.useState({ h: 0, m: 0, s: 0 });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diff = Math.floor((night.getTime() - now.getTime()) / 1000);

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;

      setTime({ h, m, s });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1.5 ml-3">
      <div className="bg-[#1A1614] text-white px-2 py-1 text-[11px] font-extrabold rounded-sm min-w-[28px] text-center">
        {String(time.h).padStart(2, "0")}
      </div>
      <span className="font-extrabold text-[12px] text-[#1A1614] opacity-50">:</span>
      <div className="bg-[#1A1614] text-white px-2 py-1 text-[11px] font-extrabold rounded-sm min-w-[28px] text-center">
        {String(time.m).padStart(2, "0")}
      </div>
      <span className="font-extrabold text-[12px] text-[#1A1614] opacity-50">:</span>
      <div className="bg-[#1A1614] text-white px-2 py-1 text-[11px] font-extrabold rounded-sm min-w-[28px] text-center">
        {String(time.s).padStart(2, "0")}
      </div>
    </div>
  );
}

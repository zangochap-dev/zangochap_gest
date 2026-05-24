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
      {latestPromo && (
        <div className="bg-[#D4541C] text-white py-2 text-center text-[11px] md:text-[12px] font-medium tracking-wider">
          <Tag size={12} className="inline mr-2" />
          OFFRE : <strong>-{latestPromo.value}{latestPromo.type === "PERCENT" ? "%" : " F"}</strong> AVEC LE CODE
          <span className="bg-black/20 px-2 py-0.5 rounded font-extrabold ml-1">{latestPromo.code}</span>
        </div>
      )}

      <section className="relative h-[75vh] md:h-[90vh] min-h-[500px] md:min-h-[600px] flex items-center justify-center md:justify-start px-6 md:px-[8%] text-white bg-[#1A1614] overflow-hidden">
        <div className="absolute inset-0 z-[1] w-full h-full">
          <Image src={content.heroImage || "/images/hero_banner.png"} alt="ZangoChap Hero" fill priority className="object-cover opacity-70" sizes="100vw" />
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

      {content.categoriesEnabled && featuredCategories.length > 0 && (
        <section className="max-w-[1300px] mx-auto px-5 py-10 md:py-[54px]">
          <div className="mb-7 text-center">
            <span className="text-[9px] md:text-[10px] font-extrabold tracking-[0.3em] text-[#D4541C] block mb-2 uppercase">{content.categoriesEyebrow}</span>
            <h2 className="font-display text-[26px] md:text-[32px] font-bold text-[#1A1614] uppercase">{content.categoriesTitle}</h2>
            <p className="mt-3 text-[14px] text-[#777] max-w-[620px] mx-auto">{content.categoriesDescription}</p>
          </div>
          <motion.div
            variants={containerVars}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
          >
            {featuredCategories.map((category) => (
              <motion.div key={category.id} variants={itemVars}>
                <Link
                  href={`/shop?category=${encodeURIComponent(category.name)}`}
                  className="group relative flex min-h-[120px] flex-col justify-between overflow-hidden rounded-sm border border-[#ECE8E2] bg-white p-5 text-[#1A1614] transition-all hover:border-[#D4541C]"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#FAF9F6] rounded-bl-full z-0 transition-transform duration-500 group-hover:scale-150 group-hover:bg-[#FFF5F0]"></div>

                  <div className="flex items-start justify-between z-10 relative">
                    <span className="font-display text-[16px] md:text-[18px] font-bold uppercase leading-tight pr-2">{category.name}</span>
                    <span className="flex items-center justify-center bg-white text-[#777] text-[10px] font-bold px-2 py-1 rounded-sm border border-[#ECE8E2] group-hover:bg-[#D4541C] group-hover:text-white group-hover:border-[#D4541C] transition-colors whitespace-nowrap shadow-sm">
                      {category._count?.products || 0}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between z-10 relative">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#777] group-hover:text-[#D4541C] flex items-center gap-2 transition-colors">
                      Découvrir <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}





      {content.collectionsEnabled && (
        <section className="max-w-[1300px] mx-auto px-5 py-10 md:py-[60px]">
          <div className="mb-8 md:mb-10 text-center">
            <span className="text-[9px] md:text-[10px] font-extrabold tracking-[0.3em] text-[#D4541C] block mb-2 md:mb-3 uppercase">{content.collectionsEyebrow}</span>
            <h2 className="font-display text-[26px] md:text-[32px] font-bold text-[#1A1614] mb-2 md:mb-3 uppercase">{content.collectionsTitle}</h2>
          </div>
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-5 px-5 md:mx-0 md:px-0 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(content.collectionsList || []).map((collection) => (
              <Link
                key={collection.id}
                href={collection.href || "/shop"}
                className="group relative overflow-hidden rounded-sm block flex-none w-[75vw] sm:w-[45vw] md:w-auto h-[280px] sm:h-[300px] md:h-[300px] lg:h-[400px] bg-[#F3F1ED] snap-center"
              >
                {collection.image && (
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 768px) 75vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-1 md:gap-2">
                  <h3 className="font-display text-[20px] md:text-[28px] font-bold tracking-wider text-white uppercase leading-none">
                    {collection.title}
                  </h3>
                  <span className="text-[10px] md:text-[12px] font-bold tracking-[0.2em] flex items-center gap-2 opacity-80 text-white uppercase">
                    EXPLORER <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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

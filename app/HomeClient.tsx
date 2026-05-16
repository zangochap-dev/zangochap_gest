"use client";

import React, { useMemo } from "react";
import { formatPrice } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Sparkles, Tag, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "@/components/public/ProductCard";

import { Product, Category } from "@/lib/types";

export default function HomeClient({ products, categories, latestPromo }: {
  products: Product[],
  categories: Category[],
  latestPromo: any
}) {
  const flashSales = useMemo(() => 
    products.filter((p: Product) => p.oldPrice && Number(p.oldPrice) > Number(p.price)).slice(0, 4)
  , [products]);
  
  const newArrivals = useMemo(() => 
    products.slice(0, 24)
  , [products]);

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
      {/* 1. EDITORIAL HERO */}
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
              NOUVELLE COLLECTION 2026
            </span>
            <h1 className="font-display text-[38px] md:text-[72px] lg:text-[86px] font-bold leading-[1] md:leading-[0.95] tracking-tighter mb-5 md:mb-6">
              MIEUX S'HABILLER <br /> À PRIX BAS
            </h1>
            <p className="text-sm md:text-lg text-white/70 mb-8 md:text-white/70 md:mb-10 leading-relaxed font-light">
              Zangochap offre une sélection exceptionnelle de produits de qualité à des prix compétitifs. Profitez d'une expérience d'achat intuitive et d'un service client réactif.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
              <Link href="/shop" className="px-7 py-3.5 md:px-9 md:py-4 bg-white text-[#1A1614] text-[11px] md:text-[12px] font-bold tracking-widest rounded transition-all hover:bg-[#D4541C] hover:text-white hover:-translate-y-1">
                DÉCOUVRIR LE SHOP
              </Link>
              <Link href="/shop?category=Chaussures" className="px-7 py-3.5 md:px-9 md:py-4 bg-white/10 text-white text-[11px] md:text-[12px] font-bold tracking-widest rounded backdrop-blur-md border border-white/20 transition-all hover:bg-white/20">
                CHAUSSURES
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. TRUST BAR */}
      <section className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-10 p-4 md:p-6 border-b border-[#F0F0F0] bg-[#FAF9F6]">
        <div className="flex items-center gap-2.5 text-[11px] md:text-[12px] font-semibold text-[#555]">
          <Truck size={18} />
          <span>Livraison 24h/48h Abidjan</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] md:text-[12px] font-semibold text-[#555]">
          <ShieldCheck size={18} />
          <span>Qualité Garantie</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] md:text-[12px] font-semibold text-[#555]">
          <CreditCard size={18} />
          <span>Paiement à la Livraison</span>
        </div>
      </section>

      {/* 3. PROMO RIBBON IF EXISTS */}
      {latestPromo && (
        <div className="bg-[#D4541C] text-white py-2 text-center text-[11px] md:text-[12px] font-medium tracking-wider">
          <Tag size={12} className="inline mr-2" />
          OFFRE : <strong>-{latestPromo.value}{latestPromo.type === 'PERCENT' ? '%' : ' F'}</strong> AVEC LE CODE
          <span className="bg-black/20 px-2 py-0.5 rounded font-extrabold ml-1">{latestPromo.code}</span>
        </div>
      )}

      {/* 4. VISUAL COLLECTIONS */}
      <section className="max-w-[1300px] mx-auto px-5 py-10 md:py-[60px]">
        <div className="mb-8 md:mb-10 text-center">
          <span className="text-[9px] md:text-[10px] font-extrabold tracking-[0.3em] text-[#D4541C] block mb-2 md:mb-3 uppercase">SÉLECTION</span>
          <h2 className="font-display text-[26px] md:text-[32px] font-bold text-[#1A1614] tracking-tight mb-2 md:mb-3">NOS UNIVERS</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 md:gap-6 lg:h-[600px]">
          <Link href="/shop?category=Chaussures" className="group relative overflow-hidden rounded-lg block h-[300px] lg:h-full">
            <Image src="/images/collection_shoes.png" alt="Collection Chaussures" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-1 md:gap-2">
              <h3 className="font-display text-[20px] md:text-[24px] lg:text-[40px] font-bold tracking-wider text-white uppercase leading-none">CHAUSSURES</h3>
              <span className="text-[10px] md:text-[12px] font-bold tracking-[0.2em] flex items-center gap-2 opacity-80 text-white uppercase">VOIR LA COLLECTION <ArrowRight size={12} /></span>
            </div>
          </Link>
          <div className="grid grid-cols-2 lg:flex lg:flex-col gap-4 md:gap-6">
            <Link href="/shop?category=Vêtements" className="group relative overflow-hidden rounded-lg block h-[200px] md:h-[250px] lg:h-auto lg:flex-1">
              <Image src="/images/collection_clothing.png" alt="Collection Vêtements" fill sizes="(max-width: 1024px) 50vw, 40vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-10 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-1">
                <h3 className="font-display text-[16px] md:text-[24px] font-bold tracking-wider text-white uppercase leading-none">VÊTEMENTS</h3>
                <span className="hidden md:flex text-[10px] md:text-[12px] font-bold tracking-[0.2em] items-center gap-2 opacity-80 text-white uppercase">EXPLORER <ArrowRight size={12} /></span>
              </div>
            </Link>
            <Link href="/shop?category=Accessoires" className="group relative overflow-hidden rounded-lg block h-[200px] md:h-[250px] lg:h-auto lg:flex-1 bg-[#F3F1ED]">
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-10 bg-gradient-to-t from-black/20 to-transparent flex flex-col gap-1">
                <h3 className="font-display text-[16px] md:text-[24px] font-bold tracking-wider text-[#1A1614] lg:text-white uppercase leading-none text-center lg:text-left">ACCESSOIRES</h3>
                <span className="hidden lg:flex text-[12px] font-bold tracking-[0.2em] items-center gap-2 opacity-80 text-white uppercase">DÉCOUVRIR <ArrowRight size={12} /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>



      {/* 5. VENTE FLASH */}
      {flashSales.length > 0 && (
        <section className="max-w-[1300px] mx-auto px-6 py-[60px]">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <Zap size={20} className="text-red-600 fill-red-600" />
              <h2 className="font-display text-[32px] font-bold text-[#1A1614] tracking-tight leading-none">VENTES FLASH</h2>
              <CountdownTimer />
            </div>
            <p className="text-[15px] text-[#777] max-w-[600px]">Offres à durée limitée pour nos clients privilégiés</p>
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

      {/* 6. NOUVEAUTÉS */}
      <section className="max-w-[1300px] mx-auto px-6 py-[60px]">
        <div className="mb-10 text-center">
          <span className="text-[10px] font-extrabold tracking-[0.3em] text-[#D4541C] block mb-3 uppercase">CATALOGUE</span>
          <h2 className="font-display text-[32px] font-bold text-[#1A1614] tracking-tight mb-3 uppercase">NOUVEAUTÉS</h2>
          <p className="text-[15px] text-[#777] max-w-[600px] mx-auto">Les dernières pièces ajoutées à notre collection exclusive</p>
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
            VOIR TOUT LE CATALOGUE
          </Link>
        </div>
      </section>

    </div>
  );
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
        {String(time.h).padStart(2, '0')}
      </div>
      <span className="font-extrabold text-[12px] text-[#1A1614] opacity-50">:</span>
      <div className="bg-[#1A1614] text-white px-2 py-1 text-[11px] font-extrabold rounded-sm min-w-[28px] text-center">
        {String(time.m).padStart(2, '0')}
      </div>
      <span className="font-extrabold text-[12px] text-[#1A1614] opacity-50">:</span>
      <div className="bg-[#1A1614] text-white px-2 py-1 text-[11px] font-extrabold rounded-sm min-w-[28px] text-center">
        {String(time.s).padStart(2, '0')}
      </div>
    </div>
  );
}





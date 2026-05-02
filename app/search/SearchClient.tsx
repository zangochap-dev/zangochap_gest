"use client";

import React from "react";
import ProductCard from "@/components/public/ProductCard";
import { Product } from "@/lib/types";
import Link from "next/link";

interface SearchClientProps {
  query: string;
  products: Product[];
}

export default function SearchClient({ query, products }: SearchClientProps) {
  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-[60px] pb-[100px] font-body w-full">
      <div className="text-center mb-20">
        <span className="text-[11px] font-normal uppercase tracking-[0.3em] text-[#bbb] block mb-3">Résultats pour</span>
        <h1 className="text-[32px] font-light tracking-[0.1em] text-[#1A1614] mb-4">"{query}"</h1>
        <p className="text-sm text-[#999]">
          {products.length} article{products.length > 1 ? "s" : ""} trouvé{products.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 md:gap-y-12">
        {products.map((p: Product) => (
          <ProductCard p={p} key={p.id} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-[100px]">
          <p className="text-[#888] mb-[30px]">
            Désolé, nous n'avons trouvé aucun article correspondant à votre recherche.
          </p>
          <Link href="/" className="inline-block py-4 px-10 bg-[#1A1614] text-white no-underline text-[11px] font-semibold tracking-[0.2em] transition-all hover:bg-[#333]">
            RETOURNER À LA BOUTIQUE
          </Link>
        </div>
      )}
    </div>
  );
}


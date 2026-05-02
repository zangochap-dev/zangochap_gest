"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";
import { Product } from "@/lib/types";
import { useCart } from "@/lib/CartContext";
import { ShoppingBag, Plus, Check } from "lucide-react";

export default function ProductCard({ p }: { p: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  
  const discount = p.oldPrice ? Math.round((1 - Number(p.price) / Number(p.oldPrice)) * 100) : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (p.variants && p.variants.length > 0) {
      const v = p.variants[0];
      addToCart({
        productId: p.id,
        variantId: v.id,
        name: p.name,
        price: Number(p.price),
        qty: 1,
        size: v.size,
        color: v.color,
        image: p.images?.[0]?.url
      });
      
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <Link href={`/product/${p.id}`} className="group block relative no-underline text-inherit">
      <div className="relative aspect-[3.5/4.5] bg-[#F7F6F3] overflow-hidden mb-4 rounded-sm">
        {p.images?.[0] ? (
          <img 
            src={p.images[0].url} 
            alt={p.name} 
            loading="lazy" 
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-extralight text-[#D5D0C8]">Z</div>
        )}
        
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-[#D4541C] text-white px-2 py-1 text-[10px] font-extrabold rounded-sm">
            -{discount}%
          </div>
        )}

        {/* QUICK ADD BUTTON */}
        <button 
          onClick={handleQuickAdd}
          className={`absolute bottom-3 right-3 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border-none cursor-pointer z-10 ${added ? 'bg-green-600 text-white scale-110' : 'bg-[#1A1614] text-white hover:bg-[#D4541C] md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100'}`}
          title="Ajouter au panier"
        >
          {added ? <Check size={16} /> : <Plus size={16} />}
        </button>
        
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 text-[#1A1614] py-3 text-center text-[10px] font-extrabold tracking-widest translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          VOIR LES DÉTAILS
        </div>
      </div>

      <div className="px-1">
        <span className="text-[9px] font-bold text-[#D4541C] uppercase tracking-widest mb-1.5 block">
          {p.category?.name || 'Mode'}
        </span>
        <h3 className="text-sm font-normal text-[#333] mb-1.5 whitespace-nowrap overflow-hidden text-overflow-ellipsis">
          {p.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#1A1614]">{formatPrice(Number(p.price))}</span>
          {p.oldPrice && (
            <span className="text-xs text-[#AAA] line-through">{formatPrice(Number(p.oldPrice))}</span>
          )}
        </div>
      </div>
    </Link>
  );
}


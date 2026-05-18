"use client";

import React, { useState, useMemo, useCallback } from "react";
import { formatPrice } from "@/lib/constants";
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, RotateCcw, Minus, Plus, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";
import { useCart } from "@/lib/CartContext";
import { useToast } from "@/components/Toast";

export default function ProductDetailClient({ product }: { product: any }) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const availableSizes = useMemo(() => {
    return Array.from(new Set(product.variants.map((v: any) => v.size)));
  }, [product.variants]);

  const availableColorsForSize = useMemo(() => {
    if (!selectedSize) return [];
    return product.variants
      .filter((v: any) => v.size === selectedSize)
      .map((v: any) => v.color);
  }, [product.variants, selectedSize]);

  // Check if a size has ANY available color
  const isSizeAvailable = (size: string) => {
    return product.variants.some((v: any) => v.size === size);
  };

  const currentVariant = useMemo(() => {
    if (!selectedSize || !selectedColor) return null;
    return product.variants.find((v: any) => v.size === selectedSize && v.color === selectedColor);
  }, [product.variants, selectedSize, selectedColor]);

  const handleAddToCart = useCallback(() => {
    if (!selectedSize || !selectedColor) {
      showToast("Veuillez sélectionner une taille et une couleur", "error");
      return;
    }
    if (!currentVariant) return;

    addToCart({
      productId: product.id,
      variantId: currentVariant.id,
      name: product.name,
      price: product.price,
      qty,
      size: selectedSize,
      color: selectedColor,
      image: product.images?.[0]?.url
    });
    setAdded(true);
    showToast("Ajouté au panier !", "success");
    setTimeout(() => setAdded(false), 2500);
  }, [selectedSize, selectedColor, currentVariant, qty, product, addToCart, showToast]);

  const discount = product.oldPrice ? Math.round((1 - Number(product.price) / Number(product.oldPrice)) * 100) : 0;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-[10px] pb-10 animate-[fadeUp_0.5s_ease] font-body w-full">
      {/* BREADCRUMB */}
      <div className="mb-2.5">
        <Link href="/" className="no-underline text-[#999] text-[12px] inline-flex items-center gap-1 font-medium tracking-wider transition-colors hover:text-[#1A1614]">
          <ChevronLeft size={14} /> Retour
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 items-start">
        {/* ═══ GALLERY ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[72px_1fr] gap-4 relative lg:sticky lg:top-[100px]">
          <div className="flex flex-row lg:flex-col gap-2.5 order-2 lg:order-1">
            {product.images.map((img: any, idx: number) => (
              <button
                key={idx}
                className={`w-[60px] h-[70px] lg:w-[72px] lg:h-[90px] border-2 bg-[#F5F3EF] cursor-pointer overflow-hidden p-0 transition-colors ${activeImg === idx ? 'border-[#1A1614]' : 'border-transparent'}`}
                onClick={() => setActiveImg(idx)}
              >
                <img src={getImageUrl(img.url)} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <div className="aspect-[3/4] bg-[#F5F3EF] overflow-hidden relative order-1 lg:order-2 group">
            {product.images?.[activeImg] ? (
              <img src={getImageUrl(product.images[activeImg].url)} alt={product.name} className="w-full h-full object-cover transition-transform duration-[6s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[100px] font-thin text-[#D5D0C8]">Z</div>
            )}
            {discount > 0 && <div className="absolute top-5 right-5 bg-[#C23616] text-white px-3.5 py-1.5 text-[11px] font-bold">-{discount}%</div>}
          </div>
        </div>

        {/* ═══ PRODUCT INFO ═══ */}
        <div className="pt-5 lg:pt-5">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#bbb] font-normal mb-3 block">Zangochap · Collection 2026</span>
            <h1 className="font-display text-4xl font-bold text-[#1A1614] tracking-tight leading-[1.1] mb-6">{product.name}</h1>

            <div className="flex items-baseline gap-3.5 mb-4 pb-4 border-b border-[#f0f0f0]">
              <span className="text-2xl font-semibold text-[#1A1614]">{formatPrice(product.price)}</span>
              {product.oldPrice && (
                <>
                  <span className="text-base text-[#bbb] line-through">{formatPrice(product.oldPrice)}</span>
                  <span className="text-[11px] font-bold text-[#C23616] bg-[#C2361610] px-2 py-0.5">-{discount}%</span>
                </>
              )}
            </div>

            <p className="text-sm leading-relaxed text-[#777] mb-5">
              {product.description || "Un produit d'exception qui allie qualité supérieure et design contemporain. Chaque détail a été pensé pour offrir une expérience unique."}
            </p>

            {/* SIZES */}
            <div className="mb-7">
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-[12px] font-medium uppercase tracking-wider text-[#1A1614]">Taille</span>
                {selectedSize && <span className="text-[12px] text-[#888]">{selectedSize}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s: any) => {
                  const available = isSizeAvailable(s);
                  return (
                    <button
                      key={s}
                      className={`min-w-[52px] h-[44px] bg-white border text-[12px] font-medium text-[#1A1614] transition-all tracking-wider relative ${selectedSize === s ? 'bg-[#1A1614] text-white border-[#1A1614]' : 'border-[#e0e0e0] hover:enabled:border-[#1A1614]'} ${!available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => { setSelectedSize(s); setSelectedColor(""); }}
                      disabled={!available}
                    >
                      {s}
                      {!available && <span className="absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-[#999] -rotate-[15deg]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLORS */}
            <div className="mb-7">
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-[12px] font-medium uppercase tracking-wider text-[#1A1614]">Couleur</span>
                {selectedColor && <span className="text-[12px] text-[#888]">{selectedColor}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSize ? (
                  availableColorsForSize.map((c: any) => (
                    <button
                      key={c}
                      className={`px-5 py-2.5 bg-white border text-[12px] font-medium text-[#1A1614] transition-all ${selectedColor === c ? 'bg-[#1A1614] text-white border-[#1A1614]' : 'border-[#e0e0e0] hover:border-[#1A1614]'}`}
                      onClick={() => setSelectedColor(c)}
                    >
                      {c}
                    </button>
                  ))
                ) : (
                  <span className="text-[12px] text-[#ccc] italic">Sélectionnez d'abord une taille</span>
                )}
              </div>
            </div>

            {/* STOCK INDICATOR */}
            {currentVariant && (
              <div className="mb-3 text-[12px] font-medium">
                {currentVariant.stock > 0 ? (
                  <span className={currentVariant.stock <= 3 ? 'text-[#C23616]' : 'text-[#2D8A4E]'}>
                    {currentVariant.stock <= 3 ? `⚠ Plus que ${currentVariant.stock} en stock` : `✓ En stock`}
                  </span>
                ) : (
                  <span className="text-[#C23616]">✕ Rupture de stock</span>
                )}
              </div>
            )}

            {/* QTY + ADD */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="flex items-center border border-[#e0e0e0] h-[52px]">
                <button className="w-11 h-full flex items-center justify-center text-[#1A1614] transition-colors hover:bg-[#f5f5f5]" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Moins"><Minus size={16} /></button>
                <span className="w-9 text-center font-semibold text-[15px] border-x border-[#e0e0e0] h-full flex items-center justify-center">{qty}</span>
                <button className="w-11 h-full flex-shrink-0 flex items-center justify-center text-[#1A1614] transition-colors hover:bg-[#f5f5f5]" onClick={() => setQty(qty + 1)} aria-label="Plus"><Plus size={16} /></button>
              </div>
              <button 
                className={`flex-1 h-[52px] text-white text-[12px] font-semibold tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all duration-350 ease-out active:scale-95 ${added ? 'bg-[#2D8A4E]' : 'bg-[#1A1614] hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0'}`} 
                onClick={handleAddToCart} 
                disabled={!currentVariant}
              >
                {added ? (
                  <><Check size={18} /> AJOUTÉ</>
                ) : (
                  <><ShoppingBag size={18} /> AJOUTER AU PANIER</>
                )}
              </button>
            </div>

            {/* TRUST */}
            <div className="flex flex-wrap gap-3 mb-9">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border border-[#f0f0f0] text-[11px] font-medium text-[#888] tracking-wider"><Truck size={15} /> Livraison express</div>
              <div className="flex items-center gap-1.5 px-4 py-2.5 border border-[#f0f0f0] text-[11px] font-medium text-[#888] tracking-wider"><RotateCcw size={15} /> Retours 7j</div>
              <div className="flex items-center gap-1.5 px-4 py-2.5 border border-[#f0f0f0] text-[11px] font-medium text-[#888] tracking-wider"><ShieldCheck size={15} /> Qualité garantie</div>
            </div>

            {/* DETAILS ACCORDION */}
            <details className="border-t border-[#f0f0f0] group">
              <summary className="py-5 text-[12px] font-medium uppercase tracking-widest cursor-pointer text-[#1A1614] flex justify-between items-center list-none after:content-['+'] after:text-lg after:font-light after:text-[#999] group-open:after:content-['−']">
                Détails du produit
              </summary>
              <div className="pb-5 text-[13px] leading-relaxed text-[#777] space-y-2">
                {product.material && <p><strong className="text-[#555]">Matière :</strong> {product.material}</p>}
                {product.origin && <p><strong className="text-[#555]">Origine :</strong> {product.origin}</p>}
                <p><strong className="text-[#555]">Entretien :</strong> Suivez les indications sur l'étiquette intérieure.</p>
              </div>
            </details>
            <details className="border-t border-[#f0f0f0] group">
              <summary className="py-5 text-[12px] font-medium uppercase tracking-widest cursor-pointer text-[#1A1614] flex justify-between items-center list-none after:content-['+'] after:text-lg after:font-light after:text-[#999] group-open:after:content-['−']">
                Livraison & Retours
              </summary>
              <div className="pb-5 text-[13px] leading-relaxed text-[#777] space-y-2">
                <p>Livraison gratuite à Abidjan pour toute commande de plus de 25 000 F CFA.</p>
                <p>Retours gratuits sous 7 jours après réception.</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

  );
}

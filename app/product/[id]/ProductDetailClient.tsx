"use client";

import React, { useState, useMemo, useCallback } from "react";
import { formatPrice } from "@/lib/constants";
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, RotateCcw, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils";
import { useCart } from "@/lib/CartContext";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import PublicVariantModal from "@/components/public/PublicVariantModal";

export default function ProductDetailClient({ product }: { product: any }) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [modalType, setModalType] = useState<"cart" | "buy" | null>(null);
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();

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

  const discount = product.oldPrice ? Math.round((1 - Number(product.price) / Number(product.oldPrice)) * 100) : 0;

  const addSelectedVariant = useCallback((variant: any, quantity: number) => {
    addToCart({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      price: Number(product.price),
      qty: quantity,
      size: variant.size,
      color: variant.color,
      image: getImageUrl(variant.image || product.images?.[0]?.url),
    });
    setAdded(true);
    setModalType(null);
    showToast("Ajoute au panier !", "success");
    setTimeout(() => setAdded(false), 2500);
  }, [addToCart, product, showToast]);

  const handleBuyNow = useCallback((variant: any, quantity: number) => {
    sessionStorage.setItem("zangochap_buy_now", JSON.stringify({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      price: Number(product.price),
      qty: quantity,
      size: variant.size,
      color: variant.color,
      image: getImageUrl(variant.image || product.images?.[0]?.url),
    }));
    setModalType(null);
    router.push("/cart?buyNow=1");
  }, [product, router]);

  return (
    <div className="max-w-[1440px] relative mx-auto px-4 md:px-10 py-[10px] pb-28 sm:pb-10 animate-[fadeUp_0.5s_ease] font-body w-full">
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
                      className={`min-w-[52px] h-[44px] border text-[12px] font-medium transition-all tracking-wider relative ${selectedSize === s ? 'bg-[#1A1614] text-white border-[#1A1614]' : 'bg-white text-[#1A1614] border-[#e0e0e0] hover:enabled:border-[#1A1614]'} ${!available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
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
                      className={`px-5 py-2.5 border text-[12px] font-medium transition-all ${selectedColor === c ? 'bg-[#1A1614] text-white border-[#1A1614]' : 'bg-white text-[#1A1614] border-[#e0e0e0] hover:border-[#1A1614]'}`}
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
            {currentVariant && currentVariant.stock > 0 && (
              <div className="mb-3 text-[12px] font-medium">
                <span className={currentVariant.stock <= 3 ? 'text-[#C23616]' : 'text-[#2D8A4E]'}>
                  {currentVariant.stock <= 3 ? `⚠ Plus que ${currentVariant.stock} en stock` : `✓ En stock`}
                </span>
              </div>
            )}

            {/* PURCHASE ACTIONS */}
            <div className="fixed bottom-10 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#f0f0f0] p-4 z-40 flex flex-row gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] sm:static sm:p-0 sm:border-0 sm:shadow-none sm:bg-transparent sm:backdrop-blur-none sm:z-auto sm:mb-8 sm:flex-row sm:gap-3">
              <button
                className={`flex-1 h-[54px] sm:h-[52px] text-white text-[10px] xs:text-[11px] sm:text-[12px] font-semibold tracking-[0.1em] sm:tracking-[0.15em] flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all duration-350 ease-out active:scale-95 ${added ? 'bg-[#2D8A4E]' : 'bg-[#1A1614] hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0'}`}
                onClick={() => {
                  if (currentVariant) {
                    addSelectedVariant(currentVariant, 1);
                  } else {
                    setModalType("cart");
                  }
                }}
                disabled={!product.variants.length}
              >
                {added ? (
                  <><Check size={18} /> AJOUTÉ</>
                ) : (
                  <><ShoppingBag size={18} /> AJOUTER AU PANIER</>
                )}
              </button>
              <button
                className="flex-1 h-[54px] sm:h-[52px] bg-[#D4541C] text-white text-[10px] xs:text-[11px] sm:text-[12px] font-semibold tracking-[0.1em] sm:tracking-[0.15em] flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all duration-350 hover:bg-[#B33D0E] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                onClick={() => {
                  if (currentVariant) {
                    handleBuyNow(currentVariant, 1);
                  } else {
                    setModalType("buy");
                  }
                }}
                disabled={!product.variants.length}
              >
                <ArrowRight size={18} /> ACHETER
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
      <PublicVariantModal
        product={modalType ? product : null}
        onClose={() => setModalType(null)}
        onConfirm={modalType === "buy" ? handleBuyNow : addSelectedVariant}
        title={modalType === "buy" ? "Acheter ce produit" : "Choisir la variante"}
        actionLabel={modalType === "buy" ? "Acheter" : "Valider le panier"}
      />
    </div>

  );
}

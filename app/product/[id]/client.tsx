"use client";

import React, { useState, useMemo } from "react";
import { formatPrice } from "@/lib/constants";
import { ShoppingBag, ChevronLeft, Star, ShieldCheck, Truck, RotateCcw, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useToast } from "@/components/Toast";
import "./client.css";

export default function ProductDetailClient({ product }: { product: any }) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const availableSizes = useMemo(() => {
    return Array.from(new Set(product.variants.map((v: any) => v.size)));
  }, [product.variants]);

  const availableColorsForSize = useMemo(() => {
    if (!selectedSize) return [];
    return product.variants.filter((v: any) => v.size === selectedSize).map((v: any) => v.color);
  }, [product.variants, selectedSize]);

  const currentVariant = useMemo(() => {
    if (!selectedSize || !selectedColor) return null;
    return product.variants.find((v: any) => v.size === selectedSize && v.color === selectedColor);
  }, [product.variants, selectedSize, selectedColor]);

  const handleAddToCart = () => {
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
    showToast("Ajouté au panier !", "success");
  };

  return (
    <div className="product-page-container">
      <div className="breadcrumb">
        <Link href="/"><ChevronLeft size={16} /> Retour à la boutique</Link>
      </div>

      <div className="product-grid-main">
        {/* GALLERY */}
        <div className="product-gallery">
          <div className="main-image">
            {product.images?.[0] ? (
              <img src={product.images[0].url} alt={product.name} />
            ) : (
              <div className="no-img">📦</div>
            )}
          </div>
          <div className="thumb-strip">
            {product.images.map((img: any, idx: number) => (
              <div key={idx} className={`thumb ${idx === 0 ? 'active' : ''}`}>
                <img src={img.url} />
              </div>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div className="product-info-panel">
          <div className="badge-new">Nouveauté</div>
          <h1>{product.name}</h1>
          <div className="product-meta-row">
            <div className="stars">
              <Star size={16} fill="var(--orange)" color="var(--orange)" />
              <Star size={16} fill="var(--orange)" color="var(--orange)" />
              <Star size={16} fill="var(--orange)" color="var(--orange)" />
              <Star size={16} fill="var(--orange)" color="var(--orange)" />
              <Star size={16} fill="#DEE2E6" color="#DEE2E6" />
              <span>(128 avis)</span>
            </div>
            <div className="sku">Catégorie: {product.category}</div>
          </div>

          <div className="price-box">
            <span className="current-price">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="old-price-pd">{formatPrice(product.oldPrice)}</span>}
          </div>

          <p className="description">{product.description || "Aucune description disponible pour ce produit premium."}</p>

          <div className="selectors">
            <div className="selector-group">
              <label>Choisir la taille</label>
              <div className="option-grid">
                {availableSizes.map((s: any) => (
                  <button 
                    key={s} 
                    className={`opt-btn ${selectedSize === s ? 'active' : ''}`}
                    onClick={() => { setSelectedSize(s); setSelectedColor(""); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="selector-group">
              <label>Choisir la couleur</label>
              <div className="option-grid">
                {selectedSize ? (
                  availableColorsForSize.map((c: any) => (
                    <button 
                      key={c} 
                      className={`opt-btn ${selectedColor === c ? 'active' : ''}`}
                      onClick={() => setSelectedColor(c)}
                    >
                      {c}
                    </button>
                  ))
                ) : (
                  <div className="placeholder-text">Sélectionnez d'abord une taille</div>
                )}
              </div>
            </div>

            <div className="qty-and-cart">
              <div className="qty-input">
                <button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={18} /></button>
                <span>{qty}</span>
                <button onClick={() => setQty(qty + 1)}><Plus size={18} /></button>
              </div>
              <button className="add-cart-pd" onClick={handleAddToCart}>
                <ShoppingBag size={20} />
                Ajouter au panier
              </button>
            </div>
          </div>

          <div className="trust-badges">
            <div className="trust-item"><Truck size={18} /> <span>Livraison 24h</span></div>
            <div className="trust-item"><RotateCcw size={18} /> <span>Retours 7 jours</span></div>
            <div className="trust-item"><ShieldCheck size={18} /> <span>Paiement sécurisé</span></div>
          </div>
        </div>
      </div>

      
    </div>
  );
}

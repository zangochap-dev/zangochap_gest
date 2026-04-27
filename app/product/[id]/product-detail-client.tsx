"use client";

import React, { useState, useMemo } from "react";
import { formatPrice } from "@/lib/constants";
import { ShoppingBag, ChevronLeft, Star, ShieldCheck, Truck, RotateCcw, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useToast } from "@/components/Toast";

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

      <style jsx>{`
        .product-page-container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; animation: fadeIn 0.5s ease; }
        .breadcrumb { margin-bottom: 30px; }
        .breadcrumb a { text-decoration: none; color: #6C757D; font-size: 14px; display: flex; align-items: center; gap: 6px; font-weight: 600; }
        
        .product-grid-main { display: grid; grid-template-columns: 1fr 500px; gap: 60px; }
        
        /* GALLERY */
        .product-gallery { display: flex; flex-direction: column; gap: 20px; }
        .main-image { background: #F8F9FA; border-radius: 32px; overflow: hidden; aspect-ratio: 1; border: 1px solid rgba(0,0,0,0.03); }
        .main-image img { width: 100%; height: 100%; object-fit: cover; }
        .thumb-strip { display: flex; gap: 16px; }
        .thumb { width: 80px; height: 80px; border-radius: 12px; overflow: hidden; border: 2px solid transparent; cursor: pointer; }
        .thumb.active { border-color: #D4541C; }
        .thumb img { width: 100%; height: 100%; object-fit: cover; }

        /* INFO */
        .product-info-panel { }
        .badge-new { display: inline-block; padding: 4px 12px; background: #D4541C15; color: #D4541C; border-radius: 100px; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; }
        h1 { font-size: 40px; font-weight: 800; color: #1A1614; margin-bottom: 12px; letter-spacing: -0.02em; }
        .product-meta-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; }
        .stars { display: flex; align-items: center; gap: 4px; }
        .stars span { font-size: 13px; color: #6C757D; font-weight: 600; margin-left: 6px; }
        .sku { font-size: 12px; color: #ADB5BD; font-weight: 700; text-transform: uppercase; }

        .price-box { margin-bottom: 30px; display: flex; align-items: center; gap: 16px; }
        .current-price { font-size: 32px; font-weight: 800; color: #D4541C; }
        .old-price-pd { font-size: 18px; text-decoration: line-through; color: #ADB5BD; font-weight: 600; }
        
        .description { font-size: 16px; line-height: 1.7; color: #495057; margin-bottom: 40px; border-bottom: 1px solid #F1F3F5; padding-bottom: 40px; }

        .selector-group { margin-bottom: 30px; }
        .selector-group label { display: block; font-size: 14px; font-weight: 800; color: #1A1614; text-transform: uppercase; margin-bottom: 12px; }
        .option-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .opt-btn { padding: 12px 24px; background: white; border: 2px solid #F1F3F5; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .opt-btn:hover { border-color: #D4541C; }
        .opt-btn.active { border-color: #D4541C; background: #1A1614; color: white; border-width: 2px; }
        .placeholder-text { font-size: 13px; color: #ADB5BD; font-style: italic; }

        .qty-and-cart { display: flex; gap: 20px; margin-top: 40px; }
        .qty-input { display: flex; align-items: center; background: #F8F9FA; padding: 6px; border-radius: 14px; border: 1px solid #E9ECEF; }
        .qty-input button { width: 44px; height: 44px; border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #1A1614; border-radius: 10px; transition: background 0.2s; }
        .qty-input button:hover { background: #E9ECEF; }
        .qty-input span { width: 40px; text-align: center; font-weight: 800; font-size: 18px; }
        
        .add-cart-pd { flex: 1; height: 60px; background: #1A1614; color: white; border: none; border-radius: 16px; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: transform 0.2s; }
        .add-cart-pd:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.1); }

        .trust-badges { margin-top: 50px; display: flex; gap: 30px; padding-top: 30px; border-top: 1px solid #F1F3F5; }
        .trust-item { display: flex; align-items: center; gap: 10px; color: #6C757D; font-size: 13px; font-weight: 600; }

        @media (max-width: 900px) {
          .product-grid-main { grid-template-columns: 1fr; gap: 40px; }
          h1 { font-size: 32px; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

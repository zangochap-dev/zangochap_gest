"use client";

import React, { useState, useMemo, useCallback } from "react";
import { formatPrice } from "@/lib/constants";
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, RotateCcw, Minus, Plus, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
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
      .filter((v: any) => v.size === selectedSize && v.stock > 0)
      .map((v: any) => v.color);
  }, [product.variants, selectedSize]);

  // Check if a size has ANY available color
  const isSizeAvailable = (size: string) => {
    return product.variants.some((v: any) => v.size === size && v.stock > 0);
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
    if (currentVariant.stock <= 0) {
      showToast("Ce produit est en rupture de stock", "error");
      return;
    }
    if (qty > currentVariant.stock) {
      showToast(`Seulement ${currentVariant.stock} disponible(s) pour cette variante`, "error");
      return;
    }

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
    <div className="pdp-container">
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <Link href="/"><ChevronLeft size={14} /> Retour</Link>
      </div>

      <div className="pdp-grid">
        {/* ═══ GALLERY ═══ */}
        <div className="gallery">
          <div className="gallery-thumbs">
            {product.images.map((img: any, idx: number) => (
              <button
                key={idx}
                className={`thumb ${activeImg === idx ? 'active' : ''}`}
                onClick={() => setActiveImg(idx)}
              >
                <img src={img.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div className="gallery-main">
            {product.images?.[activeImg] ? (
              <img src={product.images[activeImg].url} alt={product.name} />
            ) : (
              <div className="no-img">Z</div>
            )}
            {discount > 0 && <div className="sale-badge">-{discount}%</div>}
          </div>
        </div>

        {/* ═══ PRODUCT INFO ═══ */}
        <div className="info-panel">
          <div className="info-scroll">
            <span className="info-eyebrow">Zangochap · Collection 2026</span>
            <h1>{product.name}</h1>

            <div className="price-block">
              <span className="current-price">{formatPrice(product.price)}</span>
              {product.oldPrice && (
                <>
                  <span className="old-price">{formatPrice(product.oldPrice)}</span>
                  <span className="discount-tag">-{discount}%</span>
                </>
              )}
            </div>

            <p className="description">
              {product.description || "Un produit d'exception qui allie qualité supérieure et design contemporain. Chaque détail a été pensé pour offrir une expérience unique."}
            </p>

            {/* SIZES */}
            <div className="selector">
              <div className="selector-label">
                <span>Taille</span>
                {selectedSize && <span className="selected-val">{selectedSize}</span>}
              </div>
              <div className="size-grid">
                {availableSizes.map((s: any) => {
                  const available = isSizeAvailable(s);
                  return (
                    <button
                      key={s}
                      className={`size-btn ${selectedSize === s ? 'active' : ''} ${!available ? 'oos' : ''}`}
                      onClick={() => { setSelectedSize(s); setSelectedColor(""); }}
                      disabled={!available}
                    >
                      {s}
                      {!available && <span className="oos-line" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLORS */}
            <div className="selector">
              <div className="selector-label">
                <span>Couleur</span>
                {selectedColor && <span className="selected-val">{selectedColor}</span>}
              </div>
              <div className="color-grid">
                {selectedSize ? (
                  availableColorsForSize.map((c: any) => (
                    <button
                      key={c}
                      className={`color-btn ${selectedColor === c ? 'active' : ''}`}
                      onClick={() => setSelectedColor(c)}
                    >
                      {c}
                    </button>
                  ))
                ) : (
                  <span className="hint">Sélectionnez d'abord une taille</span>
                )}
              </div>
            </div>

            {/* STOCK INDICATOR */}
            {currentVariant && (
              <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 500 }}>
                {currentVariant.stock > 0 ? (
                  <span style={{ color: currentVariant.stock <= 3 ? '#C23616' : '#2D8A4E' }}>
                    {currentVariant.stock <= 3 ? `⚠ Plus que ${currentVariant.stock} en stock` : `✓ En stock`}
                  </span>
                ) : (
                  <span style={{ color: '#C23616' }}>✕ Rupture de stock</span>
                )}
              </div>
            )}

            {/* QTY + ADD */}
            <div className="action-row">
              <div className="qty-control">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Moins"><Minus size={16} /></button>
                <span>{qty}</span>
                <button onClick={() => setQty(Math.min(currentVariant?.stock || 99, qty + 1))} aria-label="Plus"><Plus size={16} /></button>
              </div>
              <button className={`add-to-cart ${added ? 'added' : ''}`} onClick={handleAddToCart} disabled={!currentVariant || currentVariant.stock <= 0}>
                {added ? (
                  <><Check size={18} /> AJOUTÉ</>
                ) : currentVariant && currentVariant.stock <= 0 ? (
                  <>RUPTURE DE STOCK</>
                ) : (
                  <><ShoppingBag size={18} /> AJOUTER AU PANIER</>
                )}
              </button>
            </div>

            {/* TRUST */}
            <div className="trust-row">
              <div className="trust-chip"><Truck size={15} /> Livraison express</div>
              <div className="trust-chip"><RotateCcw size={15} /> Retours 7j</div>
              <div className="trust-chip"><ShieldCheck size={15} /> Qualité garantie</div>
            </div>

            {/* DETAILS ACCORDION */}
            <details className="detail-block">
              <summary>Détails du produit</summary>
              <div className="detail-content">
                {product.material && <p><strong>Matière :</strong> {product.material}</p>}
                {product.origin && <p><strong>Origine :</strong> {product.origin}</p>}
                <p><strong>Entretien :</strong> Suivez les indications sur l'étiquette intérieure.</p>
              </div>
            </details>
            <details className="detail-block">
              <summary>Livraison & Retours</summary>
              <div className="detail-content">
                <p>Livraison gratuite à Abidjan pour toute commande de plus de 25 000 F CFA.</p>
                <p>Retours gratuits sous 7 jours après réception.</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pdp-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 10px 20px 40px;
          animation: fadeUp 0.5s ease;
        }
        .breadcrumb { margin-bottom: 10px; }
        .breadcrumb :global(a) {
          text-decoration: none;
          color: #999;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
          letter-spacing: 0.04em;
          transition: color 0.2s;
        }
        .breadcrumb :global(a:hover) { color: #1A1614; }

        /* ═══ GRID ═══ */
        .pdp-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 40px;
          align-items: start;
        }

        /* ═══ GALLERY ═══ */
        .gallery {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 16px;
          position: sticky;
          top: 100px;
        }
        .gallery-thumbs {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .thumb {
          width: 72px; height: 90px;
          border: 2px solid transparent;
          background: #F5F3EF;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.3s;
          padding: 0;
        }
        .thumb.active { border-color: #1A1614; }
        .thumb img { width: 100%; height: 100%; object-fit: cover; }
        .gallery-main {
          aspect-ratio: 3/4;
          background: #F5F3EF;
          overflow: hidden;
          position: relative;
        }
        .gallery-main img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 6s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .gallery-main:hover img { transform: scale(1.04); }
        .sale-badge {
          position: absolute;
          top: 20px; right: 20px;
          background: #C23616;
          color: white;
          padding: 6px 14px;
          font-size: 11px;
          font-weight: 700;
        }
        .no-img {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 100px; font-weight: 100; color: #D5D0C8;
        }

        /* ═══ INFO PANEL ═══ */
        .info-panel { padding-top: 20px; }
        .info-eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: #bbb;
          font-weight: 400;
          display: block;
          margin-bottom: 12px;
        }
        .info-panel h1 {
          font-size: 30px;
          font-weight: 300;
          color: #1A1614;
          letter-spacing: -0.01em;
          line-height: 1.25;
          margin-bottom: 24px;
        }

        /* PRICE */
        .price-block {
          display: flex;
          align-items: baseline;
          gap: 14px;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #f0f0f0;
        }
        .current-price {
          font-size: 24px;
          font-weight: 600;
          color: #1A1614;
        }
        .old-price {
          font-size: 16px;
          color: #bbb;
          text-decoration: line-through;
        }
        .discount-tag {
          font-size: 11px;
          font-weight: 700;
          color: #C23616;
          background: #C2361610;
          padding: 3px 8px;
        }

        .description {
          font-size: 14px;
          line-height: 1.6;
          color: #777;
          margin-bottom: 20px;
        }

        /* SELECTORS */
        .selector { margin-bottom: 28px; }
        .selector-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .selector-label span {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #1A1614;
        }
        .selected-val {
          font-weight: 400 !important;
          color: #888 !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
        }
        .size-grid, .color-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .size-btn {
          min-width: 52px; height: 44px;
          background: white;
          border: 1px solid #e0e0e0;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          color: #1A1614;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .size-btn:hover:not(:disabled) { border-color: #1A1614; }
        .size-btn.active {
          background: #1A1614;
          color: white;
          border-color: #1A1614;
        }
        .size-btn.oos {
          opacity: 0.4;
          cursor: not-allowed;
          position: relative;
        }
        .oos-line {
          position: absolute;
          top: 50%; left: 10%; right: 10%;
          height: 1px;
          background: #999;
          transform: rotate(-15deg);
        }
        .color-btn {
          padding: 10px 20px;
          background: white;
          border: 1px solid #e0e0e0;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          color: #1A1614;
          transition: all 0.2s;
        }
        .color-btn:hover { border-color: #1A1614; }
        .color-btn.active {
          background: #1A1614;
          color: white;
          border-color: #1A1614;
        }
        .hint {
          font-size: 12px;
          color: #ccc;
          font-style: italic;
        }

        /* ACTION ROW */
        .action-row {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
        }
        .qty-control {
          display: flex;
          align-items: center;
          border: 1px solid #e0e0e0;
          height: 52px;
        }
        .qty-control button {
          width: 44px; height: 100%;
          background: none; border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #1A1614;
          transition: background 0.2s;
        }
        .qty-control button:hover { background: #f5f5f5; }
        .qty-control span {
          width: 36px;
          text-align: center;
          font-weight: 600;
          font-size: 15px;
          border-left: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .add-to-cart {
          flex: 1; height: 52px;
          background: #1A1614;
          color: white;
          border: none;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.15em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .add-to-cart:hover {
          background: #333;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .add-to-cart.added {
          background: #2D8A4E;
        }

        /* TRUST */
        .trust-row {
          display: flex;
          gap: 12px;
          margin-bottom: 36px;
          flex-wrap: wrap;
        }
        .trust-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 16px;
          border: 1px solid #f0f0f0;
          font-size: 11px;
          font-weight: 500;
          color: #888;
          letter-spacing: 0.02em;
        }

        /* DETAILS */
        .detail-block {
          border-top: 1px solid #f0f0f0;
        }
        .detail-block summary {
          padding: 20px 0;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          color: #1A1614;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .detail-block summary::after {
          content: '+';
          font-size: 18px;
          font-weight: 300;
          color: #999;
        }
        .detail-block[open] summary::after { content: '−'; }
        .detail-content {
          padding-bottom: 20px;
          font-size: 13px;
          line-height: 1.7;
          color: #777;
        }
        .detail-content p { margin-bottom: 8px; }
        .detail-content strong { color: #555; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .pdp-grid { grid-template-columns: 1fr; gap: 40px; }
          .gallery { position: static; grid-template-columns: 1fr; }
          .gallery-thumbs { flex-direction: row; order: 2; }
          .thumb { width: 60px; height: 70px; }
          .pdp-container { padding: 16px 20px 100px; }
        }
        @media (max-width: 600px) {
          .action-row { flex-direction: column; }
          .add-to-cart { height: 56px; }
          .trust-row { gap: 8px; }
          .trust-chip { font-size: 10px; padding: 8px 12px; }
          .info-panel h1 { font-size: 24px; }
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

"use client";

import React from "react";
import { formatPrice } from "@/lib/constants";
import Link from "next/link";
import { ArrowRight, Zap, Sparkles, Tag } from "lucide-react";

import { Product, Category } from "@/lib/types";

export default function HomeClient({ products, categories, latestPromo }: {
  products: Product[],
  categories: Category[],
  latestPromo: any
}) {
  // Logic
  const flashSales = products.filter((p: Product) => p.oldPrice && Number(p.oldPrice) > Number(p.price)).slice(0, 4);
  const newArrivals = products.slice(0, 6);

  return (
    <div className="home-modern">
      {/* 1. HERO SIMPLE - PROMOTION */}
      <section className="hero-promo">
        <div className="promo-card">
          <div className="promo-tag"><Tag size={14} /> OFFRE SPÉCIALE</div>
          {latestPromo ? (
            <>
              <h1>-{latestPromo.value}{latestPromo.type === 'PERCENT' ? '%' : ' F'} SUR TOUT</h1>
              <p>Utilisez le code <span className="promo-code">{latestPromo.code}</span> lors de votre commande.</p>
            </>
          ) : (
            <>
              <h1>ÉLÉGANCE AU QUOTIDIEN</h1>
              <p>Découvrez notre nouvelle collection exclusive.</p>
            </>
          )}
          <Link href="/shop" className="hero-btn">VOIR LA BOUTIQUE</Link>
        </div>
      </section>

      {/* 2. CATÉGORIES */}
      <section className="section categories-section">
        <div className="section-header">
          <h2>NOS CATÉGORIES</h2>
        </div>
        <div className="categories-grid">
          {categories.map((cat: Category) => (
            <Link href={`/search?q=${cat.name}`} key={cat.id} className="category-item">
              <div className="cat-icon-box">
                {cat.name.charAt(0)}
              </div>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. VENTE FLASH */}
      {flashSales.length > 0 && (
        <section className="section flash-section">
          <div className="section-header">
            <div className="header-with-icon">
              <Zap size={20} color="#C23616" fill="#C23616" />
              <h2>VENTES FLASH</h2>
              <CountdownTimer />
            </div>
            <p>Offres à durée limitée</p>
          </div>
          <div className="product-grid">
            {flashSales.map((p: Product) => (
              <ProductCard p={p} key={p.id} />
            ))}
          </div>
        </section>
      )}

      {/* 4. NOUVEAUTÉS */}
      <section id="shop" className="section news-section">
        <div className="section-header">
          <div className="header-with-icon">
            <Sparkles size={20} color="#E8C07A" fill="#E8C07A" />
            <h2>NOUVEAUTÉS</h2>
          </div>
          <p>Les dernières pièces de la collection</p>
        </div>
        <div className="product-grid">
          {newArrivals.map((p: Product) => (
            <ProductCard p={p} key={p.id} />
          ))}
        </div>
        <div className="see-more-wrap">
          <button className="see-more">VOIR TOUT LE CATALOGUE</button>
        </div>
      </section>

      <style jsx>{`
        .home-modern { background: #FFFFFF; }

        .section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .section-header {
          margin-bottom: 24px;
          text-align: left;
        }
        .header-with-icon {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }
        .section-header h2 {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: #1A1614;
        }
        .section-header p {
          font-size: 13px;
          color: #888;
        }

        /* HERO */
        .hero-promo {
          padding: 20px;
          background: #F9F9F7;
          display: flex;
          justify-content: center;
        }
        .promo-card {
          width: 100%;
          max-width: 600px;
          background: #1A1614;
          color: white;
          padding: 24px 32px;
          text-align: center;
          border-radius: 4px;
        }
        .promo-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: #E8C07A;
          margin-bottom: 16px;
          letter-spacing: 0.1em;
        }
        .promo-card h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .promo-card p {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 24px;
        }
        .promo-code {
          color: white;
          font-weight: 700;
          border-bottom: 1px dashed #E8C07A;
        }
        .hero-btn {
          display: inline-block;
          padding: 14px 32px;
          background: white;
          color: #1A1614;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          border-radius: 2px;
          transition: transform 0.2s;
        }
        .hero-btn:hover { transform: translateY(-2px); }

        /* CATEGORIES */
        .categories-grid {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 10px;
        }
        .categories-grid::-webkit-scrollbar { display: none; }
        .category-item {
          flex: 0 0 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #1A1614;
        }
        .cat-icon-box {
          width: 64px; height: 64px;
          background: #F3F1ED;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 600; color: #1A1614;
          transition: background 0.3s;
        }
        .category-item:hover .cat-icon-box { background: #E8C07A; }
        .category-item span {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* PRODUCT GRID - 2X2 */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px 12px;
        }

        .see-more-wrap {
          margin-top: 40px;
          display: flex;
          justify-content: center;
        }
        .see-more {
          background: none;
          border: 1px solid #1A1614;
          padding: 12px 32px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s;
        }
        .see-more:hover {
          background: #1A1614;
          color: white;
        }

        @media (min-width: 768px) {
          .section { padding: 80px 20px; }
          .hero-promo { padding: 60px 20px; }
          .promo-card { padding: 48px 64px; }
          .section-header { margin-bottom: 40px; }
          .section-header h2 { font-size: 28px; }
          .product-grid { grid-template-columns: repeat(4, 1fr); gap: 48px 24px; }
          .promo-card h1 { font-size: 48px; }
          .categories-grid { justify-content: center; overflow-x: visible; gap: 40px; }
          .category-item { flex: 0 0 100px; }
          .cat-icon-box { width: 80px; height: 80px; font-size: 24px; }
        }
      `}</style>
    </div>
  );
}

function CountdownTimer() {
  const [time, setTime] = React.useState({ h: 12, m: 0, s: 0 });

  React.useEffect(() => {
    // Calcul du temps restant jusqu'à minuit pour la démo
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
    <div className="timer">
      <div className="t-box">{String(time.h).padStart(2, '0')}</div>
      <span>:</span>
      <div className="t-box">{String(time.m).padStart(2, '0')}</div>
      <span>:</span>
      <div className="t-box">{String(time.s).padStart(2, '0')}</div>
      <style jsx>{`
        .timer {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
        }
        .t-box {
          background: #1A1614;
          color: white;
          padding: 4px 6px;
          font-size: 11px;
          font-weight: 700;
          border-radius: 2px;
          min-width: 24px;
          text-align: center;
        }
        span { font-weight: 700; font-size: 11px; color: #1A1614; }
      `}</style>
    </div>
  );
}

function ProductCard({ p }: { p: any }) {
  const discount = p.oldPrice ? Math.round((1 - Number(p.price) / Number(p.oldPrice)) * 100) : 0;

  return (
    <Link href={`/product/${p.id}`} className="p-card">
      <div className="p-img">
        {p.images?.[0] ? (
          <img src={p.images[0].url} alt={p.name} loading="lazy" />
        ) : (
          <div className="placeholder">Z</div>
        )}
        {discount > 0 && <div className="p-badge">-{discount}%</div>}
      </div>
      <div className="p-info">
        <h3>{p.name}</h3>
        <div className="p-price-row">
          <span className="p-price">{formatPrice(Number(p.price))}</span>
          {p.oldPrice && <span className="p-old-price">{formatPrice(Number(p.oldPrice))}</span>}
        </div>
      </div>
      <style jsx>{`
        .p-card { 
          text-decoration: none; 
          color: inherit; 
          display: block;
          min-width: 0;
        }
        .p-img {
          aspect-ratio: 3/4;
          background: #F5F3EF;
          position: relative;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .p-img img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .p-card:hover .p-img img { transform: scale(1.05); }
        .placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; font-weight: 100; color: #D5D0C8;
        }
        .p-badge {
          position: absolute;
          top: 8px; right: 8px;
          background: #C23616;
          color: white;
          padding: 3px 7px;
          font-size: 9px;
          font-weight: 700;
        }
        .p-info {
          min-width: 0;
        }
        .p-info h3 {
          font-size: 12px;
          font-weight: 400;
          color: #555;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .p-price-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .p-price { font-size: 13px; font-weight: 700; color: #1A1614; }
        .p-old-price { font-size: 11px; color: #aaa; text-decoration: line-through; }
      `}</style>
    </Link>
  );
}

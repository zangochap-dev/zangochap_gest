"use client";

import React, { useState, useMemo } from "react";
import { formatPrice } from "@/lib/constants";
import Link from "next/link";
import { Filter, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Product, Category } from "@/lib/types";

export default function ShopClient({ initialProducts, categories }: { 
  initialProducts: Product[], 
  categories: Category[] 
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<number>(500000);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Filter Logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    if (selectedCategory) {
      result = result.filter(p => p.category?.name === selectedCategory);
    }

    result = result.filter(p => Number(p.price) <= priceRange);

    if (sortBy === "price-asc") result.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "price-desc") result.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [initialProducts, selectedCategory, priceRange, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="shop-page">
      <div className="shop-container">
        {/* HEADER */}
        <div className="shop-header">
          <div className="breadcrumb">ACCUEIL / BOUTIQUE</div>
          <h1>NOTRE COLLECTION</h1>
          <div className="shop-controls">
            <button className="filter-toggle" onClick={() => setShowFilters(true)}>
              <SlidersHorizontal size={16} /> FILTRER
            </button>
            <div className="sort-wrap">
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                <option value="newest">NOUVEAUTÉS</option>
                <option value="price-asc">PRIX CROISSANT</option>
                <option value="price-desc">PRIX DÉCROISSANT</option>
              </select>
            </div>
          </div>
        </div>

        <div className="shop-content">
          {/* SIDEBAR FILTERS (Desktop) */}
          <aside className="sidebar">
            <div className="filter-group">
              <h3>CATÉGORIES</h3>
              <div className="filter-list">
                <button 
                  className={!selectedCategory ? "active" : ""} 
                  onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
                >
                  Tout voir
                </button>
                {categories.map((cat: Category) => (
                  <button 
                    key={cat.id}
                    className={selectedCategory === cat.name ? "active" : ""}
                    onClick={() => { setSelectedCategory(cat.name); setCurrentPage(1); }}
                  >
                    {cat.name} <span>({cat._count?.products})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h3>PRIX MAX</h3>
              <div className="price-slider">
                <input 
                  type="range" 
                  min="0" 
                  max="500000" 
                  step="5000"
                  value={priceRange} 
                  onChange={(e) => { setPriceRange(Number(e.target.value)); setCurrentPage(1); }} 
                />
                <div className="price-labels">
                  <span>0 F</span>
                  <span>{formatPrice(priceRange)}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN GRID */}
          <main className="main-grid">
            <div className="results-count">{filteredProducts.length} PRODUITS TROUVÉS</div>
            <div className="product-grid">
              {paginatedProducts.map((p: Product) => (
                <ProductCard p={p} key={p.id} />
              ))}
            </div>

            {/* PAGINATION UI */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0, 0); }}
                >
                  PRÉC.
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i} 
                    className={currentPage === i + 1 ? "active" : ""}
                    onClick={() => { setCurrentPage(i + 1); window.scrollTo(0, 0); }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0, 0); }}
                >
                  SUIV.
                </button>
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="no-results">
                <p>Aucun produit ne correspond à vos critères.</p>
                <button onClick={() => {setSelectedCategory(null); setPriceRange(500000);}}>Réinitialiser</button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE FILTERS OVERLAY */}
      <div className={`mobile-filters ${showFilters ? "open" : ""}`}>
        <div className="mf-header">
          <h2>FILTRER</h2>
          <button onClick={() => setShowFilters(false)}><X /></button>
        </div>
        <div className="mf-body">
           {/* Same filter content as sidebar but mobile optimized */}
           <div className="filter-group">
              <h3>CATÉGORIES</h3>
              <div className="mobile-cat-grid">
                {categories.map((cat: Category) => (
                  <button 
                    key={cat.id}
                    className={selectedCategory === cat.name ? "active" : ""}
                    onClick={() => {setSelectedCategory(cat.name); setShowFilters(false);}}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
           </div>
        </div>
      </div>

      <style jsx>{`
        .shop-page { background: white; min-height: 100vh; padding-top: 10px; }
        .shop-container { max-width: 1400px; margin: 0 auto; padding: 0 20px; }
        
        .breadcrumb { font-size: 10px; letter-spacing: 0.1em; color: #999; margin-bottom: 8px; }
        .shop-header h1 { font-size: 20px; font-weight: 300; letter-spacing: 0.15em; margin-bottom: 15px; }
        
        .shop-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
          margin-bottom: 20px;
        }
        .filter-toggle {
          display: flex; align-items: center; gap: 8px;
          background: none; border: 1px solid #1A1614; padding: 8px 16px;
          font-size: 11px; font-weight: 600; cursor: pointer;
        }
        .sort-wrap select {
          border: none; background: none; font-size: 11px; font-weight: 600;
          letter-spacing: 0.05em; outline: none; cursor: pointer;
        }

        .shop-content { display: flex; gap: 30px; }
        
        .sidebar { width: 200px; flex-shrink: 0; }
        .filter-group { margin-bottom: 20px; }
        .filter-group h3 { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 20px; }
        .filter-list { display: flex; flex-direction: column; gap: 12px; }
        .filter-list button {
          text-align: left; background: none; border: none;
          font-size: 13px; color: #666; cursor: pointer; padding: 0;
          transition: color 0.3s;
        }
        .filter-list button span { color: #ccc; font-size: 11px; }
        .filter-list button.active { color: #1A1614; font-weight: 700; }
        
        .price-slider input { width: 100%; accent-color: #1A1614; margin-bottom: 12px; }
        .price-labels { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; }

        .main-grid { flex: 1; }
        .results-count { font-size: 10px; color: #999; margin-bottom: 24px; letter-spacing: 0.05em; }
        
        .product-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px 24px;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 60px;
          padding-top: 40px;
          border-top: 1px solid #eee;
        }
        .pagination button {
          min-width: 40px;
          height: 40px;
          background: none;
          border: 1px solid #eee;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .pagination button:hover:not(:disabled) { border-color: #1A1614; }
        .pagination button.active { background: #1A1614; color: white; border-color: #1A1614; }
        .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }

        .no-results { text-align: center; padding: 100px 0; }
        .no-results button { 
          margin-top: 20px; background: #1A1614; color: white; border: none; 
          padding: 10px 24px; font-size: 11px; cursor: pointer;
        }

        /* MOBILE FILTERS */
        .mobile-filters {
          position: fixed; inset: 0; background: white; z-index: 1000;
          transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; flex-direction: column;
        }
        .mobile-filters.open { transform: translateY(0); }
        .mf-header {
          padding: 20px; border-bottom: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
        }
        .mf-body { padding: 20px; flex: 1; overflow-y: auto; }
        .mobile-cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .mobile-cat-grid button {
          padding: 12px; border: 1px solid #eee; background: none;
          font-size: 11px; font-weight: 600; border-radius: 4px;
        }
        .mobile-cat-grid button.active { background: #1A1614; color: white; border-color: #1A1614; }

        @media (max-width: 1024px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); }
          .sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
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
        .p-card { text-decoration: none; color: inherit; }
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
        .p-badge {
          position: absolute;
          top: 8px; right: 8px;
          background: #C23616;
          color: white;
          padding: 3px 7px;
          font-size: 9px;
          font-weight: 700;
        }
        .p-info h3 {
          font-size: 12px;
          font-weight: 400;
          color: #555;
          margin-bottom: 4px;
        }
        .p-price-row { display: flex; align-items: center; gap: 8px; }
        .p-price { font-size: 13px; font-weight: 700; color: #1A1614; }
        .p-old-price { font-size: 11px; color: #aaa; text-decoration: line-through; }
      `}</style>
    </Link>
  );
}

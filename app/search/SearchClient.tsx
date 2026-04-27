"use client";

import React from "react";
import { formatPrice } from "@/lib/constants";
import Link from "next/link";

interface SearchClientProps {
  query: string;
  products: any[];
}

export default function SearchClient({ query, products }: SearchClientProps) {
  return (
    <div className="search-page">
      <div className="search-header">
        <span className="eyebrow">Résultats pour</span>
        <h1>"{query}"</h1>
        <p>
          {products.length} article{products.length > 1 ? "s" : ""} trouvé{products.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="product-grid">
        {products.map((p) => (
          <Link
            href={`/product/${p.id}`}
            key={p.id}
            className="product-card"
          >
            <div className="card-img">
              {p.images?.[0] ? (
                <img src={p.images[0].url} alt={p.name} loading="lazy" />
              ) : (
                <div className="placeholder">Z</div>
              )}
            </div>
            <div className="card-info">
              <h3>{p.name}</h3>
              <span className="price">
                {formatPrice(Number(p.price))}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="no-results">
          <p>
            Désolé, nous n'avons trouvé aucun article correspondant à votre
            recherche.
          </p>
          <Link href="/" className="back-btn">
            RETOURNER À LA BOUTIQUE
          </Link>
        </div>
      )}

      <style jsx>{`
        .search-page {
          max-width: 1440px;
          margin: 0 auto;
          padding: 60px 40px 100px;
        }
        .search-header {
          text-align: center;
          margin-bottom: 80px;
        }
        .eyebrow {
          font-size: 11px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: #bbb;
          display: block;
          margin-bottom: 12px;
        }
        .search-header h1 {
          font-size: 32px;
          font-weight: 300;
          letter-spacing: 0.1em;
          color: #1a1614;
          margin-bottom: 16px;
        }
        .search-header p {
          font-size: 14px;
          color: #999;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px 24px;
        }
        .product-card {
          text-decoration: none;
          color: inherit;
        }
        .card-img {
          aspect-ratio: 3/4;
          background: #f5f3ef;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 1s ease;
        }
        .product-card:hover img {
          transform: scale(1.05);
        }
        .placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: 100;
          color: #d5d0c8;
        }
        .card-info h3 {
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.02em;
          margin-bottom: 6px;
        }
        .price {
          font-size: 14px;
          font-weight: 600;
        }

        .no-results {
          text-align: center;
          padding: 100px 0;
        }
        .no-results p {
          color: #888;
          margin-bottom: 30px;
        }
        .back-btn {
          display: inline-block;
          padding: 16px 40px;
          background: #1a1614;
          color: white;
          text-decoration: none;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
        }

        @media (max-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: 1fr 1fr;
            gap: 24px 12px;
          }
          .search-page {
            padding: 40px 20px;
          }
          .search-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}

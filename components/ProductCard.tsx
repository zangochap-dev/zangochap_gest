"use client";

import React from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { getImageUrl } from "@/lib/utils";

interface ProductCardProps {
  product: any;
  onAdd: (product: any) => void;
  onPreview: (image: string) => void;
}

export default function ProductCard({ product: p, onAdd, onPreview }: ProductCardProps) {
  const realStock = p.variants?.length > 0
    ? p.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0)
    : p.stock;
  
  const isOos = realStock === 0;
  const isLow = realStock > 0 && realStock <= (p.lowStockThreshold || 5);
  const hasVariants = p.variants?.length > 0;
  const image = getImageUrl(p.images?.[0]?.dataUrl || p.images?.[0]?.url);

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1.5px solid var(--line)',
        background: 'white',
        cursor: 'default',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.2s',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        opacity: isOos ? 0.6 : 1
      }}
    >
      <div 
        style={{ 
          height: 140, 
          background: 'var(--cream-2)', 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'zoom-in', 
          overflow: 'hidden' 
        }}
        onClick={() => {
          if (image) onPreview(image);
        }}
      >
        {image ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image 
              src={image} 
              alt={p.name}
              fill
              sizes="(max-width: 768px) 50vw, 200px"
              style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
              className="hover:scale-105"
            />
          </div>
        ) : (
          <div style={{ fontSize: 32 }}>{p.emoji || '📦'}</div>
        )}
        
        <div style={{ 
          position: 'absolute', 
          bottom: 8, 
          left: 8, 
          background: 'rgba(0, 0, 0, 0.6)', 
          backdropFilter: 'blur(4px)', 
          color: 'white', 
          padding: '4px 10px', 
          borderRadius: 8, 
          fontSize: 12, 
          fontWeight: 800 
        }}>
          {formatPrice(Number(p.price))}
        </div>

        {isOos && (
          <div style={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            background: 'var(--red)', 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: 6, 
            fontSize: 10, 
            fontWeight: 800, 
            textTransform: 'uppercase' 
          }}>
            Rupture
          </div>
        )}
      </div>

      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ 
          fontSize: 13, 
          fontWeight: 700, 
          color: 'var(--ink)', 
          marginBottom: 4, 
          lineHeight: 1.2 
        }}>
          {p.name}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          <div style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            background: isOos ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--green)' 
          }}></div>
          <div style={{ 
            fontSize: 10, 
            color: isOos ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--brown-soft)', 
            fontWeight: 700 
          }}>
            {isOos ? 'RUPTURE' : isLow ? `STOCK BAS (${realStock})` : `STOCK: ${realStock}`}
          </div>
        </div>

        <button
          className="btn-orange"
          style={{ 
            marginTop: 'auto', 
            width: '100%', 
            padding: '8px', 
            fontSize: 11, 
            borderRadius: 8, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 6, 
            height: 36 
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAdd(p);
          }}
        >
          {hasVariants ? 'Options' : 'Ajouter'}
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

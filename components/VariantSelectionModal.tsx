"use client";

import React, { useMemo } from "react";
import Modal from "@/components/Modal";
import { formatPrice } from "@/lib/constants";
import { Minus, Plus, Filter, RotateCcw, Info, Check, Maximize } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface VariantSelectionModalProps {
  product: any;
  onClose: () => void;
  onAdd: () => void;
  sizeFilter: string;
  setSizeFilter: (val: string) => void;
  colorFilter: string;
  setColorFilter: (val: string) => void;
  selectedVariant: any;
  setSelectedVariant: (v: any) => void;
  modalQty: number;
  setModalQty: (qty: number) => void;
  setPreviewImage: (img: string | null) => void;
}

export default function VariantSelectionModal({
  product, onClose, onAdd, sizeFilter, setSizeFilter, colorFilter, setColorFilter, selectedVariant, setSelectedVariant, modalQty, setModalQty, setPreviewImage
}: VariantSelectionModalProps) {
  if (!product) return null;

  const groupedVariants = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    if (product.variants) {
      product.variants.forEach((v: any) => {
        if (!grouped[v.size]) grouped[v.size] = [];
        grouped[v.size].push(v);
      });
    }
    return grouped;
  }, [product]);

  const filteredSizes = useMemo(() => {
    return Object.entries(groupedVariants)
      .filter(([size]) => sizeFilter === 'all' || size === sizeFilter);
  }, [groupedVariants, sizeFilter]);

  const resetFilters = () => {
    setSizeFilter('all');
    setColorFilter('all');
    setSelectedVariant(null);
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => { onClose(); setSelectedVariant(null); setModalQty(1); }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="pos-modal-icon" style={{ background: 'var(--cream-2)', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden', border: '1px solid var(--line)', cursor: 'zoom-in' }} onClick={() => {
            const img = product.images?.[0]?.dataUrl || product.images?.[0]?.url;
            if (img) setPreviewImage(getImageUrl(img));
          }}>
            {product.images?.[0]?.dataUrl || product.images?.[0]?.url ? (
              <img src={getImageUrl(product.images?.[0]?.dataUrl || product.images?.[0]?.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              product.emoji || '📦'
            )}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{product.name}</div>
            <div style={{ fontSize: 12, color: 'var(--brown-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatPrice(product.price)}</span>
              <span>•</span>
              <span>Stock: {product.stock}</span>
            </div>
          </div>
        </div>
      }
      footer={
        <div style={{ display: 'flex', width: '100%', gap: 16, alignItems: 'center' }}>
          <div className="pos-qty-control large" style={{ background: 'var(--cream-2)', borderRadius: 12, padding: '4px 8px' }}>
            <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="qty-btn"><Minus size={18} /></button>
            <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 800, fontSize: 16 }}>{modalQty}</span>
            <button onClick={() => setModalQty(modalQty + 1)} className="qty-btn" disabled={!selectedVariant}><Plus size={18} /></button>
          </div>
          <button
            className="pos-checkout-btn"
            style={{ flex: 1, margin: 0, height: 50, borderRadius: 14, fontSize: 15 }}
            disabled={!selectedVariant}
            onClick={onAdd}
          >
            <Plus size={20} /> Ajouter au panier
          </button>
        </div>
      }
    >
      <div className="pos-modal-variants-layout">
        <div className="pos-modal-filters-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brown-soft)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Filter size={14} /> Filtrer les options
          </div>
          <button onClick={resetFilters} className="pos-modal-reset-btn">
            <RotateCcw size={12} /> Réinitialiser
          </button>
        </div>

        <div className="pos-modal-filters">
          <div className="form-row">
            <label className="field-label-sm">Taille</label>
            <select
              className="field-input-sm"
              value={sizeFilter}
              onChange={e => {
                const val = e.target.value;
                setSizeFilter(val);
                const match = product.variants?.find((v: any) => v.size === val && (colorFilter === 'all' || v.color === colorFilter));
                if (match) setSelectedVariant(match);
              }}
            >
              <option value="all">Toutes les tailles</option>
              {Object.keys(groupedVariants).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label className="field-label-sm">Couleur</label>
            <select
              className="field-input-sm"
              value={colorFilter}
              onChange={e => {
                const val = e.target.value;
                setColorFilter(val);
                const match = product.variants?.find((v: any) => (sizeFilter === 'all' || v.size === sizeFilter) && v.color === val);
                if (match) setSelectedVariant(match);
              }}
            >
              <option value="all">Toutes les couleurs</option>
              {Array.from(new Set(product.variants?.map((v: any) => v.color) || [])).map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pos-variant-grid-container" style={{ marginTop: 24 }}>
          {filteredSizes.length > 0 ? (
            filteredSizes.map(([size, variants]) => {
              const displayVariants = variants.filter((v: any) => colorFilter === 'all' || v.color === colorFilter);
              if (displayVariants.length === 0) return null;

              return (
                <div key={size} className="pos-variant-section">
                  <div className="pos-variant-section-title">
                    <span>Taille {size}</span>
                    <div className="title-line"></div>
                  </div>
                  <div className="pos-variant-options-grid">
                    {displayVariants.map((v: any) => {
                      const isActive = selectedVariant?.id === v.id;
                      const isOos = v.stock <= 0;
                      const isLow = v.stock > 0 && v.stock <= 3;

                      return (
                        <button
                          key={v.id}
                          className={`pos-variant-card-mini ${isActive ? 'active' : ''} ${isOos ? 'oos' : ''}`}
                          onClick={() => {
                            setSelectedVariant(v);
                            setModalQty(Math.max(1, modalQty));
                          }}
                        >
                          <div className="v-card-top">
                            <span className="v-card-color">{v.color}</span>
                            {isActive && <Check size={12} className="v-card-check" />}
                          </div>
                          <div className={`v-card-stock ${isOos ? 'out' : isLow ? 'low' : ''}`}>
                            {isOos ? 'Rupture - collecte' : `${v.stock} dispo.`}
                          </div>
                          {isActive && <div className="v-card-active-border"></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="pos-modal-empty">
              <Info size={32} />
              <p>Aucune variante correspondante</p>
              <button onClick={resetFilters} className="btn-link">Effacer les filtres</button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

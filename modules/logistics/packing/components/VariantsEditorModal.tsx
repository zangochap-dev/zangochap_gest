"use client";

import React, { useState } from "react";
import Modal from "@/components/Modal";
import { PackingProductVariant, ProductWithVariants } from "../types";
import { getProductVariantsById, updateProductVariantStockLevels } from "@/modules/products/actions/actions";
import { AlertTriangle, MapPin, Minus, Plus, RefreshCw, Warehouse } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

type EditableStockLevel = {
  id?: string;
  warehouseId?: string;
  warehouseName: string;
  quantity: number;
  position?: string;
};

type EditableVariant = Omit<PackingProductVariant, "stockLevels"> & {
  stockLevels: EditableStockLevel[];
};

interface VariantsEditorModalProps {
  product: ProductWithVariants;
  variants?: PackingProductVariant[];
  onClose: () => void;
  onSave?: (variants: EditableVariant[]) => void;
}

export default function VariantsEditorModal({ product, variants: initialVariants, onClose, onSave }: VariantsEditorModalProps) {
  const hasInitialVariants = (initialVariants?.length || 0) > 0;

  const normalizeVariant = React.useCallback((variant: PackingProductVariant): EditableVariant => {
    const stockLevels = variant.stockLevels?.length
      ? variant.stockLevels.map((level) => ({
        id: level.id,
        warehouseId: level.warehouseId,
        warehouseName: level.warehouse?.name || "Entrepot",
        quantity: Math.max(0, Number(level.quantity) || 0),
        position: level.position || "",
      }))
      : [{
        warehouseId: undefined,
        warehouseName: "Magasin Principal",
        quantity: Math.max(0, Number(variant.stock) || 0),
        position: variant.location || "",
      }];

    return {
      ...variant,
      stock: stockLevels.reduce((sum, level) => sum + level.quantity, 0),
      location: stockLevels.find((level) => level.position)?.position || variant.location || "",
      stockLevels,
    };
  }, []);

  const [variants, setVariants] = useState<EditableVariant[]>(() => (initialVariants || []).map(normalizeVariant));
  const [lowStockThreshold, setLowStockThreshold] = useState(product.lowStockThreshold || 5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    getProductVariantsById(product.id)
      .then((fetchedVariants) => {
        if (!active) return;
        setVariants(fetchedVariants.map((variant: PackingProductVariant) => normalizeVariant(variant)));
      })
      .catch(() => {
        if (!active) return;
        setError(hasInitialVariants ? null : "Impossible de charger les stocks en direct.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasInitialVariants, normalizeVariant, product.id]);

  const updateStockLevel = (
    variantIndex: number,
    stockLevelIndex: number,
    field: "quantity" | "position",
    value: string | number,
  ) => {
    setVariants((current) => current.map((variant, currentVariantIndex) => {
      if (currentVariantIndex !== variantIndex) return variant;

      const stockLevels = variant.stockLevels.map((level, currentLevelIndex) => {
        if (currentLevelIndex !== stockLevelIndex) return level;
        return {
          ...level,
          [field]: field === "quantity" ? Math.max(0, parseInt(String(value), 10) || 0) : String(value),
        };
      });

      return {
        ...variant,
        stockLevels,
        stock: stockLevels.reduce((sum, level) => sum + level.quantity, 0),
        location: stockLevels.find((level) => level.position)?.position || "",
      };
    }));
  };

  const totalQty = variants.reduce(
    (sum, variant) => sum + variant.stockLevels.reduce((levelSum, level) => levelSum + level.quantity, 0),
    0,
  );

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await updateProductVariantStockLevels(product.id, {
        lowStockThreshold,
        variants: variants.map((variant) => ({
          id: variant.id,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          location: variant.location || undefined,
          stockLevels: variant.stockLevels.map((level) => ({
            id: level.id,
            warehouseId: level.warehouseId,
            warehouseName: level.warehouseName,
            quantity: level.quantity,
            position: level.position || undefined,
          })),
        })),
      });

      if (onSave) onSave(variants);
      else onClose();
    } catch {
      setError("Erreur lors de l'enregistrement des stocks.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RefreshCw size={18} className="text-orange" />
          <span>Gestion du Stock</span>
        </div>
      }
      large
      footer={
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={isLoading || isSaving}>
            Annuler
          </button>
          <button
            className="btn-orange"
            onClick={handleSave}
            disabled={isLoading || isSaving}
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
          >
            {isSaving && <span className="animate-spin" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }} />}
            <span className="stock-save-label-full">{isSaving ? "Sauvegarde..." : "Enregistrer les modifications"}</span>
            <span className="stock-save-label-short">{isSaving ? "..." : "Enregistrer"}</span>
          </button>
        </div>
      }
    >
      <div className="variants-editor-header">
        <div className="editor-product-info">
          {product.images?.[0] ? (
            <img src={getImageUrl(product.images[0].url)} className="editor-thumb" alt={product.name} />
          ) : (
            <div className="editor-thumb-placeholder">PKG</div>
          )}
          <div>
            <h3>{product.name}</h3>
            <p>
              Stock total : <span className={totalQty === 0 ? "text-red" : "text-green"}>{totalQty} unités</span>
            </p>
          </div>
        </div>
        <div className="threshold-config">
          <label>Seuil d&apos;alerte</label>
          <div className="threshold-input-wrapper">
            <input
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(event) => setLowStockThreshold(Math.max(0, parseInt(event.target.value, 10) || 0))}
            />
            <AlertTriangle size={14} className="threshold-icon" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--brown-soft)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span className="animate-spin" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid var(--orange)", borderTopColor: "transparent", borderRadius: "50%" }} />
          Chargement des stocks en direct...
        </div>
      ) : error ? (
        <div style={{ padding: "18px 20px", background: "#FEE2E2", color: "#B91C1C", borderRadius: 12, fontWeight: 700, fontSize: 13 }}>
          {error}
        </div>
      ) : (
        <div className="variants-editor-grid">
          {variants.map((variant, variantIndex) => (
            <div key={variant.id || `${variant.size}-${variant.color}-${variantIndex}`} className="variant-edit-card">
              <div className="v-card-header">
                <span className="v-card-tag">{variant.size}</span>
                <span className="v-card-color-name">{variant.color}</span>
                <span className="variant-total-pill">
                  {variant.stockLevels.reduce((sum, level) => sum + level.quantity, 0)} u.
                </span>
              </div>

              <div className="v-card-controls">
                {variant.stockLevels.map((level, stockLevelIndex) => (
                  <div
                    key={level.id || `${level.warehouseName}-${stockLevelIndex}`}
                    className="stock-level-editor"
                    data-first={stockLevelIndex === 0 ? "true" : "false"}
                  >
                    <div className="stock-level-warehouse">
                      <Warehouse size={14} className="text-orange" />
                      <span>{level.warehouseName}</span>
                    </div>

                    <div className="control-group">
                      <label>Quantité en stock</label>
                      <div className="qty-stepper">
                        <button onClick={() => updateStockLevel(variantIndex, stockLevelIndex, "quantity", level.quantity - 1)}><Minus size={14} /></button>
                        <input
                          type="number"
                          min={0}
                          value={level.quantity}
                          onChange={(event) => updateStockLevel(variantIndex, stockLevelIndex, "quantity", event.target.value)}
                        />
                        <button onClick={() => updateStockLevel(variantIndex, stockLevelIndex, "quantity", level.quantity + 1)}><Plus size={14} /></button>
                      </div>
                    </div>

                    <div className="control-group">
                      <label>Emplacement (Rayon/Casier)</label>
                      <div className="location-input-wrapper">
                        <MapPin size={14} className="loc-icon" />
                        <input
                          type="text"
                          value={level.position || ""}
                          onChange={(event) => updateStockLevel(variantIndex, stockLevelIndex, "position", event.target.value)}
                          placeholder="Ex: A1-02"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

"use client";

import React, { useTransition, useEffect, useState } from "react";
import { TableCard, EmptyState, LocationBadge } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { markCollection } from "@/modules/logistics/actions";
import { updateProductVariants } from "@/modules/products/actions";
import { useRouter } from "next/navigation";
import { Check, X, ArrowLeftRight, Package, Warehouse } from "lucide-react";
import Modal from "@/components/Modal";

export default function CollectionClient({ toCollect, user }: { toCollect: any[]; user: any }) {
  const [isPending, startTransition] = useTransition();
  const [editingVariants, setEditingVariants] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  // Auto-refresh every 15s for collection queue (real-time critical)
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(interval);
  }, [router]);

  const handleMark = (orderId: string, productId: string, status: string, orderItemId?: string) => {
    startTransition(async () => {
      try {
        await markCollection(orderId, productId, status, orderItemId);
        const labels: Record<string, string> = {
          collected: 'Marqué collecté ✓',
          unavailable: 'Marqué indisponible',
          alternative: 'Alternative notée',
        };
        showToast(labels[status] || 'Fait', 'success');
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  const openVariantsEditor = (product: any) => {
    setEditingVariants({
      product,
      variants: JSON.parse(JSON.stringify(product.variants || [])),
    });
  };

  return (
    <div className="content animate-fade-in">
      <TableCard title={`${toCollect.length} produit(s) à collecter`} meta="Groupés par fournisseur">
        {toCollect.length === 0 ? (
          <EmptyState icon="✓" title="Tout est en stock" description="Aucune collecte nécessaire." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Produit</th>
                <th>Variation demandée</th>
                <th>Qté</th>
                <th>Fournisseur</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {toCollect.map(({ order, item, product }, i) => (
                <tr key={i}>
                  <td>
                    <span className="cell-mono" style={{ fontWeight: 800 }}>{order.ref}</span>
                    <div className="cell-muted">{order.customerName}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        onClick={() => setPreviewImage(item.image || product.images?.[0]?.url)}
                        style={{ width: 48, height: 48, background: 'var(--cream-2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, overflow: 'hidden', border: '1px solid var(--line)', cursor: 'zoom-in', transition: 'transform 0.2s' }}
                        className="hover-scale"
                      >
                        {item.image || product.images?.[0]?.url ? (
                          <img src={item.image || product.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          item.emoji || '📦'
                        )}
                      </div>
                      <div>
                        <span className="cell-strong" style={{ fontSize: 13 }}>{item.name}</span>
                        <div style={{ fontSize: 10, color: 'var(--brown-soft)', marginTop: 2 }}>{product.category?.name || 'Article'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="size-dot">{item.size}</span>
                      <strong style={{ fontSize: 12, color: 'var(--brown)' }}>{item.color}</strong>
                    </div>
                  </td>
                  <td><strong style={{ fontSize: 14 }}>{item.qty}</strong></td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{product.supplier?.name || product.supplier}</div>
                    <div className="cell-muted" style={{ fontSize: 11 }}>{product.origin || '—'}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {product.variants.find((v: any) => v.size === item.size && v.color === item.color)?.stockLevels?.map((sl: any) => (
                        <div key={sl.id} style={{ fontSize: 10, color: 'var(--brown-soft)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--cream-2)', padding: '2px 6px', borderRadius: 4 }}>
                          <Warehouse size={10} className="text-orange" />
                          <span>{sl.warehouse.name}</span>
                          {sl.position && <span style={{ fontWeight: 800, color: 'var(--ink)' }}>• {sl.position}</span>}
                        </div>
                      ))}
                      {!product.variants.find((v: any) => v.size === item.size && v.color === item.color) && (
                        <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>Variante non trouvée</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="action-btn"
                        title="Marqué collecté"
                        disabled={isPending}
                        onClick={() => handleMark(order.id, product.id, 'collected', item.id)}
                        style={{ background: 'var(--green-soft)', color: 'var(--green)' }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="action-btn"
                        title="Indisponible"
                        disabled={isPending}
                        onClick={() => handleMark(order.id, product.id, 'unavailable', item.id)}
                        style={{ background: 'var(--red-soft)', color: 'var(--red)' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      {/* LIGHTBOX / IMAGE PREVIEW */}
      {previewImage && (
        <Modal isOpen={true} onClose={() => setPreviewImage(null)} title="Aperçu du produit">
          <div style={{ textAlign: 'center', background: 'var(--cream)', borderRadius: 12, overflow: 'hidden' }}>
            <img src={previewImage} style={{ maxWidth: '100%', maxHeight: '75vh', display: 'block', margin: '0 auto', boxShadow: 'var(--shadow-lg)' }} />
          </div>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button className="btn-secondary" onClick={() => setPreviewImage(null)}>Fermer l'aperçu</button>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .hover-scale:hover { transform: scale(1.05); }
      `}</style>

      {/* VARIANTS EDITOR MODAL */}
      {editingVariants && (
        <VariantsEditorModal
          product={editingVariants.product}
          variants={editingVariants.variants}
          onClose={() => setEditingVariants(null)}
          onSave={(vars) => {
            startTransition(async () => {
              try {
                await updateProductVariants(editingVariants.product.id, vars);
                showToast('Variantes mises à jour ✓', 'success');
                router.refresh();
                setEditingVariants(null);
              } catch (e: any) {
                showToast('Erreur lors de la mise à jour', 'error');
              }
            });
          }}
        />
      )}
    </div>
  );
}

function VariantsEditorModal({ product, variants: initialVariants, onClose, onSave }: { product: any; variants: any[]; onClose: () => void; onSave: (v: any[]) => void }) {
  const [variants, setVariants] = React.useState(initialVariants);

  const updateVariant = (idx: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[idx] = { ...newVariants[idx], [field]: field === 'stock' ? Math.max(0, parseInt(value) || 0) : value };
    setVariants(newVariants);
  };

  const totalQty = variants.reduce((s: number, v: any) => s + (parseInt(v.stock) || 0), 0);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Stock · ${product.name}`} large
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-orange" onClick={() => onSave(variants)}>Enregistrer</button>
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{product.name}</div>
          <div className="cell-muted" style={{ marginTop: 2 }}>
            Stock total : <strong style={{ color: totalQty === 0 ? 'var(--red)' : 'var(--green)' }}>{totalQty}</strong> unité(s)
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Taille</th><th>Couleur</th><th>Quantité</th><th>Emplacement</th></tr>
          </thead>
          <tbody>
            {variants.map((v: any, idx: number) => (
              <tr key={idx}>
                <td><span className="size-dot">{v.size}</span></td>
                <td><strong>{v.color}</strong></td>
                <td>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button onClick={() => updateVariant(idx, 'stock', v.stock - 1)} style={{ width: 24, height: 24, background: 'var(--cream-2)', borderRadius: 4, fontWeight: 700 }}>−</button>
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={e => updateVariant(idx, 'stock', e.target.value)}
                      style={{ width: 60, padding: '5px', border: '1px solid var(--line)', borderRadius: 5, fontSize: 13, fontWeight: 600, textAlign: 'center' }}
                    />
                    <button onClick={() => updateVariant(idx, 'stock', v.stock + 1)} style={{ width: 24, height: 24, background: 'var(--cream-2)', borderRadius: 4, fontWeight: 700 }}>+</button>
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    value={v.location || ''}
                    onChange={e => updateVariant(idx, 'location', e.target.value)}
                    placeholder="Ex. A1-03"
                    style={{ width: 120, padding: '5px 8px', border: '1px solid var(--line)', borderRadius: 5, fontSize: 12, fontFamily: 'var(--font-mono)' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

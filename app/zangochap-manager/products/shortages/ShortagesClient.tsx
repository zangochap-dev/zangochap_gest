"use client";

import React, { useTransition } from "react";
import { TableCard, EmptyState } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { markProductSent } from "@/modules/products/actions";
import { useRouter } from "next/navigation";
import { ArrowRight, Image as ImageIcon } from "lucide-react";

export default function ShortagesClient({ oosData }: { oosData: Array<{ product: any; waitingOrders: any[] }> }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const handleMarkSent = (productId: string) => {
    startTransition(async () => {
      try {
        await markProductSent(productId);
        showToast('Produit marqué envoyé ✓', 'success');
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  return (
    <div className="content animate-fade-in">
      <TableCard title={`${oosData.length} produit(s) en rupture`} meta="Triés par demande">
        {oosData.length === 0 ? (
          <EmptyState icon="✓" title="Aucune rupture" description="Tout le catalogue est disponible." />
        ) : (
          <table>
            <thead>
              <tr><th>Produit</th><th>Commandes en attente</th><th>Fournisseur</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {oosData.map(({ product, waitingOrders }) => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {product.images?.[0] ? (
                        <img src={product.images[0].dataUrl} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--line)' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                      )}
                      <div>
                        <div className="cell-strong">{product.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <div className="cell-muted" style={{ fontSize: 11 }}>{product.material || '—'}</div>
                          {product.location && (
                            <div style={{ background: 'var(--cream-2)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, color: 'var(--brown-soft)' }}>
                              📍 {product.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {waitingOrders.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 340 }}>
                        {waitingOrders.map((c, i) => (
                          <div key={i} style={{ background: 'var(--cream)', borderRadius: 6, padding: '5px 8px', fontSize: 11 }}>
                            <span className="cell-mono" style={{ color: 'var(--orange)', fontWeight: 700 }}>{c.ref}</span>
                            <span style={{ marginLeft: 6 }}>par <strong>{c.commercial}</strong></span>
                            <span style={{ marginLeft: 6, color: 'var(--brown-soft)' }}>· {c.size} / {c.color} × {c.qty}</span>
                          </div>
                        ))}
                      </div>
                    ) : <span className="cell-muted">—</span>}
                  </td>
                  <td>{product.supplier}</td>
                  <td>
                    {product.sentToSupplierAt ? (
                      <span className="status sent">Envoyé</span>
                    ) : (
                      <span className="status unavailable">À commander</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="action-btn"
                        title="Marquer envoyé"
                        disabled={isPending}
                        onClick={() => handleMarkSent(product.id)}
                        style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}
                      >
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}

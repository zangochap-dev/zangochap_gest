"use client";

import React, { useTransition, useEffect, useState } from "react";
import { TableCard, EmptyState, LocationBadge } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { markCollection } from "@/modules/logistics/actions";
import { updateProductVariants } from "@/modules/products/actions";
import { useRouter } from "next/navigation";
import { Check, X, ArrowLeftRight, Package, Warehouse } from "lucide-react";
import Modal from "@/components/Modal";

export default function CollectionClient({ toCollect, user, categories = [], warehouses = [] }: { toCollect: any[]; user: any; categories?: any[]; warehouses?: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingVariants, setEditingVariants] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filters State
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [warehouseId, setWarehouseId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { showToast } = useToast();
  const router = useRouter();

  // Auto-refresh every 15s for collection queue
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30000); // 30s is enough with manual refresh
    return () => clearInterval(interval);
  }, [router]);

  const handleMark = (orderId: string, productId: string, status: string, orderItemId?: string, note?: string) => {
    startTransition(async () => {
      try {
        await markCollection(orderId, productId, status, orderItemId, note);
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

  // Date Presets
  const setDatePreset = (preset: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const d = yesterday.toISOString().split('T')[0];
      setDateFrom(d);
      setDateTo(d);
    } else if (preset === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      setDateFrom(weekAgo.toISOString().split('T')[0]);
      setDateTo(today);
    } else {
      setDateFrom('');
      setDateTo('');
    }
  };

  const processedData = React.useMemo(() => {
    const counts = { all: 0, collected: 0, unavailable: 0, alternative: 0 };

    const filtered = toCollect.filter(tc => {
      const h = Array.isArray(tc.order.history) ? tc.order.history : [];

      // Find the latest collection-related log for this specific item
      // We look for logs containing the item name and any of our keywords
      const relevantLogs = h
        .filter((log: any) => {
          const action = log.action.toLowerCase();
          return (action.includes('collecté') || action.includes('indisponible') || action.includes('alternative')) &&
            action.includes(tc.item.name.toLowerCase());
        })
        .sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime());

      const latestLog = relevantLogs[0];
      const latestAction = latestLog?.action.toLowerCase() || '';

      const hasCollected = latestAction.includes('collecté') && !latestAction.includes('alternative');
      const hasUnavailable = latestAction.includes('indisponible');
      const hasAlternative = latestAction.includes('alternative');

      // 1. Stock Check
      const variant = tc.product.variants.find((v: any) => v.size === tc.item.size && v.color === tc.item.color);
      const isOutOfStock = variant ? variant.stock <= 0 : tc.product.stock <= 0;

      const isProcessed = !!latestLog;
      if (!isProcessed && !isOutOfStock) return false;

      // 2. Base Counts (before status filter)
      if (!isProcessed) counts.all++;
      else {
        if (hasCollected) counts.collected++;
        if (hasUnavailable) counts.unavailable++;
        if (hasAlternative) counts.alternative++;
      }

      // 3. Status Filter
      if (filter === 'all') {
        if (isProcessed) return false;
      } else {
        if (filter === 'collected' && !hasCollected) return false;
        if (filter === 'unavailable' && !hasUnavailable) return false;
        if (filter === 'alternative' && !hasAlternative) return false;
      }

      // 4. Category Filter
      if (categoryId !== 'all' && tc.product.categoryId !== categoryId) return false;

      // 5. Warehouse Filter
      if (warehouseId !== 'all') {
        const hasInWarehouse = tc.product.variants.some((v: any) =>
          v.size === tc.item.size && v.color === tc.item.color &&
          v.stockLevels?.some((sl: any) => sl.warehouseId === warehouseId)
        );
        if (!hasInWarehouse) return false;
      }

      // 6. Search Filter
      if (search) {
        const s = search.toLowerCase();
        const matches = tc.order.ref.toLowerCase().includes(s) ||
          tc.item.name.toLowerCase().includes(s) ||
          tc.order.customerName.toLowerCase().includes(s);
        if (!matches) return false;
      }

      // 7. Date Filter
      if (dateFrom || dateTo) {
        const orderDate = new Date(tc.order.createdAt);
        if (dateFrom && orderDate < new Date(dateFrom + 'T00:00:00')) return false;
        if (dateTo && orderDate > new Date(dateTo + 'T23:59:59.999')) return false;
      }

      return true;
    });

    return { filtered, counts };
  }, [toCollect, filter, search, categoryId, warehouseId, dateFrom, dateTo]);

  const { filtered: filteredToCollect, counts } = processedData;

  const stats = React.useMemo(() => {
    return {
      total: toCollect.length,
      filtered: filteredToCollect.length
    };
  }, [toCollect, filteredToCollect]);

  return (
    <div className="content animate-fade-in">
      {/* SUMMARY STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--orange-soft)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--brown-soft)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Articles en cours</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.filtered} <span style={{ fontSize: 14, color: 'var(--brown-soft)', fontWeight: 400 }}>/ {stats.total}</span></div>
          </div>
        </div>
      </div>

      {/* COMMAND CENTER (FILTERS) */}
      <div className="command-center" style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid var(--line)',
        marginBottom: 24,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {/* ROW 1: STATUS & SEARCH */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--cream)', padding: 4, borderRadius: 10, border: '1px solid var(--line)' }}>
            {[
              { id: 'all', label: 'À collecter', color: 'var(--orange)' },
              { id: 'collected', label: 'Collectés', color: 'var(--green)' },
              { id: 'unavailable', label: 'Indispos', color: 'var(--red)' },
              { id: 'alternative', label: 'Alts', color: 'var(--blue)' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`shortcut-btn ${filter === t.id ? 'active' : ''}`}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: 11,
                  color: filter === t.id ? t.color : 'var(--brown-soft)',
                  background: filter === t.id ? 'white' : 'transparent'
                }}
              >
                {t.label} <span style={{ opacity: 0.6, marginLeft: 2 }}>({counts[t.id as keyof typeof counts]})</span>
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input
              type="text"
              className="field-input"
              placeholder="Rechercher réf, produit, client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ 
                paddingLeft: 36, 
                height: 38, 
                borderRadius: 10, 
                fontSize: 13, 
                border: '1px solid var(--line)',
                background: 'var(--cream-soft)'
              }}
            />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
              <Package size={14} />
            </div>
            {search && (
              <button 
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', opacity: 0.5 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: ADVANCED FILTERS & DATES */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--cream-2)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="filter-select"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              style={{ minWidth: 140, height: 34, fontSize: 12 }}
            >
              <option value="all">📁 Catégories</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select
              className="filter-select"
              value={warehouseId}
              onChange={e => setWarehouseId(e.target.value)}
              style={{ minWidth: 140, height: 34, fontSize: 12 }}
            >
              <option value="all">🏢 Entrepôts</option>
              {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--cream)', padding: 2, borderRadius: 8, border: '1px solid var(--line)' }}>
              <button className="shortcut-btn" onClick={() => setDatePreset('all')} style={{ padding: '4px 8px', fontSize: 10 }}>Tout</button>
              <button className="shortcut-btn" onClick={() => setDatePreset('today')} style={{ padding: '4px 8px', fontSize: 10 }}>Aujourd'hui</button>
              <button className="shortcut-btn" onClick={() => setDatePreset('week')} style={{ padding: '4px 8px', fontSize: 10 }}>7j</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="date" className="filter-date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: 34, fontSize: 11 }} />
              <span style={{ opacity: 0.3, fontSize: 10 }}>→</span>
              <input type="date" className="filter-date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ height: 34, fontSize: 11 }} />
            </div>
            {(search || categoryId !== 'all' || warehouseId !== 'all' || dateFrom || dateTo || filter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setCategoryId('all'); setWarehouseId('all'); setDateFrom(''); setDateTo(''); setFilter('all'); }}
                style={{ background: 'var(--red-soft)', color: 'var(--red)', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <TableCard title={`${filteredToCollect.length} produit(s)`} meta="Liste détaillée">
        {filteredToCollect.length === 0 ? (
          <EmptyState icon="🔍" title="Aucun résultat" description="Essayez de modifier vos filtres." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Produit</th>
                <th>Variation</th>
                <th>Qté</th>
                <th>Emplacement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredToCollect.map((tc, i) => (
                <CollectionRow
                  key={i}
                  {...tc}
                  isPending={isPending}
                  onMark={handleMark}
                  onPreview={setPreviewImage}
                />
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      {/* IMMERSIVE LIGHTBOX */}
      {previewImage && (
        <div
          className="lightbox-overlay"
          onClick={() => setPreviewImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', cursor: 'zoom-out' }}
        >
          <div className="lightbox-content animate-zoom-in" onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={previewImage}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            />
            <button
              className="lightbox-close"
              onClick={() => setPreviewImage(null)}
              style={{ position: 'absolute', top: -40, right: 0, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          </div>
        </div>
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

function CollectionRow({ order, item, product, isPending, onMark, onPreview, compact = false }: any) {
  return (
    <tr>
      <td style={compact ? { width: 140 } : undefined}>
        <div className="cell-mono" style={{ fontWeight: 800 }}>{order.ref}</div>
        {!compact && (
          <>
            <div className="cell-muted" style={{ fontSize: 11 }}>{order.customerName}</div>
            <div style={{ fontSize: 10, color: 'var(--orange)', fontWeight: 700, marginTop: 2 }}><span style={{ color: 'var(--brown)' }}>Valider par:</span>
              {order.commercialName || '—'}
            </div>
          </>
        )}
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            onClick={() => onPreview(item.image || product.images?.[0]?.url)}
            style={{ width: 44, height: 44, background: 'var(--cream-2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden', border: '1px solid var(--line)', cursor: 'zoom-in' }}
          >
            {item.image || product.images?.[0]?.url ? (
              <img src={item.image || product.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              item.emoji || '📦'
            )}
          </div>
          <div>
            <span className="cell-strong" style={{ fontSize: 13 }}>{item.name}</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <div style={{ fontSize: 10, color: 'var(--brown-soft)' }}>{product.category?.name || 'Article'}</div>
              {(() => {
                const h = Array.isArray(order.history) ? order.history : [];
                const relevant = h
                  .filter((log: any) => {
                    const a = log.action.toLowerCase();
                    return (a.includes('collecté') || a.includes('indisponible') || a.includes('alternative')) &&
                      a.includes(item.name.toLowerCase());
                  })
                  .sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime());

                const latest = relevant[0]?.action || '';
                const latestLower = latest.toLowerCase();
                if (latestLower.includes('collecté') && !latestLower.includes('alternative')) return <span className="status collected" style={{ fontSize: 9, padding: '1px 4px' }}>✓ Collecté</span>;
                if (latestLower.includes('indisponible')) return <span className="status unavailable" style={{ fontSize: 9, padding: '1px 4px' }}>✕ Indisponible</span>;
                if (latestLower.includes('alternative')) {
                  const altMatch = latest.match(/\(([^)]+)\)/);
                  const altText = altMatch ? altMatch[1] : 'Alternative';
                  return <span className="status alternative" style={{ fontSize: 9, padding: '1px 4px' }} title={altText}>⌥ {altText}</span>;
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="size-dot">{item.size}</span>
          <strong style={{ fontSize: 12, color: 'var(--brown)' }}>{item.color}</strong>
        </div>
      </td>
      <td><strong style={{ fontSize: 14 }}>x{item.qty}</strong></td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {product.variants.find((v: any) => v.size === item.size && v.color === item.color)?.stockLevels?.map((sl: any) => (
            <div key={sl.id} style={{ fontSize: 9, color: 'var(--brown-soft)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--cream-2)', padding: '2px 6px', borderRadius: 4 }}>
              <Warehouse size={10} className="text-orange" />
              <span>{sl.warehouse.name}</span>
              {sl.position && <span style={{ fontWeight: 800, color: 'var(--ink)' }}>• {sl.position}</span>}
            </div>
          ))}
          {!product.variants.find((v: any) => v.size === item.size && v.color === item.color) && (
            <div style={{ fontSize: 9, color: 'var(--red)', fontWeight: 700 }}>Variante non trouvée</div>
          )}
        </div>
      </td>
      <td style={{ width: 120 }}>
        <div className="row-actions">
          <button
            className="action-btn"
            title="Marqué collecté"
            disabled={isPending}
            onClick={() => onMark(order.id, product.id, 'collected', item.id)}
            style={{ background: 'var(--green-soft)', color: 'var(--green)', width: 36, height: 36, borderRadius: 10 }}
          >
            <Check size={16} />
          </button>
          <button
            className="action-btn"
            title="Alternative"
            disabled={isPending}
            onClick={() => {
              const note = window.prompt(`Alternative pour "${item.name}" :`, "");
              if (note) onMark(order.id, product.id, 'alternative', item.id, note);
            }}
            style={{ background: 'var(--orange-soft)', color: 'var(--orange)', width: 36, height: 36, borderRadius: 10 }}
          >
            <ArrowLeftRight size={16} />
          </button>
          <button
            className="action-btn"
            title="Indisponible"
            disabled={isPending}
            onClick={() => onMark(order.id, product.id, 'unavailable', item.id)}
            style={{ background: 'var(--red-soft)', color: 'var(--red)', width: 36, height: 36, borderRadius: 10 }}
          >
            <X size={16} />
          </button>
        </div>
      </td>
    </tr>
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

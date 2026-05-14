"use client";

import React, { useTransition, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TableCard, EmptyState, LocationBadge, DetailCard, SectionLabel } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { markCollection } from "@/modules/logistics/actions";
import { updateProductVariants } from "@/modules/products/actions";
import { useRouter } from "next/navigation";
import { Check, X, ArrowLeftRight, Package, Warehouse, Search, ChevronRight, Filter, Edit2 } from "lucide-react";
import Modal from "@/components/Modal";
import { useIsMobile } from "@/lib/hooks";
import LogisticsMobileStyles from "../_components/LogisticsMobileStyles";
import { motion, AnimatePresence } from "framer-motion";

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
  const isMobile = useIsMobile();

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30000);
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

  const setDatePreset = (preset: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (preset === 'today') { setDateFrom(today); setDateTo(today); }
    else if (preset === 'yesterday') {
      const yest = new Date(); yest.setDate(now.getDate() - 1);
      const d = yest.toISOString().split('T')[0]; setDateFrom(d); setDateTo(d);
    }
    else if (preset === 'week') {
      const week = new Date(); week.setDate(now.getDate() - 7);
      setDateFrom(week.toISOString().split('T')[0]); setDateTo(today);
    } else { setDateFrom(''); setDateTo(''); }
  };

  const processedData = React.useMemo(() => {
    const counts = { all: 0, collected: 0, unavailable: 0, alternative: 0 };
    const filtered = toCollect.filter(tc => {
      const h = Array.isArray(tc.order.history) ? tc.order.history : [];
      const relevantLogs = h.filter((log: any) => {
        const action = log.action.toLowerCase();
        return (action.includes('collecté') || action.includes('indisponible') || action.includes('alternative')) &&
          action.includes(tc.item.name.toLowerCase());
      }).sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime());

      const latestLog = relevantLogs[0];
      const latestAction = latestLog?.action.toLowerCase() || '';
      const hasCollected = latestAction.includes('collecté') && !latestAction.includes('alternative');
      const hasUnavailable = latestAction.includes('indisponible');
      const hasAlternative = latestAction.includes('alternative');

      const variant = tc.product.variants.find((v: any) => v.size === tc.item.size && v.color === tc.item.color);
      const isOutOfStock = variant ? variant.stock <= 0 : tc.product.stock <= 0;
      const isProcessed = !!latestLog;

      if (!isProcessed && !isOutOfStock) return false;
      if (!isProcessed) counts.all++;
      else {
        if (hasCollected) counts.collected++;
        if (hasUnavailable) counts.unavailable++;
        if (hasAlternative) counts.alternative++;
      }

      if (filter === 'all') { if (isProcessed) return false; }
      else {
        if (filter === 'collected' && !hasCollected) return false;
        if (filter === 'unavailable' && !hasUnavailable) return false;
        if (filter === 'alternative' && !hasAlternative) return false;
      }

      if (categoryId !== 'all' && tc.product.categoryId !== categoryId) return false;
      if (warehouseId !== 'all') {
        const hasInWarehouse = tc.product.variants.some((v: any) =>
          v.size === tc.item.size && v.color === tc.item.color &&
          v.stockLevels?.some((sl: any) => sl.warehouseId === warehouseId)
        );
        if (!hasInWarehouse) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        const matches = tc.order.ref.toLowerCase().includes(s) ||
          tc.item.name.toLowerCase().includes(s) ||
          tc.order.customerName.toLowerCase().includes(s);
        if (!matches) return false;
      }
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

  const stats = {
    total: toCollect.length,
    filtered: filteredToCollect.length
  };

  if (isMobile) {
    return (
      <>
        <div className="logistics-mobile-root">
          <LogisticsMobileStyles />
          <div className="logistics-mobile-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--orange)' }}>Collecte</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brown-soft)' }}>{stats.filtered} / {stats.total}</div>
            </div>
            <div className="mobile-search-bar">
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#AEAEB2' }} />
              <input
                type="text"
                placeholder="Réf, produit, client..."
                className="mobile-search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="mobile-status-tabs">
              {[
                { id: 'all', label: 'À collecter' },
                { id: 'collected', label: 'Collectés' },
                { id: 'unavailable', label: 'Indispos' },
                { id: 'alternative', label: 'Alts' }
              ].map(t => (
                <button key={t.id} onClick={() => setFilter(t.id)} className={`status-tab ${filter === t.id ? 'active' : ''}`}>
                  {t.label} ({counts[t.id as keyof typeof counts]})
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                className="filter-select"
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
                style={{ flex: 1, minWidth: '45%', height: 36, borderRadius: 10, background: '#F2F2F7', border: 'none', fontSize: 11, fontWeight: 600 }}
              >
                <option value="all">🏢 Entrepôts</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select
                className="filter-select"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                style={{ flex: 1, minWidth: '45%', height: 36, borderRadius: 10, background: '#F2F2F7', border: 'none', fontSize: 11, fontWeight: 600 }}
              >
                <option value="all">📁 Catégories</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 4, width: '100%' }}>
                <input type="date" className="filter-date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ flex: 1, height: 36, borderRadius: 10, border: 'none', background: '#F2F2F7', fontSize: 11 }} />
                <button onClick={() => setDatePreset('today')} className="btn-secondary" style={{ flex: 0.5, height: 36, borderRadius: 10, fontSize: 10 }}>Aujourd'hui</button>
              </div>
            </div>
          </div>

          <div className="logistics-mobile-content">
            <AnimatePresence mode="popLayout">
              {filteredToCollect.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '40px 0', textAlign: 'center' }}>
                  <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                  <p style={{ color: '#8E8E93', fontSize: 14 }}>Rien à collecter</p>
                </motion.div>
              ) : (
                filteredToCollect.map((tc, idx) => {
                  const h = Array.isArray(tc.order.history) ? tc.order.history : [];
                  const lastLog = h.filter((l: any) => {
                    const act = l.action.toLowerCase();
                    return (act.includes('collecté') || act.includes('indisponible') || act.includes('alternative')) &&
                      act.includes(tc.item.name.toLowerCase());
                  }).sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];
                  
                  const currentStatus = lastLog?.action.toLowerCase() || '';
                  const isCollected = currentStatus.includes('collecté') && !currentStatus.includes('alternative');
                  const isUnavailable = currentStatus.includes('indisponible');
                  const isAlt = currentStatus.includes('alternative');
                  
                  let altNote = '';
                  if (isAlt) {
                    const match = lastLog.action.match(/\(([^)]+)\)/);
                    altNote = match ? match[1] : '';
                  }

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="mobile-card"
                      style={{ padding: 0, overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', padding: '12px', gap: 14 }}>
                        {/* IMAGE LEFT */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div
                            onClick={(e) => { e.stopPropagation(); setPreviewImage(tc.item.image || tc.product.images?.[0]?.url); }}
                            style={{ width: 100, height: 100, background: '#F2F2F7', borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E5EA' }}
                          >
                            {tc.item.image || tc.product.images?.[0]?.url ? (
                              <img src={tc.item.image || tc.product.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: (isCollected || isUnavailable) ? 0.5 : 1 }} alt="" />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 32 }}>{tc.item.emoji || '📦'}</div>
                            )}
                            <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: 4, backdropFilter: 'blur(2px)' }}>
                              <Search size={12} color="white" strokeWidth={3} />
                            </div>
                            {isCollected && <div style={{ position: 'absolute', inset: 0, background: 'rgba(52, 199, 89, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={40} color="white" strokeWidth={4} /></div>}
                            {isUnavailable && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 59, 48, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={40} color="white" strokeWidth={4} /></div>}
                          </div>
                        </div>

                        {/* INFO RIGHT */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13, color: '#8E8E93' }}>{tc.order.ref}</div>
                            <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--orange)' }}>x{tc.item.qty}</div>
                          </div>
                          
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1C1E', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tc.item.name}</div>
                          <div style={{ fontSize: 11, color: '#8E8E93', fontWeight: 600, marginBottom: 4 }}>{tc.order.customerName}</div>

                          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                            {tc.order.commercialName && <span style={{ fontSize: 9, fontWeight: 700, background: '#E8F4FD', color: '#0A84FF', padding: '2px 6px', borderRadius: 6 }}>🛒 {tc.order.commercialName}</span>}
                            {lastLog?.byName && <span style={{ fontSize: 9, fontWeight: 700, background: '#F2FBF4', color: '#34C759', padding: '2px 6px', borderRadius: 6 }}>⚒️ {lastLog.byName}</span>}
                            {tc.order.packedByName && <span style={{ fontSize: 9, fontWeight: 700, background: '#FFF1F2', color: '#FF3B30', padding: '2px 6px', borderRadius: 6 }}>📦 {tc.order.packedByName}</span>}
                          </div>
                          
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <span className="size-dot" style={{ background: '#1C1C1E', color: 'white', border: 'none' }}>{tc.item.size}</span>
                            <span style={{ fontSize: 12, color: '#8E8E93', fontWeight: 700 }}>{tc.item.color}</span>
                          </div>

                          {isAlt && altNote && (
                            <div style={{ background: 'var(--orange-soft)', padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'var(--orange)', marginBottom: 8, display: 'inline-block' }}>
                              Alt: {altNote}
                            </div>
                          )}

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                            {tc.product.variants.find((v: any) => v.size === tc.item.size && v.color === tc.item.color)?.stockLevels?.map((sl: any) => (
                              <div key={sl.id} style={{ fontSize: 10, background: '#F2F2F7', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Warehouse size={10} color="#FF6B2C" />
                                <span style={{ fontWeight: 700 }}>{sl.position || sl.warehouse.name}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 10, color: '#8E8E93', fontWeight: 600 }}>{tc.order.customerName}</div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingVariants({ product: tc.product, variants: tc.product.variants }); }}
                              style={{ 
                                background: 'var(--orange-soft)', 
                                border: 'none', 
                                borderRadius: 10, 
                                padding: '6px 12px', 
                                fontSize: 12, 
                                fontWeight: 800, 
                                color: 'var(--orange)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 6,
                                boxShadow: '0 2px 8px rgba(255, 107, 44, 0.15)'
                              }}
                            >
                              <Edit2 size={14} /> Stock
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS BOTTOM */}
                      <div style={{ display: 'flex', borderTop: '1px solid #E5E5EA' }}>
                        <button
                          onClick={() => handleMark(tc.order.id, tc.product.id, 'collected', tc.item.id)}
                          style={{ 
                            flex: 1.5, height: 50, 
                            background: isCollected ? '#28a745' : '#34C759', 
                            color: 'white', border: 'none', fontWeight: 800, fontSize: 12, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            opacity: isCollected ? 1 : 0.8,
                            borderTop: isCollected ? '3px solid #1e7e34' : 'none'
                          }}
                        >
                          <Check size={18} strokeWidth={3} /> {isCollected ? 'COLLECTÉ ✓' : 'COLLECTÉ'}
                        </button>
                        <button
                          onClick={() => {
                            const note = window.prompt(`Alternative pour "${tc.item.name}" :`, altNote);
                            if (note) handleMark(tc.order.id, tc.product.id, 'alternative', tc.item.id, note);
                          }}
                          style={{ 
                            flex: 1, height: 50, 
                            background: isAlt ? '#e68a00' : '#FF9500', 
                            color: 'white', border: 'none', fontWeight: 800, fontSize: 11, 
                            borderLeft: '1px solid rgba(255,255,255,0.2)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderTop: isAlt ? '3px solid #b36b00' : 'none'
                          }}
                        >
                          {isAlt ? 'ALT ⌥' : 'ALTER.'}
                        </button>
                        <button
                          onClick={() => handleMark(tc.order.id, tc.product.id, 'unavailable', tc.item.id)}
                          style={{ 
                            flex: 1, height: 50, 
                            background: isUnavailable ? '#dc3545' : '#FF3B30', 
                            color: 'white', border: 'none', fontWeight: 800, fontSize: 11, 
                            borderLeft: '1px solid rgba(255,255,255,0.2)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderTop: isUnavailable ? '3px solid #bd2130' : 'none'
                          }}
                        >
                          {isUnavailable ? 'INDISP ✕' : 'INDISP.'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* LIGHTBOX PORTAL */}
          {previewImage && typeof document !== 'undefined' && createPortal(
            <div
              className="lightbox-overlay"
              onClick={() => setPreviewImage(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
            >
              <div className="lightbox-content animate-zoom-in" onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '95%', maxHeight: '95%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
                <button onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 44, height: 44, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={28} /></button>
              </div>
            </div>,
            document.body
          )}

          {editingVariants && (
            <VariantsEditorModal 
              product={editingVariants.product} 
              variants={editingVariants.variants} 
              onClose={() => setEditingVariants(null)} 
              onSave={(vars: any[]) => {
                startTransition(async () => {
                  try {
                    await updateProductVariants(editingVariants.product.id, vars);
                    showToast('Variantes mises à jour ✓', 'success');
                    router.refresh();
                    setEditingVariants(null);
                  } catch (e: any) {
                    showToast('Erreur', 'error');
                  }
                });
              }}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <div className="content animate-fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--orange-soft)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={22} /></div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--brown-soft)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Articles à collecter</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.filtered} <span style={{ fontSize: 14, color: 'var(--brown-soft)', fontWeight: 400 }}>/ {stats.total}</span></div>
          </div>
        </div>
      </div>

      <div className="command-center" style={{ background: 'white', borderRadius: 16, border: '1px solid var(--line)', marginBottom: 24, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--cream)', padding: 4, borderRadius: 10, border: '1px solid var(--line)' }}>
            {[{ id: 'all', label: 'À collecter', color: 'var(--orange)' }, { id: 'collected', label: 'Collectés', color: 'var(--green)' }, { id: 'unavailable', label: 'Indispos', color: 'var(--red)' }, { id: 'alternative', label: 'Alts', color: 'var(--blue)' }].map(t => (
              <button key={t.id} onClick={() => setFilter(t.id)} className={`shortcut-btn ${filter === t.id ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: 11, color: filter === t.id ? t.color : 'var(--brown-soft)', background: filter === t.id ? 'white' : 'transparent' }}>
                {t.label} <span style={{ opacity: 0.6, marginLeft: 2 }}>({counts[t.id as keyof typeof counts]})</span>
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input type="text" className="field-input" placeholder="Rechercher réf, produit, client..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, height: 38, borderRadius: 10, fontSize: 13, border: '1px solid var(--line)', background: 'var(--cream-soft)' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><Package size={14} /></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--cream-2)' }}>
          <select className="filter-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ minWidth: 140, height: 34, fontSize: 12 }}><option value="all">📁 Catégories</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className="filter-select" value={warehouseId} onChange={e => setWarehouseId(e.target.value)} style={{ minWidth: 140, height: 34, fontSize: 12 }}><option value="all">🏢 Entrepôts</option>{warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <input type="date" className="filter-date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: 34, fontSize: 11 }} />
            <span style={{ opacity: 0.3, fontSize: 10 }}>→</span>
            <input type="date" className="filter-date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ height: 34, fontSize: 11 }} />
          </div>
        </div>
      </div>

      <TableCard title={`${filteredToCollect.length} produit(s)`}>
        {filteredToCollect.length === 0 ? <EmptyState icon="🔍" title="Aucun résultat" description="Essayez de modifier vos filtres." /> : (
          <table>
            <thead><tr><th>Commande</th><th>Produit</th><th>Variation</th><th>Qté</th><th>Emplacement</th><th>Actions</th></tr></thead>
            <tbody>{filteredToCollect.map((tc, i) => <CollectionRow key={i} {...tc} isPending={isPending} onMark={handleMark} onPreview={setPreviewImage} onEditStock={() => setEditingVariants({ product: tc.product, variants: tc.product.variants })} />)}</tbody>
          </table>
        )}
      </TableCard>

      {/* LIGHTBOX PORTAL (DESKTOP) */}
      {previewImage && typeof document !== 'undefined' && createPortal(
        <div className="lightbox-overlay" onClick={() => setPreviewImage(null)} style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)', cursor: 'zoom-out' }}>
          <img src={previewImage} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} alt="Zoomed" />
        </div>,
        document.body
      )}

      {editingVariants && <VariantsEditorModal product={editingVariants.product} variants={editingVariants.variants} onClose={() => setEditingVariants(null)} onSave={(vars: any[]) => { startTransition(async () => { try { await updateProductVariants(editingVariants.product.id, vars); showToast('Variantes mises à jour ✓', 'success'); router.refresh(); setEditingVariants(null); } catch (e: any) { showToast('Erreur', 'error'); } }); }} />}
    </div>
  );
}

function CollectionRow({ order, item, product, isPending, onMark, onPreview, onEditStock }: any) {
  const h = Array.isArray(order.history) ? order.history : [];
  const collector = h.filter((l: any) => {
    const act = l.action.toLowerCase();
    return (act.includes('collecté') || act.includes('indisponible') || act.includes('alternative')) &&
      act.includes(item.name.toLowerCase());
  }).sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];

  return (
    <tr>
      <td>
        <div className="cell-mono" style={{ fontWeight: 800 }}>{order.ref}</div>
        <div className="cell-muted" style={{ fontSize: 11 }}>{order.customerName}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
          {order.commercialName && <span style={{ fontSize: 9, fontWeight: 700, color: '#0A84FF' }}>🛒 {order.commercialName}</span>}
          {collector?.byName && <span style={{ fontSize: 9, fontWeight: 700, color: '#34C759' }}>⚒️ {collector.byName}</span>}
          {order.packedByName && <span style={{ fontSize: 9, fontWeight: 700, color: '#FF3B30' }}>📦 {order.packedByName}</span>}
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={() => onPreview(item.image || product.images?.[0]?.url)} style={{ width: 44, height: 44, background: 'var(--cream-2)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', cursor: 'zoom-in' }}>
            {item.image || product.images?.[0]?.url ? <img src={item.image || product.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (item.emoji || '📦')}
          </div>
          <div><span className="cell-strong" style={{ fontSize: 13 }}>{item.name}</span><div style={{ fontSize: 10, color: 'var(--brown-soft)' }}>{product.category?.name}</div></div>
        </div>
      </td>
      <td><span className="size-dot">{item.size}</span> <strong style={{ fontSize: 12 }}>{item.color}</strong></td>
      <td><strong style={{ fontSize: 14 }}>x{item.qty}</strong></td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {product.variants.find((v: any) => v.size === item.size && v.color === item.color)?.stockLevels?.map((sl: any) => (
            <div key={sl.id} style={{ fontSize: 9, background: 'var(--cream-2)', padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Warehouse size={10} className="text-orange" /><span>{sl.warehouse.name}</span>{sl.position && <span style={{ fontWeight: 800 }}>• {sl.position}</span>}</div>
          ))}
        </div>
      </td>
      <td style={{ width: 120 }}>
        <div className="row-actions">
          <button className="action-btn" onClick={() => onMark(order.id, product.id, 'collected', item.id)} style={{ background: 'var(--green-soft)', color: 'var(--green)' }} title="Collecté"><Check size={16} /></button>
          <button className="action-btn" onClick={() => { const note = window.prompt(`Alternative pour "${item.name}" :`); if (note) onMark(order.id, product.id, 'alternative', item.id, note); }} style={{ background: 'var(--orange-soft)', color: 'var(--orange)' }} title="Alternative"><ArrowLeftRight size={16} /></button>
          <button className="action-btn" onClick={() => onMark(order.id, product.id, 'unavailable', item.id)} style={{ background: 'var(--red-soft)', color: 'var(--red)' }} title="Indisponible"><X size={16} /></button>
          <button className="action-btn" onClick={onEditStock} style={{ background: 'var(--cream)', color: 'var(--brown-soft)' }} title="Modifier Stock"><Edit2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
}

function VariantsEditorModal({ product, variants: initialVariants, onClose, onSave }: any) {
  const [variants, setVariants] = React.useState(initialVariants);
  const updateVariant = (idx: number, field: string, value: any) => { const n = [...variants]; n[idx] = { ...n[idx], [field]: field === 'stock' ? Math.max(0, parseInt(value) || 0) : value }; setVariants(n); };
  return (
    <Modal isOpen={true} onClose={onClose} title={`Stock · ${product.name}`} large footer={<><button className="btn-secondary" onClick={onClose}>Annuler</button><button className="btn-orange" onClick={() => onSave(variants)}>Enregistrer</button></>}>
      <div style={{ marginBottom: 14 }}><div style={{ fontWeight: 600 }}>{product.name}</div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Taille</th><th>Couleur</th><th>Stock</th><th>Empl.</th></tr></thead>
          <tbody>{variants.map((v: any, i: number) => (
            <tr key={i}><td><span className="size-dot">{v.size}</span></td><td>{v.color}</td><td><input type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} style={{ width: 60 }} /></td><td><input type="text" value={v.location || ''} onChange={e => updateVariant(i, 'location', e.target.value)} style={{ width: 80 }} /></td></tr>
          ))}</tbody>
        </table>
      </div>
    </Modal>
  );
}

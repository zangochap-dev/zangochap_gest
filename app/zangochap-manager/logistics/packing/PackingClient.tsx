"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { TableCard, StatusBadge, EmptyState, DetailCard, SectionLabel, LocationBadge } from "@/components/UI";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { updateOrderStatus } from "@/modules/orders/actions";
import { formatPrice, formatDay, STATUS_LABELS } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Package, Check, ArrowLeftRight, Warehouse, X, Search, ChevronRight, ClipboardList } from "lucide-react";
import { addOrderHistoryEntry } from "@/modules/orders/actions";
import { useIsMobile } from "@/lib/hooks";
import LogisticsMobileStyles from "../_components/LogisticsMobileStyles";
import { motion, AnimatePresence } from "framer-motion";

export default function PackingClient({ initialOrders, products, user }: { initialOrders: any[]; products: any[]; user: any }) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('status') || 'CONFIRMED');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<number>>>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [packingNote, setPackingNote] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Auto-refresh every 15s for packing queue (real-time critical)
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(interval);
  }, [router]);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p: any) => map.set(p.id, p));
    return map;
  }, [products]);

  const warehouses = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: any) => {
      p.variants.forEach((v: any) => {
        v.stockLevels.forEach((sl: any) => {
          if (sl.warehouse?.name) set.add(sl.warehouse.name);
        });
      });
    });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = initialOrders;
    if (filter === 'ALTERNATIVE') {
      result = result.filter((o: any) => o.history?.some((h: any) => h.action.includes('Alternative proposée')));
    } else if (filter !== 'all') {
      result = result.filter((o: any) => o.status === filter);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((o: any) => o.ref.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s));
    }
    if (dateFrom) result = result.filter((o: any) => new Date(o.createdAt) >= new Date(dateFrom));
    if (dateTo) result = result.filter((o: any) => new Date(o.createdAt) <= new Date(dateTo + 'T23:59:59'));

    if (warehouseFilter !== 'all') {
      result = result.filter((o: any) => {
        return o.items.some((item: any) => {
          const p = productMap.get(item.productId);
          if (!p) return false;
          const v = p.variants.find((vv: any) => vv.size === item.size && vv.color === item.color);
          if (!v) return false;
          return v.stockLevels.some((sl: any) => sl.warehouse?.name === warehouseFilter);
        });
      });
    }

    return result;
  }, [initialOrders, filter, search, dateFrom, dateTo, warehouseFilter, productMap]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(o => o.id)));
  };

  const handleBulkMark = (status: string) => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Marquer ${selectedIds.size} commandes comme "${status}" ?`)) return;

    startTransition(async () => {
      try {
        await Promise.all(Array.from(selectedIds).map(id => updateOrderStatus(id, status)));
        showToast(`${selectedIds.size} commandes mises à jour ✓`, 'success');
        setSelectedIds(new Set());
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur lors du traitement groupé', 'error');
      }
    });
  };

  const toggleCheckItem = (orderId: string, idx: number) => {
    const next = { ...checkedItems };
    if (!next[orderId]) next[orderId] = new Set();
    else next[orderId] = new Set(next[orderId]);

    if (next[orderId].has(idx)) next[orderId].delete(idx);
    else next[orderId].add(idx);
    setCheckedItems(next);
  };

  const handleMarkPacking = (orderId: string, status: string) => {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status, packingNote || undefined);
        showToast('Statut mis à jour ✓', 'success');
        router.refresh();
        setSelectedOrder(null);
        setPackingNote('');
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  const handleProposeAlternative = (orderId: string, itemName: string) => {
    const alt = prompt(`Quelle alternative proposer pour "${itemName}" ? (ex: Taille 41 au lieu de 40)`);
    if (!alt) return;

    startTransition(async () => {
      try {
        await addOrderHistoryEntry(orderId, `Alternative proposée pour "${itemName}" : ${alt}`);
        showToast('Alternative enregistrée ✓', 'success');
        router.refresh();
      } catch (e: any) {
        showToast('Erreur lors de l\'enregistrement', 'error');
      }
    });
  };

  const filters = [
    { key: 'CONFIRMED', label: 'Confirmées' },
    { key: 'PREPARING', label: 'Suivies' },
    { key: 'ALTERNATIVE', label: 'Alternatives' },
    { key: 'PACKED', label: 'Emballées' },
    { key: 'PARTIAL', label: 'Partielles' },
    { key: 'all', label: 'Toutes' },
  ];

  if (isMobile) {
    return (
      <div className="logistics-mobile-root">
        <LogisticsMobileStyles />
        <div className="logistics-mobile-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800 }}>Emballage</h1>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', background: 'var(--orange-soft)', padding: '4px 10px', borderRadius: 20 }}>
              {filtered.length} commandes
            </div>
          </div>

          <div className="mobile-search-bar">
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#AEAEB2' }} />
            <input
              type="text"
              placeholder="Réf ou client..."
              className="mobile-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="mobile-status-tabs">
            {filters.map(f => (
              <button
                key={f.key}
                className={`status-tab ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="filter-select"
              style={{ flex: 1, height: 36, borderRadius: 10, background: '#F2F2F7', border: 'none', fontWeight: 600, color: warehouseFilter !== 'all' ? 'var(--orange)' : 'inherit' }}
              value={warehouseFilter}
              onChange={e => setWarehouseFilter(e.target.value)}
            >
              <option value="all">🏢 Tous Entrepôts</option>
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="date"
                className="filter-date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                style={{ height: 36, borderRadius: 10, border: 'none', background: '#F2F2F7', width: 110, fontSize: 10 }}
              />
            </div>
          </div>
        </div>

        <div className="logistics-mobile-content">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: '40px 0', textAlign: 'center' }}
              >
                <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <p style={{ color: '#8E8E93', fontSize: 14 }}>Aucune commande trouvée</p>
              </motion.div>
            ) : (
              filtered.map((o: any, idx: number) => {
                const totalItems = o.items.length;
                const checkedCount = checkedItems[o.id]?.size || 0;
                const progress = (checkedCount / totalItems) * 100;

                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="mobile-card"
                    onClick={() => { setSelectedOrder(o); setPackingNote(''); }}
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      borderLeft: o.status === 'PREPARING' ? '4px solid #FB7185' : '1px solid #E5E5EA',
                      background: 'white',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ display: 'flex', padding: '12px', gap: 14 }}>
                      {/* IMAGE LEFT */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                          onClick={(e) => {
                            if (o.items[0]?.image) {
                              e.stopPropagation();
                              setPreviewImage(o.items[0].image);
                            }
                          }}
                          style={{
                            width: 100,
                            height: 100,
                            background: '#F2F2F7',
                            borderRadius: 14,
                            overflow: 'hidden',
                            border: '1.5px solid #E5E5EA',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                          }}
                        >
                          {o.items[0]?.image ? (
                            <img src={o.items[0].image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 32 }}>{o.items[0]?.emoji || '📦'}</div>
                          )}
                        </div>
                        {totalItems > 1 && (
                          <div style={{ position: 'absolute', bottom: -6, right: -6, background: '#1C1C1E', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, border: '2px solid white' }}>
                            +{totalItems - 1}
                          </div>
                        )}
                      </div>

                      {/* INFO RIGHT */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: '#1C1C1E' }}>{o.ref}</div>
                          <StatusBadge status={o.status} size="sm" />
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1E', marginBottom: 2 }}>{o.customerName}</div>
                        <div style={{ fontSize: 10, color: '#8E8E93', fontWeight: 600, marginBottom: 8 }}>{o.commune || 'Abidjan'} • {formatDay(o.createdAt)}</div>

                        <div style={{ background: '#F2F2F7', padding: '8px', borderRadius: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 800, color: '#8E8E93', marginBottom: 4 }}>
                            <span>PROGRESSION</span>
                            <span style={{ color: progress === 100 ? '#34C759' : '#1C1C1E' }}>{checkedCount}/{totalItems}</span>
                          </div>
                          <div className="progress-bar-bg" style={{ height: 4 }}>
                            <div className="progress-bar-fill" style={{ width: `${progress}%`, background: progress === 100 ? '#34C759' : '#FF6B2C' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS BOTTOM */}
                    <div style={{ display: 'flex', borderTop: '1px solid #E5E5EA' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (progress < 100) { if (!confirm('Tout n\'est pas coché. Marquer comme emballé quand même ?')) return; } handleMarkPacking(o.id, 'PACKED'); }}
                        style={{ flex: 1.5, height: 44, background: '#34C759', color: 'white', border: 'none', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Check size={16} strokeWidth={3} /> PACKER
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkPacking(o.id, 'PARTIAL'); }}
                        style={{ flex: 1, height: 44, background: '#FF9500', color: 'white', border: 'none', fontWeight: 800, fontSize: 12, borderLeft: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        PARTIEL
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkPacking(o.id, 'STOCK_ISSUE'); }}
                        style={{ flex: 1, height: 44, background: '#FF3B30', color: 'white', border: 'none', fontWeight: 800, fontSize: 12, borderLeft: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        STOCK
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {selectedIds.size > 0 && (
          <div className="animate-slide-up" style={{ position: 'fixed', bottom: 20, left: 16, right: 16, background: '#1C1C1E', color: 'white', padding: '12px 16px', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 300 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedIds.size} sél.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleBulkMark('PREPARING')} style={{ background: '#3A3A3C', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>Suivie</button>
              <button onClick={() => handleBulkMark('PACKED')} style={{ background: '#FF6B2C', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>Emballé</button>
            </div>
          </div>
        )}

        {/* MOBILE PACKING DETAIL MODAL */}
        {selectedOrder && (
          <Modal isOpen={true} onClose={() => setSelectedOrder(null)} title={`Détails · ${selectedOrder.ref}`} large
            footer={
              <div style={{ display: 'flex', width: '100%', gap: 10 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedOrder(null)}>Fermer</button>
                <button className="btn-orange" style={{ flex: 2 }} onClick={() => handleMarkPacking(selectedOrder.id, 'PACKED')} disabled={isPending}>
                  <Check size={16} /> Valider Emballage
                </button>
              </div>
            }
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--orange)', fontSize: 18 }}>{selectedOrder.ref}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{selectedOrder.customerName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#8E8E93', marginBottom: 2 }}>PROGRESSION</div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{(checkedItems[selectedOrder.id]?.size || 0)} / {selectedOrder.items.length}</div>
              </div>
            </div>

            <SectionLabel spaced>Checklist Articles</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedOrder.items.map((item: any, idx: number) => {
                const p = productMap.get(item.productId);
                const isChecked = checkedItems[selectedOrder.id]?.has(idx);
                return (
                  <DetailCard
                    key={idx}
                    className={isChecked ? 'checked' : ''}
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      borderRadius: 14,
                      border: isChecked ? '1.5px solid #34C759' : '1px solid #E5E5EA',
                      background: isChecked ? '#F2FBF4' : 'white',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => toggleCheckItem(selectedOrder.id, idx)}
                  >
                    <div style={{ display: 'flex', minHeight: 90 }}>
                      {/* IMAGE LEFT */}
                      <div style={{ position: 'relative', width: 90, flexShrink: 0, background: '#F2F2F7', borderRight: '1px solid #E5E5EA' }}>
                        {item.image ? (
                          <img
                            src={item.image}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isChecked ? 0.3 : 1 }}
                            onClick={(e) => { e.stopPropagation(); setPreviewImage(item.image); }}
                            alt=""
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 28 }}>{item.emoji || '📦'}</div>
                        )}
                        {isChecked && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(52, 199, 89, 0.1)' }}>
                            <Check size={36} color="#34C759" strokeWidth={5} />
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: 6, left: 6, width: 20, height: 20, borderRadius: 5, border: '2px solid', borderColor: isChecked ? '#34C759' : '#C7C7CC', background: isChecked ? '#34C759' : 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isChecked && <Check size={14} color="white" strokeWidth={4} />}
                        </div>
                      </div>

                      {/* INFO RIGHT */}
                      <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: isChecked ? '#8E8E93' : '#1C1C1E', textDecoration: isChecked ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </div>
                          <div style={{ fontWeight: 900, fontSize: 16, color: isChecked ? '#8E8E93' : 'var(--orange)', marginLeft: 6 }}>
                            x{item.qty}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                          <span className="size-dot" style={{ background: '#1C1C1E', color: 'white', border: 'none', scale: '0.8' }}>{item.size}</span>
                          <span style={{ fontSize: 11, color: '#8E8E93', fontWeight: 700 }}>{item.color}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {p?.variants?.find((v: any) => v.size === item.size && v.color === item.color)?.stockLevels?.map((sl: any) => (
                              <div key={sl.id} style={{ fontSize: 9, background: '#F2F2F7', padding: '2px 6px', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Warehouse size={9} color="#FF6B2C" />
                                <span style={{ fontWeight: 700 }}>{sl.position || sl.warehouse.name}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            className="action-btn"
                            onClick={(e) => { e.stopPropagation(); handleProposeAlternative(selectedOrder.id, item.name); }}
                            style={{ background: 'var(--orange-soft)', color: 'var(--orange)', width: 28, height: 28, borderRadius: 8, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <ArrowLeftRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Alternative Message Display */}
                    {selectedOrder.history?.filter((h: any) => h.action.includes(`Alternative proposée pour "${item.name}"`)).map((h: any, hi: number) => (
                      <div key={hi} style={{ margin: '0 12px 10px', padding: '8px 12px', background: 'var(--orange-soft)', borderLeft: '3px solid var(--orange)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                        <div style={{ fontSize: 9, textTransform: 'uppercase', opacity: 0.6, marginBottom: 2 }}>Alternative :</div>
                        {h.action.split(' : ')[1]}
                      </div>
                    ))}
                  </DetailCard>
                );
              })}
            </div>

            {/* Note Section */}
            <div style={{ marginTop: 20 }}>
              <SectionLabel spaced>Note d'emballage</SectionLabel>
              <textarea
                className="mobile-search-input"
                value={packingNote}
                onChange={e => setPackingNote(e.target.value)}
                placeholder="Note optionnelle..."
                style={{ height: 80, padding: 12, fontSize: 13, background: '#F2F2F7', border: 'none', borderRadius: 12, width: '100%' }}
              />
            </div>
          </Modal>
        )}

        {/* LIGHTBOX PORTAL */}
        {previewImage && typeof document !== 'undefined' && createPortal(
          <div
            className="lightbox-overlay"
            onClick={() => setPreviewImage(null)}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              zIndex: 99999, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'rgba(0,0,0,0.92)', 
              backdropFilter: 'blur(8px)' 
            }}
          >
            <div className="lightbox-content animate-zoom-in" onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '95%', maxHeight: '95%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={previewImage} 
                alt="Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain', 
                  borderRadius: 16,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                }} 
              />
              <button 
                onClick={() => setPreviewImage(null)} 
                style={{ 
                  position: 'absolute', 
                  top: 20, 
                  right: 20, 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: 44, 
                  height: 44,
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={28} />
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="content animate-fade-in">
      <div className="filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: 12, marginBottom: 20, border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {filters.map(f => (
            <button key={f.key} className={`filter-chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            type="text"
            placeholder="Rechercher une réf ou un client..."
            className="field-input"
            style={{ paddingLeft: 36, height: 36, fontSize: 13 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}><Eye size={16} /></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            className="filter-date"
            style={{ width: 140, fontWeight: 600, color: warehouseFilter !== 'all' ? 'var(--orange)' : 'inherit' }}
            value={warehouseFilter}
            onChange={e => setWarehouseFilter(e.target.value)}
          >
            <option value="all">Tous les entrepôts</option>
            {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <input type="date" className="filter-date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span style={{ opacity: 0.3 }}>→</span>
          <input type="date" className="filter-date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="animate-slide-up" style={{ background: '#221F1D', color: 'white', padding: '12px 20px', borderRadius: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedIds.size} commande(s) sélectionnée(s)</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setSelectedIds(new Set())} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Annuler</button>
            <button onClick={() => handleBulkMark('PREPARING')} disabled={isPending} style={{ background: 'white', color: '#221F1D', border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Marquer comme Suivie</button>
            <button onClick={() => handleBulkMark('PACKED')} disabled={isPending} className="btn-orange" style={{ padding: '6px 16px', fontSize: 12 }}>Marquer comme Emballé</button>
          </div>
        </div>
      )}

      <TableCard title={`${filtered.length} commande(s)`}>
        {filtered.length === 0 ? (
          <EmptyState icon="📦" title="Rien à emballer" description="Aucune commande avec ce filtre." />
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                <th>Référence</th><th>Articles</th><th>Emplacements</th><th>Validé par</th><th>Statut</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o: any) => (
                <tr
                  key={o.id}
                  style={{
                    background: o.status === 'PREPARING' ? '#FFF1F2' : selectedIds.has(o.id) ? 'var(--cream-2)' : '',
                    borderLeft: o.status === 'PREPARING' ? '4px solid #FB7185' : ''
                  }}
                >
                  <td><input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggleSelect(o.id)} /></td>
                  <td>
                    <span className="cell-mono" style={{ fontWeight: 800 }}>{o.ref}</span>
                    <div className="cell-muted">{formatDay(o.createdAt)}</div>
                  </td>
                  <td>
                    {o.items.map((i: any, idx: number) => {
                      const isChecked = checkedItems[o.id]?.has(idx);
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, margin: '2px 0', opacity: isChecked ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                          <div
                            onClick={(e) => { e.stopPropagation(); toggleCheckItem(o.id, idx); }}
                            style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid var(--line)', background: isChecked ? 'var(--green)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            {isChecked && <Check size={10} color="white" />}
                          </div>
                          {i.image ? (
                            <img
                              src={i.image}
                              alt=""
                              style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover', cursor: 'zoom-in' }}
                              onClick={() => setPreviewImage(i.image)}
                            />
                          ) : (
                            <span>{i.emoji || '📦'}</span>
                          )}
                          <span style={{ fontWeight: 600, textDecoration: isChecked ? 'line-through' : 'none' }}>{i.name}</span>
                          <span className="size-dot">{i.size}</span>
                          <strong style={{ fontSize: 11 }}>{i.color}</strong>

                          {/* Alternative Message Display */}
                          {o.history?.filter((h: any) => h.action.includes(`Alternative proposée pour "${i.name}"`)).map((h: any, hi: number) => (
                            <div key={hi} style={{ fontSize: 10, color: 'var(--orange)', background: 'var(--orange-soft)', padding: '1px 6px', borderRadius: 4, fontWeight: 700, marginTop: 2 }}>
                              {h.action.split(' : ')[1]}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {o.items.map((item: any, idx: number) => {
                        const p = productMap.get(item.productId);
                        if (!p) return null;
                        const variant = p.variants.find((v: any) => v.size === item.size && v.color === item.color);
                        return (
                          <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {variant?.stockLevels?.map((sl: any) => (
                              <div key={sl.id} style={{ fontSize: 9, background: 'var(--cream-2)', padding: '1px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Warehouse size={8} className="text-orange" />
                                <span>{sl.warehouse.name}</span>
                                {sl.position && <span style={{ fontWeight: 800 }}>• {sl.position}</span>}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td><span className="cell-muted">{o.commercialName || '—'}</span></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="action-btn" title="Détail emballage" onClick={() => { setSelectedOrder(o); setPackingNote(''); }}>
                        <Eye size={14} />
                      </button>
                      {o.status === 'PACKED' && (
                        <button className="action-btn" title="Annuler l'emballage (Erreur)" onClick={() => { if (confirm('Annuler l\'emballage de cette commande ?')) handleMarkPacking(o.id, 'CONFIRMED'); }} style={{ color: 'var(--red)', background: '#FEE2E2' }}>
                          <ArrowLeftRight size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      {/* PACKING DETAIL MODAL (DESKTOP) */}
      {selectedOrder && (
        <Modal isOpen={true} onClose={() => setSelectedOrder(null)} title={`Emballage · ${selectedOrder.ref}`} large
          footer={
            <>
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>Fermer</button>
              {selectedOrder.status === 'PACKED' ? (
                <button className="btn-secondary" onClick={() => handleMarkPacking(selectedOrder.id, 'CONFIRMED')} disabled={isPending} style={{ background: '#FEE2E2', color: '#EF4444', borderColor: '#FCA5A5' }}>
                  <ArrowLeftRight size={14} /> Annuler l'emballage (Erreur)
                </button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => handleMarkPacking(selectedOrder.id, 'CONFIRMED')} disabled={isPending} style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
                    Pas en stock
                  </button>
                  <button className="btn-secondary" onClick={() => handleMarkPacking(selectedOrder.id, 'PARTIAL')} disabled={isPending} style={{ borderColor: 'var(--amber)', color: 'var(--amber)' }}>
                    Incomplet
                  </button>
                  <button className="btn-orange" onClick={() => handleMarkPacking(selectedOrder.id, 'PACKED')} disabled={isPending}>
                    <Check size={14} /> Prêt pour livraison ✓
                  </button>
                </>
              )}
            </>
          }
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--orange)', fontSize: 20 }}>{selectedOrder.ref}</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{selectedOrder.customerName} · {selectedOrder.commune}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brown-soft)', marginBottom: 4 }}>PROGRESSION</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{checkedItems[selectedOrder.id]?.size || 0} / {selectedOrder.items.length}</div>
            </div>
          </div>

          <SectionLabel>Checklist de l'emballeur</SectionLabel>
          {selectedOrder.items.map((item: any, idx: number) => {
            const p = productMap.get(item.productId);
            const isChecked = checkedItems[selectedOrder.id]?.has(idx);
            return (
              <DetailCard
                key={idx}
                className={isChecked ? 'checked' : ''}
                style={{ marginBottom: 12 }}
                onClick={() => toggleCheckItem(selectedOrder.id, idx)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, border: '2px solid', borderColor: isChecked ? 'var(--green)' : 'var(--line)', background: isChecked ? 'var(--green-soft)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                    {isChecked && <Check size={18} color="var(--green)" />}
                  </div>
                  <div style={{ width: 60, height: 60, background: 'var(--cream-2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, overflow: 'hidden', border: '1px solid var(--line)' }}>
                    {item.image ? <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (item.emoji || '📦')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, textDecoration: isChecked ? 'line-through' : 'none' }}>{item.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--brown-soft)', marginTop: 4 }}>Taille : {item.size} | Couleur : {item.color} | Qté : x{item.qty}</div>
                      </div>
                      <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleProposeAlternative(selectedOrder.id, item.name); }}><ArrowLeftRight size={14} /></button>
                    </div>
                  </div>
                </div>
              </DetailCard>
            );
          })}

          <div style={{ marginTop: 20 }}>
            <SectionLabel>Note d'emballage</SectionLabel>
            <textarea className="field-input" value={packingNote} onChange={e => setPackingNote(e.target.value)} style={{ minHeight: 80 }} />
          </div>
        </Modal>
      )}

      {/* LIGHTBOX PORTAL (DESKTOP) */}
      {previewImage && typeof document !== 'undefined' && createPortal(
        <div 
          className="lightbox-overlay" 
          onClick={() => setPreviewImage(null)} 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 99999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(0,0,0,0.9)', 
            backdropFilter: 'blur(5px)',
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={previewImage} 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '90%', 
              objectFit: 'contain', 
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }} 
            alt="Zoomed"
          />
        </div>,
        document.body
      )}
    </div>
  );
}

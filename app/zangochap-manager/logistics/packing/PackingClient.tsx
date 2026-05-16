"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { TableCard, StatusBadge, EmptyState, DetailCard, SectionLabel, LocationBadge } from "@/components/UI";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { addOrderHistoryEntry, updateOrderStatus } from "@/modules/orders/actions";
import { formatPrice, formatDay, STATUS_LABELS } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Package, Check, ArrowLeftRight, Warehouse, X, Search, ChevronRight, ClipboardList, Edit2, RefreshCw } from "lucide-react";
import { updateProductVariants } from "@/modules/products/actions";
import { toggleItemVerification } from "@/modules/logistics/actions";
import { useIsMobile } from "@/lib/hooks";
import LogisticsMobileStyles from "../_components/LogisticsMobileStyles";
import { motion, AnimatePresence } from "framer-motion";
import PackingOrderModal from "./_components/PackingOrderModal";
import VariantsEditorModal from "./_components/VariantsEditorModal";
import PackingItem from "./_components/PackingItem";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function PackingClient({ initialOrders, products, user }: { initialOrders: any[]; products: any[]; user: any }) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState(searchParams.get('status') || 'CONFIRMED');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Date filter: default to empty (all pending) to avoid missing old orders
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [packingNote, setPackingNote] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [editingVariants, setEditingVariants] = useState<any>(null);
  const [optimisticChecks, setOptimisticChecks] = useState<Record<string, boolean>>({});
  const [savingChecks, setSavingChecks] = useState<Set<string>>(new Set());

  // REACT QUERY: Smooth background polling (No UI lag)
  const { data: queryData, isFetching } = useQuery({
    queryKey: ['packing-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders/packing'); // Ensure this endpoint exists or use appropriate one
      if (!res.ok) throw new Error('Erreur de synchro');
      return res.json();
    },
    initialData: { orders: initialOrders },
    refetchInterval: 15000, // Every 15s is enough for logistics
    staleTime: 5000,
  });

  const orders = useMemo(() => queryData?.orders || initialOrders, [queryData, initialOrders]);

  // Sync selectedOrder with latest data from polling
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o: any) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders, selectedOrder?.id]);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p: any) => map.set(p.id, p));
    return map;
  }, [products]);

  const warehouses = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: any) => {
      p.variants?.forEach((v: any) => {
        v.stockLevels?.forEach((sl: any) => {
          if (sl.warehouse?.name) set.add(sl.warehouse.name);
        });
      });
    });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...orders]; // Create a copy to avoid mutating original
    
    // 1. Basic Status Filter
    if (filter === 'ALTERNATIVE') {
      result = result.filter((o: any) => o.history?.some((h: any) => h.action.includes('Alternative proposée')));
    } else if (filter !== 'all') {
      result = result.filter((o: any) => o.status === filter);
    }

    // 2. Search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((o: any) => 
        o.ref.toLowerCase().includes(s) || 
        o.customerName.toLowerCase().includes(s)
      );
    }

    // 3. Dates (if set)
    if (dateFrom) result = result.filter((o: any) => new Date(o.createdAt) >= new Date(dateFrom));
    if (dateTo) result = result.filter((o: any) => new Date(o.createdAt) <= new Date(dateTo + 'T23:59:59'));

    // 4. Warehouse (Optimized)
    if (warehouseFilter !== 'all') {
      result = result.filter((o: any) => {
        return o.items.some((item: any) => {
          const p = productMap.get(item.productId);
          if (!p) return false;
          const v = p.variants?.find((vv: any) => vv.size === item.size && vv.color === item.color);
          return v?.stockLevels?.some((sl: any) => sl.warehouse?.name === warehouseFilter);
        });
      });
    }

    // 5. SMART SORTING
    return result.sort((a: any, b: any) => {
      // Priority 1: Alternatives proposed first
      const aAlt = a.history?.some((h: any) => h.action.includes('Alternative proposée'));
      const bAlt = b.history?.some((h: any) => h.action.includes('Alternative proposée'));
      if (aAlt && !bAlt) return -1;
      if (!aAlt && bAlt) return 1;

      // Priority 2: Newest first (Latest at the top)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [orders, filter, search, dateFrom, dateTo, warehouseFilter, productMap]);

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

    // Optimistic Update
    const previousData = queryClient.getQueryData(['packing-orders']);
    queryClient.setQueryData(['packing-orders'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        orders: old.orders.map((o: any) => 
          selectedIds.has(o.id) ? { ...o, status } : o
        )
      };
    });

    startTransition(async () => {
      try {
        await Promise.all(Array.from(selectedIds).map(id => updateOrderStatus(id, status)));
        showToast(`${selectedIds.size} commandes mises à jour ✓`, 'success');
        setSelectedIds(new Set());
      } catch (e: any) {
        // Rollback
        queryClient.setQueryData(['packing-orders'], previousData);
        showToast(e?.message || 'Erreur lors du traitement groupé', 'error');
      } finally {
        queryClient.invalidateQueries({ queryKey: ['packing-orders'] });
      }
    });
  };

  const toggleCheckItem = (orderId: string, item: any) => {
    const currentStatus = optimisticChecks[item.id] !== undefined 
      ? optimisticChecks[item.id] 
      : item.isVerified;
    const newStatus = !currentStatus;
    
    // Optimistic Update: Change UI INSTANTLY
    setOptimisticChecks(prev => ({
      ...prev,
      [item.id]: newStatus
    }));

    // Track saving state for spinner
    setSavingChecks(prev => new Set(prev).add(item.id));

    // Fire-and-forget: persist to DB without blocking UI
    toggleItemVerification(item.id, newStatus)
      .then(() => {
        setSavingChecks(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      })
      .catch(() => {
        // Rollback on error
        setOptimisticChecks(prev => ({
          ...prev,
          [item.id]: currentStatus
        }));
        setSavingChecks(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        showToast("Erreur lors de la vérification", "error");
      });
  };

  const handleMarkPacking = (orderId: string, status: string) => {
    const order = orders.find((o: any) => o.id === orderId) || selectedOrder;
    if (status === 'PACKED' && order) {
      const unverifiedCount = order.items.filter((i: any) => !i.isVerified).length;
      if (unverifiedCount > 0) {
        if (!confirm(`Attention : ${unverifiedCount} article(s) n'ont pas été vérifiés. Voulez-vous quand même marquer la commande comme emballée ?`)) {
          return;
        }
      }
    }

    // Optimistic
    const previousData = queryClient.getQueryData(['packing-orders']);
    queryClient.setQueryData(['packing-orders'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        orders: old.orders.map((o: any) => o.id === orderId ? { ...o, status } : o)
      };
    });

    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status, packingNote || undefined);
        showToast('Statut mis à jour ✓', 'success');
        setSelectedOrder(null);
        setPackingNote('');
      } catch (e: any) {
        queryClient.setQueryData(['packing-orders'], previousData);
        showToast(e?.message || 'Erreur lors du marquage', 'error');
      } finally {
        queryClient.invalidateQueries({ queryKey: ['packing-orders'] });
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
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800 }}>Emballage</h1>
            <div style={{ position: 'absolute', right: 0, fontSize: 12, fontWeight: 700, color: 'var(--orange)', background: 'var(--orange-soft)', padding: '4px 10px', borderRadius: 20 }}>
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

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select
              className="filter-select"
              style={{ flex: 1, height: 36, borderRadius: 10, background: '#F2F2F7', border: 'none', fontWeight: 600, color: warehouseFilter !== 'all' ? 'var(--orange)' : 'inherit' }}
              value={warehouseFilter}
              onChange={e => setWarehouseFilter(e.target.value)}
            >
              <option value="all">🏢 Tous Entrepôts</option>
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#F2F2F7', padding: '2px', borderRadius: 10, marginBottom: 12 }}>
            {[
              { label: 'Auj.', val: 'today' },
              { label: 'Hier', val: 'yesterday' },
              { label: '3J', val: '3days' },
              { label: 'Tout', val: 'all' }
            ].map(d => (
              <button
                key={d.val}
                onClick={() => {
                  const now = new Date();
                  const today = now.toISOString().split('T')[0];
                  if (d.val === 'today') { setDateFrom(today); setDateTo(today); }
                  else if (d.val === 'yesterday') {
                    const yest = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];
                    setDateFrom(yest); setDateTo(yest);
                  }
                  else if (d.val === '3days') {
                    const three = new Date(now.setDate(now.getDate() - 2)).toISOString().split('T')[0];
                    setDateFrom(three); setDateTo(today);
                  }
                  else { setDateFrom(''); setDateTo(''); }
                }}
                style={{
                  flex: 1,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '6px 0',
                  borderRadius: 8,
                  border: 'none',
                  background: (d.val === 'today' && dateFrom === new Date().toISOString().split('T')[0]) || (d.val === 'all' && !dateFrom) ? 'white' : 'transparent',
                  boxShadow: (d.val === 'today' && dateFrom === new Date().toISOString().split('T')[0]) || (d.val === 'all' && !dateFrom) ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                {d.label}
              </button>
            ))}
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
              filtered.map((o: any, idx: number) => (
                <PackingItem
                  key={o.id}
                  order={o}
                  isMobile={true}
                  idx={idx}
                  productMap={productMap}
                  isSelected={selectedIds.has(o.id)}
                  onToggleSelect={toggleSelect}
                  onSelect={(order) => { setSelectedOrder(order); setPackingNote(''); }}
                  onEditStock={(p) => setEditingVariants({ product: p, variants: p.variants })}
                  onMarkPacking={handleMarkPacking}
                  onPreviewImage={setPreviewImage}
                  onToggleCheckItem={toggleCheckItem}
                  optimisticChecks={optimisticChecks}
                />
              ))
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

        {/* PACKING DETAIL MODAL */}
        <PackingOrderModal
          order={selectedOrder}
          isMobile={isMobile}
          isPending={isPending}
          productMap={productMap}
          packingNote={packingNote}
          setPackingNote={setPackingNote}
          onClose={() => setSelectedOrder(null)}
          onMarkPacking={handleMarkPacking}
          onProposeAlternative={handleProposeAlternative}
          onEditStock={(p) => setEditingVariants({ product: p, variants: p.variants })}
          onToggleCheckItem={toggleCheckItem}
          onPreviewImage={setPreviewImage}
          optimisticChecks={optimisticChecks}
          savingChecks={savingChecks}
        />

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
          <div style={{ display: 'flex', gap: 4, marginRight: 8, padding: '2px', background: '#F2F2F7', borderRadius: 8 }}>
            {[
              { label: 'Aujourd\'hui', val: 'today' },
              { label: 'Hier', val: 'yesterday' },
              { label: '3J', val: '3days' },
              { label: 'Tout', val: 'all' }
            ].map(d => (
              <button
                key={d.val}
                onClick={() => {
                  const now = new Date();
                  const today = now.toISOString().split('T')[0];
                  if (d.val === 'today') { setDateFrom(today); setDateTo(today); }
                  else if (d.val === 'yesterday') {
                    const yest = new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];
                    setDateFrom(yest); setDateTo(yest);
                  }
                  else if (d.val === '3days') {
                    const three = new Date(now.setDate(now.getDate() - 2)).toISOString().split('T')[0];
                    setDateFrom(three); setDateTo(today);
                  }
                  else { setDateFrom(''); setDateTo(''); }
                }}
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: (d.val === 'today' && dateFrom === new Date().toISOString().split('T')[0] && dateTo === new Date().toISOString().split('T')[0]) || (d.val === 'all' && !dateFrom) ? 'white' : 'transparent',
                  boxShadow: (d.val === 'today' && dateFrom === new Date().toISOString().split('T')[0]) || (d.val === 'all' && !dateFrom) ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
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
                <PackingItem
                  key={o.id}
                  order={o}
                  isMobile={false}
                  productMap={productMap}
                  isSelected={selectedIds.has(o.id)}
                  onToggleSelect={toggleSelect}
                  onSelect={(order) => { setSelectedOrder(order); setPackingNote(''); }}
                  onEditStock={(p) => setEditingVariants({ product: p, variants: p.variants })}
                  onMarkPacking={handleMarkPacking}
                  onPreviewImage={setPreviewImage}
                  onToggleCheckItem={toggleCheckItem}
                  optimisticChecks={optimisticChecks}
                />
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      {/* PACKING DETAIL MODAL (DESKTOP) */}
      {!isMobile && (
        <PackingOrderModal
          order={selectedOrder}
          isMobile={false}
          isPending={isPending}
          productMap={productMap}
          packingNote={packingNote}
          setPackingNote={setPackingNote}
          onClose={() => setSelectedOrder(null)}
          onMarkPacking={handleMarkPacking}
          onProposeAlternative={handleProposeAlternative}
          onEditStock={(p) => setEditingVariants({ product: p, variants: p.variants })}
          onToggleCheckItem={toggleCheckItem}
          onPreviewImage={setPreviewImage}
        />
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
                showToast('Erreur lors de la mise à jour', 'error');
              }
            });
          }}
        />
      )}
    </div>
  );
}


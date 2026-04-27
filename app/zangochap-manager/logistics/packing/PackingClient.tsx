"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import { TableCard, StatusBadge, EmptyState, DetailCard, SectionLabel, LocationBadge } from "@/components/UI";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { updateOrderStatus } from "@/modules/orders/actions";
import { formatPrice, formatDay, STATUS_LABELS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { Eye, Package, Check, ArrowLeftRight, Warehouse } from "lucide-react";
import { addOrderHistoryEntry } from "@/modules/orders/actions";

export default function PackingClient({ initialOrders, products, user }: { initialOrders: any[]; products: any[]; user: any }) {
  const [filter, setFilter] = useState('CONFIRMED');
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
                <tr key={o.id} style={selectedIds.has(o.id) ? { background: 'var(--cream-2)' } : undefined}>
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
                        <button className="action-btn" title="Annuler l'emballage (Erreur)" onClick={() => { if(confirm('Annuler l\'emballage de cette commande ?')) handleMarkPacking(o.id, 'CONFIRMED'); }} style={{ color: 'var(--red)', background: '#FEE2E2' }}>
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

      {/* PACKING DETAIL MODAL */}
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
              <DetailCard key={idx} className={isChecked ? 'checked' : ''} style={{ marginBottom: 12, border: isChecked ? '1px solid var(--green)' : '1px solid var(--line)', transition: 'all 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div
                    onClick={() => toggleCheckItem(selectedOrder.id, idx)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: '2px solid', borderColor: isChecked ? 'var(--green)' : 'var(--line)', background: isChecked ? 'var(--green-soft)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 4 }}
                  >
                    {isChecked && <Check size={18} color="var(--green)" />}
                  </div>

                  <div style={{ width: 60, height: 60, background: 'var(--cream-2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, overflow: 'hidden', border: '1px solid var(--line)' }}>
                    {item.image ? (
                      <img 
                        src={item.image} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} 
                        onClick={() => setPreviewImage(item.image)}
                        alt=""
                      />
                    ) : (
                      item.emoji || '📦'
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'var(--brown-soft)' : 'var(--ink)' }}>{item.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--brown-soft)', marginTop: 4 }}>
                          Taille : <span className="size-dot">{item.size}</span> | Couleur : <strong>{item.color}</strong> | Qté : <strong style={{ color: 'var(--orange)' }}>× {item.qty}</strong>
                        </div>
                      </div>
                      <button
                        className="action-btn"
                        onClick={() => handleProposeAlternative(selectedOrder.id, item.name)}
                        title="Signaler un problème / Alternative"
                      >
                        <ArrowLeftRight size={14} />
                      </button>
                    </div>

                    {/* Alternative Message Display in Modal */}
                    {selectedOrder.history?.filter((h: any) => h.action.includes(`Alternative proposée pour "${item.name}"`)).map((h: any, hi: number) => (
                      <div key={hi} style={{ marginTop: 8, padding: '8px 12px', background: 'var(--orange-soft)', borderLeft: '3px solid var(--orange)', borderRadius: 4, fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                        <div style={{ fontSize: 9, textTransform: 'uppercase', opacity: 0.6, marginBottom: 2 }}>Alternative proposée :</div>
                        {h.action.split(' : ')[1]}
                      </div>
                    ))}

                    {/* LOCALISATION DE LA VARIANTE DEMANDÉE */}
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {p?.variants?.find((v: any) => v.size === item.size && v.color === item.color)?.stockLevels?.map((sl: any) => (
                        <div key={sl.id} style={{ fontSize: 11, background: 'var(--orange-soft)', color: 'var(--orange)', padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Warehouse size={12} />
                          <span>{sl.warehouse.name}</span>
                          {sl.position && <span style={{ fontWeight: 800, color: 'var(--ink)' }}>• {sl.position}</span>}
                        </div>
                      ))}
                    </div>

                    {/* AUTRES VARIANTES DISPONIBLES (SI BESOIN) */}
                    {p && !isChecked && (
                      <div style={{ marginTop: 12, background: 'var(--cream)', padding: '10px 14px', borderRadius: 8, border: '1px dashed var(--line)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brown-soft)', marginBottom: 8, textTransform: 'uppercase' }}>Autres variantes dispo.</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.variants?.filter((v: any) => v.size !== item.size || v.color !== item.color).map((v: any, vi: number) => (
                            <div key={vi} style={{ background: 'white', padding: '4px 8px', borderRadius: 6, fontSize: 11, border: '1px solid var(--line)', display: 'flex', gap: 6, opacity: v.stock > 0 ? 1 : 0.5 }}>
                              <span style={{ opacity: 0.6 }}>{v.size}/{v.color}</span>
                              <strong style={{ color: v.stock === 0 ? 'var(--red)' : 'var(--green)' }}>{v.stock}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DetailCard>
            );
          })}

          <div style={{ marginTop: 20 }}>
            <SectionLabel>Note d'emballage (optionnel)</SectionLabel>
            <textarea
              className="field-input"
              value={packingNote}
              onChange={e => setPackingNote(e.target.value)}
              placeholder="Ex: Emballé dans un sac cadeau, manque la boîte..."
              style={{ minHeight: 80, fontSize: 13 }}
            />
          </div>
        </Modal>
      )}
      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <Modal isOpen={true} onClose={() => setPreviewImage(null)} title="Aperçu de l'article">
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', background: 'var(--cream)', borderRadius: 12, overflow: 'hidden' }}>
            <img src={previewImage} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} alt="Aperçu" />
          </div>
        </Modal>
      )}
    </div>
  );
}

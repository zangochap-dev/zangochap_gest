"use client";

import React, { useState, useTransition, useMemo, useCallback } from 'react';
import { TableCard, StatCard, EmptyState } from '@/components/UI';
import Modal from '@/components/Modal';
import {
  Truck, CheckCircle, Search, ArrowUpRight, User, Banknote,
  Calendar, ChevronDown, ChevronUp, Package, Clock, History,
  Wallet, X, Eye, PhoneCall, CheckCircle2, RotateCcw, Filter, ArrowRight,
  ShoppingBag, Tag, Info
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/constants';
import { createSettlement, toggleCommercialContacted } from '@/modules/orders/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface Props {
  pendingOrders: any[];
  history: any[];
  riderStats: { riders: any[], orders: any[] };
  initialFrom?: string;
  initialTo?: string;
  initialRiderId?: string;
}

export default function SettlementClient({ 
  pendingOrders, 
  history, 
  riderStats,
  initialFrom,
  initialTo,
  initialRiderId 
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedRiderData, setSelectedRiderData] = useState<any | null>(null);
  
  const [from, setFrom] = useState(initialFrom || "");
  const [to, setTo] = useState(initialTo || "");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const handleFilter = (f?: string, t?: string, r?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (f) params.set("from", f); else params.delete("from");
    if (t) params.set("to", t); else params.delete("to");
    if (r) params.set("riderId", r); else params.delete("riderId");
    router.push(`?${params.toString()}`);
  };

  const groups = useMemo(() => {
    return riderStats.riders;
  }, [riderStats]);

  const totalGrandTotal = useMemo(() =>
    riderStats.riders.reduce((s, r) => s + r.totalGrandTotal, 0),
  [riderStats]);

  const totalProducts = useMemo(() =>
    riderStats.riders.reduce((s, r) => s + r.totalProducts, 0),
  [riderStats]);

  const totalDeliveryFees = useMemo(() =>
    riderStats.riders.reduce((s, r) => s + r.totalDeliveryFees, 0),
  [riderStats]);

  const handleSettle = useCallback((dId: string, orders: any[]) => {
    const deliverableOrders = orders.filter(o => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.status));
    if (deliverableOrders.length === 0) {
      showToast("Aucune commande livrée à régler pour ce livreur.", "default");
      return;
    }

    const total = deliverableOrders.reduce((s: number, o: any) => s + (o.total + o.deliveryFee - (o.discount || 0)), 0);
    const name = orders[0]?.deliverymanName || "Livreur";
    
    if (!confirm(`Valider l'encaissement de ${formatPrice(total)} de ${name} ?`)) return;
    
    startTransition(async () => {
      try {
        await createSettlement(dId, deliverableOrders.map(o => o.id), total);
        showToast(`Règlement de ${name} validé ✓`, 'success');
        setSelectedRiderData(null);
        router.refresh();
      } catch (e: any) { showToast(e.message || "Erreur", 'error'); }
    });
  }, [router, showToast]);

  const handleToggleContacted = (orderId: string, current: boolean) => {
    startTransition(async () => {
      try {
        await toggleCommercialContacted(orderId, !current);
        showToast("Statut mis à jour", "success");
        // Update local state if modal is open
        if (selectedRiderData) {
          const updatedOrders = selectedRiderData.orders.map((o: any) => 
            o.id === orderId ? { ...o, isCommercialContacted: !current } : o
          );
          setSelectedRiderData({ ...selectedRiderData, orders: updatedOrders });
        }
        router.refresh();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
  };

  const openRiderDetails = (rider: any) => {
    setSelectedRiderData(rider);
  };

  return (
    <div className="content animate-fade-in">
      {/* STATS */}
      <div className="stats-grid">
        <StatCard label="Montant Global" value={formatPrice(totalGrandTotal)} icon={<Wallet size={20} />} accent />
        <StatCard label="Total Produits" value={formatPrice(totalProducts)} icon={<ShoppingBag size={20} />} color="var(--orange)" />
        <StatCard label="Total Livraison" value={formatPrice(totalDeliveryFees)} icon={<Truck size={20} />} color="var(--blue)" />
        <StatCard label="Livreurs" value={groups.length} icon={<User size={20} />} color="var(--ink)" />
      </div>

      {/* FILTERS & TABS */}
      <div className="filters-container">
        <div className="filters-bar">
          <button
            className={`filter-chip ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Banknote size={14} /> Règlements en cours
          </button>
          <button
            className={`filter-chip ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={14} /> Historique détaillé
          </button>
        </div>

        <div className="date-filters">
          <div className="date-input-group">
            <Calendar size={14} />
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <ArrowRight size={14} className="range-sep" />
          <div className="date-input-group">
            <Calendar size={14} />
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="apply-btn-sm" onClick={() => handleFilter(from, to, initialRiderId)}>
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* === PENDING TAB === */}
      {activeTab === "pending" && (
        <div className="settle-grid">
          {groups.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState icon="✅" title="Aucune donnée" description="Sélectionnez une période ou attendez de nouvelles livraisons." />
            </div>
          ) : groups.map((d: any) => {
            const initials = d.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            const uncontactedReturns = d.orders.filter((o: any) => ['RETURNED', 'CANCELLED'].includes(o.status) && !o.isCommercialContacted);
            
            return (
              <div key={d.id} className={`settle-card-simple ${uncontactedReturns.length > 0 ? 'has-warning' : ''}`}>
                {uncontactedReturns.length > 0 && (
                  <div className="warning-banner">
                    <PhoneCall size={12} /> {uncontactedReturns.length} retour(s) non validé(s) par le bureau
                  </div>
                )}
                <div className="settle-card-top">
                  <div className="settle-avatar">{initials}</div>
                  <div className="settle-info">
                    <div className="cell-strong">{d.name}</div>
                    <div className="cell-muted">{d.orders.length} mission(s)</div>
                  </div>
                  <button className="btn-icon-only" onClick={() => openRiderDetails(d)}>
                    <Eye size={18} />
                  </button>
                </div>

                <div className="settle-amounts-row-simple" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div className="simple-amount">
                    <span className="label">GLOBAL</span>
                    <span className="val" style={{ fontWeight: 900 }}>{formatPrice(d.totalGrandTotal)}</span>
                  </div>
                  <div className="simple-amount">
                    <span className="label">PRODUITS</span>
                    <span className="val">{formatPrice(d.totalProducts)}</span>
                  </div>
                  <div className="simple-amount">
                    <span className="label">LIVRAISON</span>
                    <span className="val" style={{ color: 'var(--blue)' }}>{formatPrice(d.totalDeliveryFees)}</span>
                  </div>
                </div>

                <div className="settle-cta">
                  <button
                    className="btn-orange"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleSettle(d.id, d.orders)}
                    disabled={isPending || d.totalGrandTotal === 0}
                  >
                    Valider le règlement
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* === HISTORY TAB === */}
      {activeTab === "history" && (
        <TableCard title="Historique détaillé des règlements" meta={`${history.length} règlement(s)`}>
          {history.length === 0 ? (
            <EmptyState icon="📋" title="Aucun historique" description="Les règlements validés apparaîtront ici." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Livreur</th>
                  <th>Commandes</th>
                  <th>Montant Total</th>
                  <th>Produits</th>
                  <th>Livraison</th>
                  <th>Validé par</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s: any) => (
                  <tr key={s.id}>
                    <td><div className="cell-strong">{s.deliveryman?.name || "—"}</div></td>
                    <td><span className="source-badge">{s.ordersCount} cmd</span></td>
                    <td><div className="cell-price">{formatPrice(s.amount)}</div></td>
                    <td><div className="cell-price" style={{ color: 'var(--orange)', fontSize: '13px' }}>{formatPrice(s.productsAmount || 0)}</div></td>
                    <td><div className="cell-price" style={{ color: 'var(--blue)', fontSize: '13px' }}>{formatPrice(s.deliveryFeesAmount || 0)}</div></td>
                    <td><div className="cell-muted">{s.by}</div></td>
                    <td><div className="cell-muted">{formatDate(s.createdAt)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableCard>
      )}

      {/* === DETAILS MODAL === */}
      <Modal 
        isOpen={!!selectedRiderData} 
        onClose={() => setSelectedRiderData(null)}
        title={`Détails : ${selectedRiderData?.name}`}
        large
      >
        {selectedRiderData && (
          <div className="modal-rider-details">
            <div className="modal-summary-grid">
              <div className="modal-summary-card">
                <span className="label">Montant Global</span>
                <span className="value">{formatPrice(selectedRiderData.totalGrandTotal)}</span>
              </div>
              <div className="modal-summary-card">
                <span className="label">Produits</span>
                <span className="value" style={{ color: 'var(--orange)' }}>{formatPrice(selectedRiderData.totalProducts)}</span>
              </div>
              <div className="modal-summary-card">
                <span className="label">Frais Livraison</span>
                <span className="value" style={{ color: 'var(--blue)' }}>{formatPrice(selectedRiderData.totalDeliveryFees)}</span>
              </div>
            </div>

            <div className="modal-sections">
              <div className="modal-section">
                <h4 className="section-title"><Truck size={16} /> Livraisons ({selectedRiderData.orders.filter((o: any) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.status)).length})</h4>
                <div className="modal-order-list">
                  {selectedRiderData.orders.filter((o: any) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.status)).map((o: any) => (
                    <div key={o.id} className="modal-order-row">
                      <div className="order-info">
                        <span className="ref">#{o.ref?.split("-").pop()}</span>
                        <span className="cust">{o.customerName}</span>
                        <div className="meta">{o.paymentMethod} • Livraison: {formatPrice(o.deliveryFee)}</div>
                      </div>
                      <div className="order-price">
                        <div className="total">{formatPrice(o.total + o.deliveryFee - (o.discount || 0))}</div>
                        <div className="prod">Prod: {formatPrice(o.total - (o.discount || 0))}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-section">
                <h4 className="section-title"><RotateCcw size={16} /> Retours ({selectedRiderData.orders.filter((o: any) => ['RETURNED', 'CANCELLED'].includes(o.status)).length})</h4>
                <div className="modal-returned-list">
                  {selectedRiderData.orders.filter((o: any) => ['RETURNED', 'CANCELLED'].includes(o.status)).map((o: any) => (
                    <div key={o.id} className="modal-returned-card">
                      <div className="card-header">
                        <span className="ref">#{o.ref?.split("-").pop()}</span>
                        <button 
                          className={`contact-toggle ${o.isCommercialContacted ? 'active' : ''}`}
                          onClick={() => handleToggleContacted(o.id, o.isCommercialContacted)}
                          disabled={isPending}
                        >
                          {o.isCommercialContacted ? <CheckCircle2 size={12} /> : <PhoneCall size={12} />}
                          {o.isCommercialContacted ? 'Contacté' : 'Marquer Contacté'}
                        </button>
                      </div>
                      <div className="card-reason">
                        <Info size={12} />
                        <span><strong>Motif:</strong> {o.returnReason || "Non spécifié"}</span>
                      </div>
                    </div>
                  ))}
                  {selectedRiderData.orders.filter((o: any) => ['RETURNED', 'CANCELLED'].includes(o.status)).length === 0 && (
                    <div className="empty-mini">Aucun retour pour cette période.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .filters-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .date-filters { display: flex; align-items: center; gap: 10px; background: white; padding: 6px 12px; border-radius: 12px; border: 1px solid var(--line); }
        .date-input-group { display: flex; align-items: center; gap: 6px; color: var(--brown-soft); }
        .date-input-group input { border: none; outline: none; font-size: 12px; font-weight: 600; color: var(--ink); background: transparent; }
        .apply-btn-sm { width: 32px; height: 32px; border-radius: 8px; background: var(--ink); color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .settle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .settle-card-simple { background: white; border-radius: 16px; border: 1px solid var(--line); padding: 16px; transition: all 0.2s; position: relative; overflow: hidden; }
        .settle-card-simple.has-warning { border-color: var(--orange); }
        .warning-banner { background: var(--orange); color: white; font-size: 9px; font-weight: 800; text-align: center; padding: 4px; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; justify-content: center; gap: 6px; margin: -16px -16px 12px -16px; }
        .settle-card-simple:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .settle-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; position: relative; }
        .btn-icon-only { position: absolute; right: 0; top: 0; width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--line); background: var(--cream); color: var(--brown-soft); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .settle-avatar { width: 40px; height: 40px; border-radius: 10px; background: var(--orange-soft); color: var(--orange); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
        .settle-amounts-row-simple { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px; background: var(--cream); border-radius: 12px; margin-bottom: 16px; }
        .simple-amount { display: flex; flex-direction: column; gap: 2px; }
        .simple-amount .label { font-size: 8px; font-weight: 800; color: var(--brown-soft); text-transform: uppercase; }
        .simple-amount .val { font-size: 14px; font-weight: 900; color: var(--ink); }
        .settle-cta { border-top: 1px dashed var(--line); pt: 16px; }

        /* Modal Styles */
        .modal-rider-details { display: flex; flex-direction: column; gap: 24px; }
        .modal-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .modal-summary-card { background: var(--cream); padding: 16px; border-radius: 16px; border: 1px solid var(--line); display: flex; flex-direction: column; gap: 4px; }
        .modal-summary-card .label { font-size: 11px; font-weight: 700; color: var(--brown-soft); }
        .modal-summary-card .value { font-size: 20px; font-weight: 900; color: var(--ink); }

        .modal-sections { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
        .section-title { font-size: 14px; font-weight: 800; color: var(--ink); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .modal-order-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 8px; }
        .modal-order-row { padding: 12px; border-radius: 12px; border: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; }
        .modal-order-row:hover { background: var(--cream-2); }
        .order-info { display: flex; flex-direction: column; }
        .order-info .ref { font-weight: 800; font-size: 13px; color: var(--orange); }
        .order-info .cust { font-weight: 700; font-size: 13px; color: var(--ink); }
        .order-info .meta { font-size: 10px; color: var(--brown-soft); }
        .order-price { text-align: right; }
        .order-price .total { font-weight: 800; font-size: 14px; color: var(--ink); }
        .order-price .prod { font-size: 11px; color: var(--blue); font-weight: 600; }

        .modal-returned-list { display: flex; flex-direction: column; gap: 12px; }
        .modal-returned-card { padding: 12px; border-radius: 12px; background: var(--red-soft); border: 1px solid rgba(255,0,0,0.1); }
        .modal-returned-card .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .modal-returned-card .ref { font-weight: 800; font-size: 13px; }
        .contact-toggle { padding: 6px 10px; border-radius: 8px; font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 6px; border: 1px solid var(--line); background: white; cursor: pointer; transition: all 0.2s; }
        .contact-toggle.active { background: var(--green); color: white; border-color: var(--green); }
        .card-reason { font-size: 12px; color: var(--brown); display: flex; gap: 8px; line-height: 1.4; }
        .empty-mini { padding: 20px; text-align: center; color: var(--brown-soft); font-size: 13px; font-style: italic; background: var(--cream); border-radius: 12px; }

        @media (max-width: 900px) {
          .modal-sections { grid-template-columns: 1fr; }
          .modal-summary-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

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
import { createSettlement, toggleCommercialContacted } from "@/modules/orders/actions";
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import "./settlement-client.css";

function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

  const today = localDateInputValue();
  const filterToday = () => {
    setFrom(today);
    setTo(today);
    handleFilter(today, today, initialRiderId);
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
          <button
            type="button"
            className={`filter-chip today-chip ${from === today && to === today ? "active" : ""}`}
            onClick={filterToday}
          >
            Aujourd&apos;hui
          </button>
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


    </div>
  );
}

"use client";

import React, { useState, useTransition, useMemo, useCallback } from 'react';
import { StatCard, EmptyState } from '@/components/UI';
import Modal from '@/components/Modal';
import {
  Truck, Search, ArrowUpRight, User, Banknote,
  Calendar, ChevronDown, History,
  Wallet, X, Eye, PhoneCall, CheckCircle2, RotateCcw, Filter,
  ShoppingBag, Info
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

type SettlementOrder = {
  id: string;
  ref?: string | null;
  customerName?: string | null;
  total?: number | null;
  deliveryFee?: number | null;
  discount?: number | null;
  amountReceived?: number | null;
  paymentMethod?: string | null;
  status?: string;
  returnReason?: string | null;
  isCommercialContacted?: boolean;
  deliverymanName?: string | null;
};

type RiderSettlementGroup = {
  id: string;
  name: string;
  orders: SettlementOrder[];
  totalDeliveryFees: number;
  totalProducts: number;
  totalGrandTotal: number;
  totalCashToCollect: number;
  returnedCount: number;
};

type SettlementHistory = {
  id: string;
  deliverymanId?: string | null;
  amount: number;
  productsAmount?: number | null;
  deliveryFeesAmount?: number | null;
  ordersCount: number;
  status: string;
  notes?: string | null;
  by?: string | null;
  createdAt: string | Date;
  deliveryman?: { name: string | null } | null;
  orders?: SettlementOrder[];
};

type HistoryDayGroup = {
  key: string;
  label: string;
  total: number;
  products: number;
  fees: number;
  count: number;
  rows: SettlementHistory[];
  timestamp: number;
};

interface Props {
  pendingOrders: SettlementOrder[];
  history: SettlementHistory[];
  riderStats: { riders: RiderSettlementGroup[], orders: SettlementOrder[] };
  initialFrom?: string;
  initialTo?: string;
  initialRiderId?: string;
}

export default function SettlementClient({
  history,
  riderStats,
  initialFrom,
  initialTo,
  initialRiderId
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedRiderData, setSelectedRiderData] = useState<RiderSettlementGroup | null>(null);

  const [from, setFrom] = useState(initialFrom || "");
  const [to, setTo] = useState(initialTo || "");
  const [riderId, setRiderId] = useState(initialRiderId || "");

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
    handleFilter(today, today, riderId);
  };

  const applyFixedDate = (date: string) => {
    setFrom(date);
    setTo(date);
    handleFilter(date, date, riderId);
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setRiderId("");
    setSearch("");
    setHistorySearch("");
    handleFilter("", "", "");
  };

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return riderStats.riders;
    return riderStats.riders.filter((rider) => {
      const orderText = rider.orders
        .map((order) => [order.ref, order.customerName, order.status, order.returnReason].filter(Boolean).join(" "))
        .join(" ");
      return `${rider.name} ${orderText}`.toLowerCase().includes(query);
    });
  }, [riderStats, search]);

  const riderOptions = useMemo(() => {
    const map = new Map<string, string>();
    riderStats.riders.forEach((rider) => map.set(rider.id, rider.name));
    history.forEach((settlement) => {
      if (settlement.deliverymanId) {
        map.set(settlement.deliverymanId, settlement.deliveryman?.name || "Livreur");
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [riderStats.riders, history]);

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    return history.filter((settlement) => {
      const matchesRider = !riderId || settlement.deliverymanId === riderId;
      const searchable = [
        settlement.deliveryman?.name,
        settlement.by,
        settlement.notes,
        ...(settlement.orders || []).map((order) => `${order.ref} ${order.customerName}`),
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesRider && (!query || searchable.includes(query));
    });
  }, [history, historySearch, riderId]);

  const historyGroups = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const byDate = filteredHistory.reduce<Record<string, Omit<HistoryDayGroup, "key">>>((acc, settlement) => {
      const date = new Date(settlement.createdAt);
      const key = date.toISOString().slice(0, 10);
      if (!acc[key]) {
        acc[key] = {
          label: formatter.format(date),
          total: 0,
          products: 0,
          fees: 0,
          count: 0,
          rows: [],
          timestamp: date.getTime(),
        };
      }
      acc[key].rows.push(settlement);
      acc[key].total += Number(settlement.amount || 0);
      acc[key].products += Number(settlement.productsAmount || 0);
      acc[key].fees += Number(settlement.deliveryFeesAmount || 0);
      acc[key].count += Number(settlement.ordersCount || 0);
      return acc;
    }, {});

    return Object.entries(byDate)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .map(([key, value]) => ({ key, ...value }));
  }, [filteredHistory]);

  const totalGrandTotal = useMemo(() =>
    groups.reduce((s, r) => s + r.totalGrandTotal, 0),
    [groups]);

  const totalProducts = useMemo(() =>
    groups.reduce((s, r) => s + r.totalProducts, 0),
    [groups]);

  const totalDeliveryFees = useMemo(() =>
    groups.reduce((s, r) => s + r.totalDeliveryFees, 0),
    [groups]);

  const handleSettle = useCallback((dId: string, orders: SettlementOrder[]) => {
    const deliverableOrders = orders.filter(o => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(String(o.status)));
    if (deliverableOrders.length === 0) {
      showToast("Aucune commande livrée à régler pour ce livreur.", "default");
      return;
    }

    const total = deliverableOrders.reduce((s, o) => s + (o.amountReceived ?? ((o.total || 0) + (o.deliveryFee || 0) - (o.discount || 0))), 0);
    const name = orders[0]?.deliverymanName || "Livreur";

    if (!confirm(`Valider l'encaissement de ${formatPrice(total)} de ${name} ?`)) return;

    startTransition(async () => {
      try {
        await createSettlement(dId, deliverableOrders.map(o => o.id), total);
        showToast(`Règlement de ${name} validé ✓`, 'success');
        setSelectedRiderData(null);
        router.refresh();
      } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Erreur", 'error'); }
    });
  }, [router, showToast]);

  const handleToggleContacted = (orderId: string, current: boolean) => {
    startTransition(async () => {
      try {
        await toggleCommercialContacted(orderId, !current);
        showToast("Statut mis à jour", "success");
        // Update local state if modal is open
        if (selectedRiderData) {
          const updatedOrders = selectedRiderData.orders.map((o) =>
            o.id === orderId ? { ...o, isCommercialContacted: !current } : o
          );
          setSelectedRiderData({ ...selectedRiderData, orders: updatedOrders });
        }
        router.refresh();
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : "Erreur", "error");
      }
    });
  };

  const openRiderDetails = (rider: RiderSettlementGroup) => {
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
      <div className="settlement-filter-panel">
        <div className="settlement-filter-head">
          <div>
            <div className="settlement-filter-title"><Filter size={15} /> Filtres livreurs</div>
            <p>{groups.length} livreur(s), {riderStats.orders.length} livraison(s) sur la période</p>
          </div>
          <button type="button" className="settlement-reset-btn" onClick={clearFilters}>
            <X size={14} /> Réinitialiser
          </button>
        </div>

        <div className="settlement-tabs">
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

        <div className="settlement-filter-grid">
          <label className="settlement-search">
            <Search size={15} />
            <input
              value={activeTab === "history" ? historySearch : search}
              onChange={(event) => activeTab === "history" ? setHistorySearch(event.target.value) : setSearch(event.target.value)}
              placeholder={activeTab === "history" ? "Rechercher règlement, livreur, commande..." : "Rechercher livreur, client, référence..."}
            />
            {(activeTab === "history" ? historySearch : search) && (
              <button type="button" onClick={() => activeTab === "history" ? setHistorySearch("") : setSearch("")}>
                <X size={13} />
              </button>
            )}
          </label>

          <label className="settlement-select">
            <Truck size={15} />
            <select
              value={riderId}
              onChange={(event) => {
                setRiderId(event.target.value);
                handleFilter(from, to, event.target.value);
              }}
            >
              <option value="">Tous les livreurs</option>
              {riderOptions.map((rider) => (
                <option key={rider.id} value={rider.id}>{rider.name}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>
        </div>

        <div className="date-filters">
          <button
            type="button"
            className={`filter-chip today-chip ${from === today && to === today ? "active" : ""}`}
            onClick={filterToday}
          >
            Aujourd&apos;hui
          </button>
          <div className="date-input-group fixed-date-input">
            <Calendar size={14} />
            <span>Date fixe</span>
            <input
              type="date"
              value={from || to || ""}
              onChange={e => {
                setFrom(e.target.value);
                setTo(e.target.value);
              }}
            />
          </div>
          <button className="apply-btn-sm" onClick={() => applyFixedDate(from || to || today)}>
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* === PENDING TAB === */}
      {activeTab === "pending" && (
        <div className="settle-grid">
          {groups.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState icon="OK" title="Aucune donnée" description="Sélectionnez une période ou attendez de nouvelles livraisons." />
            </div>
          ) : groups.map((d) => {
            const initials = d.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            const uncontactedReturns = d.orders.filter((o) => ['RETURNED', 'CANCELLED'].includes(String(o.status)) && !o.isCommercialContacted);

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
        <div className="settlement-history">
          {historyGroups.length === 0 ? (
            <div className="settlement-empty">
              <EmptyState icon="DOC" title="Aucun historique" description="Aucun règlement ne correspond aux filtres." />
            </div>
          ) : (
            historyGroups.map((group) => (
              <section key={group.key} className="history-day-group">
                <div className="history-day-head">
                  <div>
                    <div className="history-day-title">
                      <Calendar size={15} />
                      {group.label}
                    </div>
                    <p>{group.rows.length} règlement(s), {group.count} commande(s)</p>
                  </div>
                  <div className="history-day-total">
                    <span>Total</span>
                    <strong>{formatPrice(group.total)}</strong>
                  </div>
                </div>

                <div className="history-day-metrics">
                  <div><span>Produits</span><strong>{formatPrice(group.products)}</strong></div>
                  <div><span>Livraison</span><strong>{formatPrice(group.fees)}</strong></div>
                  <div><span>Livreurs</span><strong>{new Set(group.rows.map((row) => row.deliverymanId)).size}</strong></div>
                </div>

                <div className="history-list">
                  {group.rows.map((s) => (
                    <article key={s.id} className="history-settlement-card">
                      <div className="history-settlement-main">
                        <div className="history-rider-avatar">
                          {(s.deliveryman?.name || "L").split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="cell-strong">{s.deliveryman?.name || "Livreur inconnu"}</div>
                          <div className="cell-muted">
                            {s.ordersCount} commande(s) • validé par {s.by || "—"} • {formatDate(s.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="history-money-grid">
                        <div>
                          <span>Global</span>
                          <strong>{formatPrice(s.amount)}</strong>
                        </div>
                        <div>
                          <span>Produits</span>
                          <strong>{formatPrice(s.productsAmount || 0)}</strong>
                        </div>
                        <div>
                          <span>Livraison</span>
                          <strong>{formatPrice(s.deliveryFeesAmount || 0)}</strong>
                        </div>
                      </div>

                      {(s.orders || []).length > 0 && (
                        <div className="history-order-strip">
                          {(s.orders || []).slice(0, 4).map((order) => (
                            <span key={order.id}>#{order.ref?.split("-").pop() || order.ref} · {order.customerName}</span>
                          ))}
                          {(s.orders || []).length > 4 && <span>+{(s.orders || []).length - 4} autre(s)</span>}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
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
                <h4 className="section-title"><Truck size={16} /> Livraisons ({selectedRiderData.orders.filter((o) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(String(o.status))).length})</h4>
                <div className="modal-order-list">
                  {selectedRiderData.orders.filter((o) => ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(String(o.status))).map((o) => (
                    <div key={o.id} className="modal-order-row">
                      <div className="order-info">
                        <span className="ref">#{o.ref?.split("-").pop()}</span>
                        <span className="cust">{o.customerName}</span>
                        <div className="meta">{o.paymentMethod} • Livraison: {formatPrice(o.deliveryFee)}</div>
                      </div>
                      <div className="order-price">
                        <div className="total">{formatPrice(o.amountReceived ?? ((o.total || 0) + (o.deliveryFee || 0) - (o.discount || 0)))}</div>
                        <div className="prod">Prod: {formatPrice((o.total || 0) - (o.discount || 0))}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-section">
                <h4 className="section-title"><RotateCcw size={16} /> Retours ({selectedRiderData.orders.filter((o) => ['RETURNED', 'CANCELLED'].includes(String(o.status))).length})</h4>
                <div className="modal-returned-list">
                  {selectedRiderData.orders.filter((o) => ['RETURNED', 'CANCELLED'].includes(String(o.status))).map((o) => (
                    <div key={o.id} className="modal-returned-card">
                      <div className="card-header">
                        <span className="ref">#{o.ref?.split("-").pop()}</span>
                        <button
                          className={`contact-toggle ${o.isCommercialContacted ? 'active' : ''}`}
                          onClick={() => handleToggleContacted(o.id, Boolean(o.isCommercialContacted))}
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
                  {selectedRiderData.orders.filter((o) => ['RETURNED', 'CANCELLED'].includes(String(o.status))).length === 0 && (
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



"use client";

import React, { useState, useTransition } from "react";
import "./settlements.css";
import { TableCard, EmptyState } from "@/components/UI";
import { CreditCard, Calendar, Filter, Wallet, ArrowRight, User, ShoppingBag, Truck, CheckCircle2, PhoneCall, Info } from "lucide-react";
import { formatPrice, formatDay } from "@/lib/constants";
import { useRouter, useSearchParams } from "next/navigation";
import { toggleCommercialContacted } from "@/modules/orders/actions";
import { useToast } from "@/components/Toast";

interface SettlementStat {
  method: string;
  count: number;
  total: number;
}

interface SettlementOrder {
  id: string;
  ref: string;
  total: number;
  deliveryFee: number;
  discount: number;
  paymentMethod: string | null;
  customerName: string;
  createdAt: string;
  updatedAt?: string;
  commercialName: string | null;
  status: string;
  returnReason?: string | null;
  isCommercialContacted?: boolean;
}

interface RiderStat {
  id: string;
  name: string;
  orders: SettlementOrder[];
  totalDeliveryFees: number;
  totalCashToCollect: number;
  returnedCount: number;
}

export default function SettlementsClient({ 
  initialStats, 
  initialRiderStats,
  initialFrom, 
  initialTo,
  commercials,
  riders,
  initialCommercialId,
  initialMethod,
  initialRiderId,
  initialTab
}: { 
  initialStats: { methods: SettlementStat[], orders: SettlementOrder[] },
  initialRiderStats: { riders: RiderStat[], orders: SettlementOrder[] },
  initialFrom?: string,
  initialTo?: string,
  commercials: any[],
  riders: any[],
  initialCommercialId?: string,
  initialMethod?: string,
  initialRiderId?: string,
  initialTab: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [from, setFrom] = useState(initialFrom || "");
  const [to, setTo] = useState(initialTo || "");
  const [commercialId, setCommercialId] = useState(initialCommercialId || "");
  const [method, setMethod] = useState(initialMethod || "");
  const [riderId, setRiderId] = useState(initialRiderId || "");
  const handleFilter = (f?: string, t?: string, c?: string, m?: string, r?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (f) params.set("from", f); else params.delete("from");
    if (t) params.set("to", t); else params.delete("to");
    if (c) params.set("commercialId", c); else params.delete("commercialId");
    if (m) params.set("method", m); else params.delete("method");
    if (r) params.set("riderId", r); else params.delete("riderId");
    router.push(`?${params.toString()}`);
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFrom(today);
    setTo(today);
    handleFilter(today, today, commercialId, method, riderId);
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];
    setFrom(yesterday);
    setTo(yesterday);
    handleFilter(yesterday, yesterday, commercialId, method, riderId);
  };

  const handleToggleContacted = (orderId: string, current: boolean) => {
    startTransition(async () => {
      try {
        await toggleCommercialContacted(orderId, !current);
        showToast("Statut mis à jour", "success");
        router.refresh();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
  };

  const grandTotal = initialStats.methods.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="settlements-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Règlements & Encaissements</h1>
          <p>Gestion des comptes opérateurs et règlements livreurs</p>
        </div>
          <button 
            className={`tab-btn active`}
          >
            <CreditCard size={16} /> Comptes Opérateurs
          </button>
          <a 
            href="/zangochap-manager/admin/delivery/settlement"
            className="tab-btn"
            style={{ textDecoration: 'none' }}
          >
            <Truck size={16} /> Règlements Livreurs (Nouveau)
          </a>
      </div>

      <div className="filters-card">
        <div className="filters-top">
          <div className="quick-filters">
            <button className={`filter-btn ${!from && !to ? 'active' : ''}`} onClick={() => { setFrom(""); setTo(""); handleFilter("", "", commercialId, method, riderId); }}>Tout</button>
            <button className={`filter-btn ${from === new Date().toISOString().split('T')[0] ? 'active' : ''}`} onClick={setToday}>Aujourd'hui</button>
            <button className={`filter-btn`} onClick={setYesterday}>Hier</button>
          </div>

          <div className="filter-group-alt">
            <div className="select-wrap">
              <User size={14} className="select-icon" />
              <select className="directory-select-sm" value={commercialId} onChange={e => { setCommercialId(e.target.value); handleFilter(from, to, e.target.value, method, riderId); }}>
                <option value="">Tous les commerciaux</option>
                {commercials.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="select-wrap">
              <CreditCard size={14} className="select-icon" />
              <select className="directory-select-sm" value={method} onChange={e => { setMethod(e.target.value); handleFilter(from, to, commercialId, e.target.value, riderId); }}>
                <option value="">Tous les opérateurs</option>
                <option value="MTN Money">MTN Money</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Wave">Wave</option>
                <option value="Virement">Virement</option>
                <option value="Cash">Cash (Bureau)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="date-range">
          <div className="date-input-group">
            <Calendar size={16} />
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <ArrowRight size={16} className="range-sep" />
          <div className="date-input-group">
            <Calendar size={16} />
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="apply-btn" onClick={() => handleFilter(from, to, commercialId, method, riderId)}>
            <Filter size={16} /> Appliquer
          </button>
        </div>
      </div>

      <>
          <div className="stats-overview">
            <div className="stat-card total-main">
              <div className="stat-icon-wrap"><Wallet size={24} /></div>
              <div className="stat-content">
                <div className="stat-label">Total Encaissé</div>
                <div className="stat-value">{formatPrice(grandTotal)}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}><CreditCard size={24} /></div>
              <div className="stat-content">
                <div className="stat-label">Transactions</div>
                <div className="stat-value">{initialStats.methods.reduce((sum, s) => sum + s.count, 0)}</div>
              </div>
            </div>
          </div>

          <div className="reports-grid">
            <TableCard title="Récapitulatif par Opérateur">
              {initialStats.methods.length === 0 ? (
                <EmptyState icon="💰" title="Aucune donnée" description="Aucun règlement trouvé." />
              ) : (
                <div className="settlement-list">
                  {initialStats.methods.map((s, idx) => (
                    <div key={idx} className="settlement-row">
                      <div className="method-info">
                        <div className="method-avatar">{s.method.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="method-name">{s.method}</div>
                          <div className="method-count">{s.count} transaction(s)</div>
                        </div>
                      </div>
                      <div className="method-total">
                        <div className="amount">{formatPrice(s.total)}</div>
                        <div className="percentage">{grandTotal > 0 ? Math.round((s.total / grandTotal) * 100) : 0}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TableCard>

            <TableCard title="Détail des Commandes">
              {initialStats.orders.length === 0 ? (
                <EmptyState icon="📦" title="Aucune commande" description="Sélectionnez d'autres filtres." />
              ) : (
                <div className="order-list-mini">
                  {initialStats.orders.map((o) => (
                    <div key={o.id} className="order-row-mini">
                      <div className="order-ref-wrap">
                        <div className="order-ref">{o.ref}</div>
                        <div className="order-date">{formatDay(o.createdAt)}</div>
                      </div>
                      <div className="order-cust">
                        <div className="cust-name">{o.customerName}</div>
                        <div className="cust-comm">{o.commercialName || '—'}</div>
                      </div>
                      <div className="order-pay">
                        <div className="pay-method">{o.paymentMethod}</div>
                        <div className="pay-amount">{formatPrice(Number(o.total || 0) + Number(o.deliveryFee || 0) - Number(o.discount || 0))}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TableCard>
          </div>
      </>

    </div>
  );
}

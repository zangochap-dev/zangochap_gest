"use client";

import React, { useState, useTransition } from "react";
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

      <style jsx>{`
        .settlements-container { padding: 24px; max-width: 1300px; margin: 0 auto; }
        .page-header { margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
        .page-header h1 { font-size: 28px; font-weight: 800; color: var(--ink); margin-bottom: 4px; }
        .page-header p { color: var(--brown-soft); font-weight: 500; }

        .tab-switcher { display: flex; background: var(--cream); padding: 4px; border-radius: 12px; border: 1px solid var(--line); }
        .tab-btn { padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 700; color: var(--brown-soft); border: none; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .tab-btn.active { background: white; color: var(--ink); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

        .filters-card { background: white; border-radius: 16px; padding: 24px; border: 1.5px solid var(--line); margin-bottom: 24px; display: flex; flex-direction: column; gap: 20px; }
        .filters-top { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
        
        .quick-filters { display: flex; gap: 10px; }
        .filter-btn { padding: 8px 16px; border-radius: 10px; background: var(--cream); border: 1px solid var(--line); font-size: 13px; font-weight: 700; color: var(--brown); cursor: pointer; transition: all 0.2s; }
        .filter-btn.active { background: var(--orange); color: white; border-color: var(--orange); }

        .filter-group-alt { display: flex; gap: 12px; }
        .select-wrap { position: relative; }
        .select-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--brown-soft); pointer-events: none; }
        .directory-select-sm { padding: 10px 12px 10px 36px; border-radius: 10px; border: 1px solid var(--line); background: white; font-size: 13px; font-weight: 700; color: var(--ink); cursor: pointer; min-width: 200px; appearance: none; background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B4F3B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px; }

        .date-range { display: flex; align-items: center; gap: 12px; border-top: 1px solid var(--line); padding-top: 20px; }
        .date-input-group { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: white; border: 1px solid var(--line); border-radius: 10px; }
        .date-input-group input { border: none; outline: none; font-size: 13px; font-weight: 600; }
        .apply-btn { padding: 10px 20px; border-radius: 10px; background: var(--ink); color: white; border: none; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; }

        .stats-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .stat-card { background: white; border-radius: 16px; padding: 24px; border: 1.5px solid var(--line); display: flex; align-items: center; gap: 20px; }
        .total-main { background: var(--orange); border-color: var(--orange); color: white; }
        .stat-icon-wrap { width: 56px; height: 56px; border-radius: 14px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }
        .stat-value { font-size: 24px; font-weight: 900; }

        .reports-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; align-items: start; }

        .settlement-row { padding: 16px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; }
        .method-info { display: flex; align-items: center; gap: 12px; }
        .method-avatar { width: 40px; height: 40px; border-radius: 10px; background: var(--cream-2); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--orange); }
        .amount { font-size: 16px; font-weight: 800; text-align: right; }

        .order-list-mini { display: flex; flex-direction: column; }
        .order-row-mini { padding: 14px 16px; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: 1fr 2fr 1.5fr; gap: 16px; align-items: center; }
        .order-ref { font-weight: 800; color: var(--ink); font-size: 13px; }
        .order-date { font-size: 11px; color: var(--brown-soft); }
        .cust-name { font-weight: 700; font-size: 13px; }
        .cust-comm { font-size: 11px; color: var(--orange); font-weight: 600; }
        .pay-method { font-size: 11px; font-weight: 800; color: var(--blue); }
        .pay-amount { font-weight: 800; font-size: 14px; }

        /* Rider Settlement Styles */
        .rider-settlements-layout { display: grid; grid-template-columns: 320px 1fr; gap: 24px; }
        .rider-list { display: flex; flex-direction: column; }
        .rider-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--line); background: transparent; border-left: 3px solid transparent; text-align: left; cursor: pointer; transition: all 0.2s; position: relative; }
        .rider-item:hover { background: var(--cream); }
        .rider-item.active { background: var(--cream-2); border-left-color: var(--orange); }
        .rider-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--orange-soft); color: var(--orange); display: flex; align-items: center; justify-content: center; font-weight: 800; }
        .rider-name { font-weight: 700; color: var(--ink); font-size: 14px; }
        .rider-total { font-weight: 800; color: var(--brown-soft); font-size: 12px; }
        .returned-badge { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: var(--red); color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 10px; }
        .no-riders { padding: 24px; text-align: center; color: var(--brown-soft); font-size: 13px; font-style: italic; }

        .rider-detail-view { background: white; border-radius: 16px; border: 1.5px solid var(--line); overflow: hidden; }
        .detail-header { padding: 24px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; background: var(--cream); }
        .detail-header h2 { font-size: 20px; font-weight: 800; color: var(--ink); }
        .detail-summary-pills { display: flex; gap: 12px; }
        .summary-pill { padding: 10px 16px; border-radius: 12px; border: 1px solid var(--line); min-width: 160px; }
        .summary-pill.orange { background: white; border-color: var(--orange); }
        .summary-pill.blue { background: white; border-color: var(--blue); }
        .pill-label { font-size: 11px; font-weight: 700; color: var(--brown-soft); margin-bottom: 2px; }
        .pill-value { font-size: 18px; font-weight: 900; }
        .orange .pill-value { color: var(--orange); }
        .blue .pill-value { color: var(--blue); }

        .detail-sections { padding: 24px; display: flex; flex-direction: column; gap: 32px; }
        .detail-section h3 { font-size: 16px; font-weight: 800; color: var(--ink); display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .order-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        .mini-order-card { padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--cream); }
        .card-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .ref { font-weight: 800; font-size: 13px; color: var(--ink); }
        .status-tag { font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 6px; }
        .status-tag.delivered { background: #E6F7ED; color: #1DB45A; }
        .status-tag.on_delivery { background: #E6F0FD; color: #0066FF; }
        .card-mid { margin-bottom: 8px; }
        .cust { font-weight: 700; font-size: 13px; }
        .card-bot { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: var(--brown-soft); }

        .returned-table-wrap { border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
        .returned-table { width: 100%; border-collapse: collapse; }
        .returned-table th { background: var(--cream-2); padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 800; color: var(--brown); border-bottom: 1px solid var(--line); }
        .returned-table td { padding: 12px 16px; border-bottom: 1px solid var(--line); font-size: 13px; }
        .reason-cell { display: flex; align-items: center; gap: 8px; color: var(--brown); font-weight: 600; }
        .reason-icon { color: var(--orange); }
        .contact-btn { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s; border: 1px solid var(--line); background: white; color: var(--brown-soft); }
        .contact-btn:hover { background: var(--cream); }
        .contact-btn.contacted { background: #E6F7ED; color: #1DB45A; border-color: #1DB45A; }
        .empty-row { padding: 32px; text-align: center; color: var(--brown-soft); font-style: italic; }

        @media (max-width: 1100px) {
          .rider-settlements-layout { grid-template-columns: 1fr; }
          .rider-sidebar { order: 2; }
          .rider-details { order: 1; }
        }

        @media (max-width: 900px) {
          .reports-grid { grid-template-columns: 1fr; }
          .order-row-mini { grid-template-columns: 1fr 1fr; }
          .order-pay { text-align: right; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
        }
      `}</style>
    </div>
  );
}

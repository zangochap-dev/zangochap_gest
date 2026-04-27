"use client";

import React, { useState, useTransition, useMemo, useCallback } from 'react';
import { TableCard, StatCard, EmptyState } from '@/components/UI';
import {
  Truck, CheckCircle, Search, ArrowUpRight, User, Banknote,
  Calendar, ChevronDown, ChevronUp, Package, Clock, History,
  Wallet, X, Eye
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/constants';
import { createSettlement } from '@/modules/orders/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface Props {
  pendingOrders: any[];
  history: any[];
}

export default function SettlementClient({ pendingOrders, history }: Props) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [expandedRider, setExpandedRider] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  const groups = useMemo(() => {
    const acc: Record<string, any> = {};
    pendingOrders.forEach(order => {
      const key = order.deliverymanId || 'unknown';
      if (!acc[key]) acc[key] = { id: key, name: order.deliverymanName || 'Inconnu', orders: [], total: 0 };
      acc[key].orders.push(order);
      acc[key].total += (order.total + order.deliveryFee - (order.discount || 0));
    });
    return Object.values(acc).sort((a: any, b: any) => b.total - a.total) as any[];
  }, [pendingOrders]);

  const totalPending = useMemo(() =>
    pendingOrders.reduce((s, o) => s + (o.total + o.deliveryFee - (o.discount || 0)), 0),
  [pendingOrders]);

  const totalSettled = useMemo(() =>
    history.reduce((s: number, h: any) => s + h.amount, 0),
  [history]);

  const filteredOrders = useMemo(() =>
    pendingOrders.filter(o =>
      o.ref?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.deliverymanName?.toLowerCase().includes(search.toLowerCase())
    ), [pendingOrders, search]);

  const handleSettle = useCallback((dId: string, orders: any[]) => {
    const total = orders.reduce((s: number, o: any) => s + (o.total + o.deliveryFee - (o.discount || 0)), 0);
    const name = orders[0]?.deliverymanName || "Livreur";
    if (!confirm(`Valider l'encaissement de ${formatPrice(total)} de ${name} ?`)) return;
    startTransition(async () => {
      try {
        await createSettlement(dId, orders.map(o => o.id), total);
        showToast(`Règlement de ${name} validé ✓`, 'success');
        router.refresh();
      } catch (e: any) { showToast(e.message || "Erreur", 'error'); }
    });
  }, [router, showToast]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRider(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="content animate-fade-in">
      {/* STATS */}
      <div className="stats-grid">
        <StatCard label="En attente" value={formatPrice(totalPending)} icon={<Wallet size={20} />} accent />
        <StatCard label="Livreurs" value={groups.length} icon={<Truck size={20} />} color="var(--blue)" />
        <StatCard label="Commandes" value={pendingOrders.length} icon={<Package size={20} />} color="var(--amber)" />
        <StatCard label="Déjà réglé" value={formatPrice(totalSettled)} icon={<CheckCircle size={20} />} color="var(--green)" />
      </div>

      {/* TABS */}
      <div className="filters-bar" style={{ marginBottom: 20 }}>
        <button
          className={`filter-chip ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Banknote size={14} /> À encaisser
        </button>
        <button
          className={`filter-chip ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={14} /> Historique
        </button>
      </div>

      {/* === PENDING TAB === */}
      {activeTab === "pending" && (
        <>
          {/* RIDER CARDS */}
          <div className="settle-grid">
            {groups.length === 0 ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <EmptyState icon="✅" title="Tout est à jour" description="Aucun encaissement en attente." />
              </div>
            ) : groups.map((d: any) => {
              const isExpanded = expandedRider === d.id;
              const initials = d.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div key={d.id} className="settle-card">
                  {/* CARD HEADER */}
                  <div className="settle-card-top">
                    <div className="settle-avatar">{initials}</div>
                    <div className="settle-info">
                      <div className="cell-strong">{d.name}</div>
                      <div className="cell-muted">{d.orders.length} commande(s)</div>
                    </div>
                  </div>

                  {/* AMOUNT */}
                  <div className="settle-amount">
                    <div className="settle-amount-label">MONTANT À ENCAISSER</div>
                    <div className="settle-amount-value">{formatPrice(d.total)}</div>
                  </div>

                  {/* EXPAND TOGGLE */}
                  <button className="settle-expand-btn" onClick={() => toggleExpand(d.id)}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? "Masquer" : "Voir les commandes"}
                  </button>

                  {/* EXPANDED ORDERS */}
                  {isExpanded && (
                    <div className="settle-orders-list">
                      {d.orders.map((o: any, i: number) => (
                        <div key={o.id} className="settle-order-row" style={{
                          borderBottom: i < d.orders.length - 1 ? '1px solid var(--line)' : 'none'
                        }}>
                          <div>
                            <span className="cell-mono" style={{ marginRight: 10 }}>
                              #{o.ref?.split("-").pop()}
                            </span>
                            <span className="cell-strong">{o.customerName}</span>
                            <div className="cell-muted">{o.commune}</div>
                          </div>
                          <span className="cell-price">
                            {formatPrice(o.total + o.deliveryFee - (o.discount || 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="settle-cta">
                    <button
                      className="btn-orange"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => handleSettle(d.id, d.orders)}
                      disabled={isPending}
                    >
                      {isPending ? "Traitement..." : "Valider l'encaissement"}
                      {!isPending && <ArrowUpRight size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DETAILED TABLE */}
          <div style={{ marginTop: 32 }}>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-soft)' }} />
              <input
                type="text"
                className="field-input"
                placeholder="Rechercher par réf, client ou livreur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 40, borderRadius: 12, height: 44, fontSize: 14, fontWeight: 500 }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#DEE2E6', border: 'none', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--brown-soft)' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <TableCard title="Détail des commandes non réglées" meta={`${filteredOrders.length} commande(s)`}>
              {filteredOrders.length === 0 ? (
                <EmptyState icon="📦" title="Aucune commande" description="Aucune commande trouvée." />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Réf.</th>
                      <th>Livreur</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id}>
                        <td><span className="cell-mono">{o.ref?.split('-').pop()}</span></td>
                        <td><div className="cell-strong">{o.deliverymanName}</div></td>
                        <td>
                          <div className="cell-strong">{o.customerName}</div>
                          <div className="cell-muted">{o.commune}</div>
                        </td>
                        <td><div className="cell-muted">{formatDate(o.createdAt)}</div></td>
                        <td><div className="cell-price">{formatPrice(o.total + o.deliveryFee - (o.discount || 0))}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TableCard>
          </div>
        </>
      )}

      {/* === HISTORY TAB === */}
      {activeTab === "history" && (
        <TableCard title="Historique des règlements" meta={`${history.length} règlement(s)`}>
          {history.length === 0 ? (
            <EmptyState icon="📋" title="Aucun historique" description="Les règlements validés apparaîtront ici." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Livreur</th>
                  <th>Commandes</th>
                  <th>Montant</th>
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
                    <td><div className="cell-muted">{s.by}</div></td>
                    <td><div className="cell-muted">{formatDate(s.createdAt)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableCard>
      )}

      <style jsx>{`
        .settle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 8px;
        }
        .settle-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--line);
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .settle-card:hover {
          box-shadow: var(--shadow-md);
        }
        .settle-card-top {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 20px 0;
        }
        .settle-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--orange);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(212, 84, 28, 0.2);
        }
        .settle-info {
          flex: 1;
        }
        .settle-amount {
          margin: 16px 20px;
          padding: 14px 16px;
          background: var(--cream);
          border-radius: var(--radius-md);
          border: 1px solid var(--line);
        }
        .settle-amount-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--brown-soft);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .settle-amount-value {
          font-size: 22px;
          font-weight: 800;
          color: var(--green);
          font-family: var(--font-display);
          letter-spacing: -0.02em;
        }
        .settle-expand-btn {
          width: 100%;
          background: var(--cream);
          border: none;
          border-top: 1px solid var(--line);
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          color: var(--brown-soft);
          font-size: 12px;
          font-weight: 600;
          transition: background 0.15s;
        }
        .settle-expand-btn:hover {
          background: var(--cream-2);
        }
        .settle-orders-list {
          border-top: 1px solid var(--line);
        }
        .settle-order-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
        }
        .settle-cta {
          padding: 16px 20px;
          border-top: 1px solid var(--line);
        }

        @media (max-width: 640px) {
          .settle-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

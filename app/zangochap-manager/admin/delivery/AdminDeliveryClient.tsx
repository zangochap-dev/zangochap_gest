"use client";

import React, { useState, useTransition, useMemo } from "react";
import { TableCard, EmptyState, StatCard, StatusBadge } from "@/components/UI";
import { formatPrice, formatDate } from "@/lib/constants";
import { Truck, User, UserPlus, Clock, Search, X, Package } from "lucide-react";
import { assignOrderToDeliveryman } from "@/modules/orders/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface AdminDeliveryClientProps {
  orders: any[];
  deliverymen: any[];
}

export default function AdminDeliveryClient({ orders, deliverymen }: AdminDeliveryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  const handleAssign = (orderId: string, dId: string) => {
    const driver = deliverymen.find(d => d.id === dId);
    if (!driver) return;

    if (!confirm(`Attribuer la commande au livreur ${driver.name} ?`)) return;

    startTransition(async () => {
      try {
        await assignOrderToDeliveryman(orderId, dId);
        showToast('Commande attribuée ✓', 'success');
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch =
        o.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.deliverymanName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.commune || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterStatus === "ALL" ||
        (filterStatus === "UNASSIGNED" && !o.deliverymanId) ||
        (filterStatus === "ASSIGNED" && o.deliverymanId) ||
        (o.status === filterStatus);

      return matchesSearch && matchesFilter;
    });
  }, [orders, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      unassigned: orders.filter(o => !o.deliverymanId).length,
      onDelivery: orders.filter(o => o.status === 'ON_DELIVERY').length,
      deliverymen: deliverymen.length
    };
  }, [orders, deliverymen]);

  return (
    <div className="content animate-fade-in">
      {/* STATS */}
      <div className="stats-grid">
        <StatCard label="Total à livrer" value={stats.total} icon={<Truck size={20} />} accent />
        <StatCard label="Non attribuées" value={stats.unassigned} icon={<UserPlus size={20} />} color="var(--red)" />
        <StatCard label="En cours" value={stats.onDelivery} icon={<Clock size={20} />} color="var(--orange)" />
        <StatCard label="Livreurs actifs" value={stats.deliverymen} icon={<User size={20} />} color="var(--blue)" />
      </div>

      {/* SEARCH & FILTERS */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-soft)' }} />
        <input
          type="text"
          className="field-input"
          placeholder="Rechercher par réf, client, commune ou livreur..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ paddingLeft: 40, borderRadius: 12, height: 44, fontSize: 14, fontWeight: 500 }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#DEE2E6', border: 'none', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--brown-soft)' }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="filters-bar" style={{ marginBottom: 16 }}>
        {[
          { key: "ALL", label: "Toutes" },
          { key: "UNASSIGNED", label: "Non attribuées" },
          { key: "ASSIGNED", label: "Attribuées" },
          { key: "ON_DELIVERY", label: "En route" },
          { key: "PENDING", label: "En attente" },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-chip ${filterStatus === f.key ? 'active' : ''}`}
            onClick={() => setFilterStatus(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <TableCard title="Suivi des livraisons" meta={`${filteredOrders.length} commande(s)`}>
        {filteredOrders.length === 0 ? (
          <EmptyState icon="📦" title="Aucune commande" description="Aucune commande à livrer trouvée." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Client / Commune</th>
                <th>Livreur</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td><span className="cell-mono">{order.ref}</span></td>
                  <td>
                    <div className="cell-strong">{order.customerName}</div>
                    <div className="cell-muted">{order.commune}</div>
                  </td>
                  <td>
                    {order.deliverymanId ? (
                      <div className="assigned-driver">
                        <div className="driver-avatar">{order.deliverymanName?.charAt(0)}</div>
                        <span>{order.deliverymanName}</span>
                      </div>
                    ) : (
                      <span className="unassigned-badge">Non attribuée</span>
                    )}
                  </td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>
                    <select
                      className="assign-select"
                      value={order.deliverymanId || ""}
                      onChange={(e) => handleAssign(order.id, e.target.value)}
                      disabled={isPending}
                    >
                      <option value="" disabled>Attribuer à...</option>
                      {deliverymen.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <style jsx>{`
        .assigned-driver {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .driver-avatar {
          width: 24px;
          height: 24px;
          background: var(--blue-soft);
          color: var(--blue);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }
        .unassigned-badge {
          font-size: 11px;
          color: var(--red);
          background: var(--red-soft);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .assign-select {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--line);
          font-size: 12px;
          font-weight: 600;
          outline: none;
          background: white;
          cursor: pointer;
        }
        .assign-select:hover { border-color: var(--orange); }
      `}</style>
    </div>
  );
}

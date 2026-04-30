"use client";

import React, { useState, useTransition, useMemo } from "react";
import { TableCard, EmptyState, StatCard, StatusBadge } from "@/components/UI";
import { formatPrice, formatDate, COMMUNES } from "@/lib/constants";
import { Truck, User, UserPlus, Clock, Search, X, Package, Check, Filter, MapPin } from "lucide-react";
import { assignOrderToDeliveryman, bulkAssignOrders } from "@/modules/orders/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface AdminDeliveryClientProps {
  orders: any[];
  deliverymen: any[];
}

export default function AdminDeliveryClient({ orders, deliverymen }: AdminDeliveryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDeliveryman, setFilterDeliveryman] = useState("ALL");
  const [filterCommune, setFilterCommune] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  const handleBulkAssign = (dId: string) => {
    if (selectedIds.size === 0) return;
    const driver = deliverymen.find(d => d.id === dId);
    if (!driver) return;

    if (!confirm(`Attribuer ${selectedIds.size} commandes à ${driver.name} ?`)) return;

    startTransition(async () => {
      try {
        await bulkAssignOrders(Array.from(selectedIds), dId);
        showToast(`${selectedIds.size} commandes attribuées ✓`, 'success');
        setSelectedIds(new Set());
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = (filtered: any[]) => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(o => o.id)));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch =
        o.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.deliverymanName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.commune || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "ALL" ||
        (filterStatus === "UNASSIGNED" && !o.deliverymanId) ||
        (filterStatus === "ASSIGNED" && o.deliverymanId) ||
        (o.status === filterStatus);

      const matchesDriver = filterDeliveryman === "ALL" || o.deliverymanId === filterDeliveryman;
      const matchesCommune = filterCommune === "ALL" || o.commune === filterCommune;

      return matchesSearch && matchesStatus && matchesDriver && matchesCommune;
    });
  }, [orders, searchTerm, filterStatus, filterDeliveryman, filterCommune]);

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

      {/* BULK ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="bulk-bar animate-slide-up">
          <div className="bulk-info">
            <Check size={18} />
            <span>{selectedIds.size} commande(s) sélectionnée(s)</span>
          </div>
          <div className="bulk-actions">
            <select
              className="bulk-select"
              onChange={(e) => handleBulkAssign(e.target.value)}
              value=""
            >
              <option value="" disabled>Attribuer la sélection à...</option>
              {deliverymen.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button className="bulk-cancel" onClick={() => setSelectedIds(new Set())}>Annuler</button>
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS */}
      <div className="filter-container">
        <div style={{ position: 'relative', flex: 2 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-soft)' }} />
          <input
            type="text"
            className="field-input"
            placeholder="Rechercher par réf, client, commune ou livreur..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 40, borderRadius: 12, height: 44, fontSize: 14, fontWeight: 500 }}
          />
        </div>

        <div className="driver-filter">
          <Filter size={16} className="filter-icon" />
          <select 
            className="field-input" 
            style={{ height: 44, paddingLeft: 36, borderRadius: 12, fontSize: 13, fontWeight: 700 }}
            value={filterDeliveryman}
            onChange={e => setFilterDeliveryman(e.target.value)}
          >
            <option value="ALL">Tous les livreurs</option>
            {deliverymen.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="commune-filter" style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <MapPin size={16} className="filter-icon" />
          <select 
            className="field-input" 
            style={{ height: 44, paddingLeft: 36, borderRadius: 12, fontSize: 13, fontWeight: 700 }}
            value={filterCommune}
            onChange={e => setFilterCommune(e.target.value)}
          >
            <option value="ALL">Toutes les communes</option>
            {Object.keys(COMMUNES).sort().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
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
                <th style={{ width: 40 }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0} 
                    onChange={() => toggleAll(filteredOrders)} 
                  />
                </th>
                <th>Réf.</th>
                <th>Client / Commune</th>
                <th>Livreur actuel</th>
                <th>Statut</th>
                <th>Action rapide</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className={selectedIds.has(order.id) ? 'row-selected' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(order.id)} 
                      onChange={() => toggleSelect(order.id)} 
                    />
                  </td>
                  <td><span className="cell-mono">{order.ref}</span></td>
                  <td>
                    <div className="cell-strong">{order.customerName}</div>
                    <div className="cell-muted">{order.commune}</div>
                  </td>
                  <td>
                    {order.deliverymanId ? (
                      <div className="assigned-driver">
                        <div className="driver-avatar">{order.deliverymanName?.charAt(0)}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{order.deliverymanName}</span>
                          {order.updatedAt && <span style={{ fontSize: 9, opacity: 0.6 }}>Assigné le {formatDate(order.updatedAt)}</span>}
                        </div>
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
                      <option value="" disabled>Ré-attribuer...</option>
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
        .filter-container { display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .driver-filter { position: relative; flex: 1; min-width: 200px; }
        .filter-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--brown-soft); pointer-events: none; }
        
        .bulk-bar { 
          background: #221F1D; color: white; padding: 12px 24px; border-radius: 16px; 
          margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .bulk-info { display: flex; align-items: center; gap: 10px; font-weight: 700; }
        .bulk-actions { display: flex; gap: 12px; align-items: center; }
        .bulk-select { 
          background: white; color: black; border: none; padding: 8px 16px; 
          border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .bulk-cancel { 
          background: transparent; border: 1px solid rgba(255,255,255,0.3); color: white;
          padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer;
        }

        .assigned-driver { display: flex; align-items: center; gap: 8px; }
        .driver-avatar {
          width: 32px; height: 32px; background: var(--blue-soft); color: var(--blue);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800;
        }
        .row-selected { background: var(--cream-2); }
        .unassigned-badge { font-size: 11px; color: var(--red); background: var(--red-soft); padding: 4px 10px; border-radius: 6px; font-weight: 700; }
        .assign-select {
          padding: 8px 12px; border-radius: 10px; border: 1.5px solid var(--line);
          font-size: 12px; font-weight: 700; outline: none; background: white; cursor: pointer; transition: 0.2s;
        }
        .assign-select:hover { border-color: var(--orange); background: var(--cream); }
      `}</style>
    </div>
  );
}

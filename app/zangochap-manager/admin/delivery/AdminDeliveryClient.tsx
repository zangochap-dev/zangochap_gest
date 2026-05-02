"use client";

import React, { useState, useTransition, useMemo } from "react";
import { TableCard, EmptyState, StatCard, StatusBadge } from "@/components/UI";
import { formatPrice, formatDate, COMMUNES } from "@/lib/constants";
import { Truck, User, UserPlus, Clock, Search, X, Package, Check, Filter, MapPin, Calendar, LayoutGrid, List } from "lucide-react";
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
  const [filterDate, setFilterDate] = useState(""); // YYYY-MM-DD
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
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
      
      const matchesDate = !filterDate || (o.deliveryDate && o.deliveryDate.startsWith(filterDate));

      return matchesSearch && matchesStatus && matchesDriver && matchesCommune && matchesDate;
    });
  }, [orders, searchTerm, filterStatus, filterDeliveryman, filterCommune, filterDate]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      unassigned: orders.filter(o => !o.deliverymanId).length,
      onDelivery: orders.filter(o => o.status === 'ON_DELIVERY').length,
      deliverymen: deliverymen.length
    };
  }, [orders, deliverymen]);

  // Group by deliveryman for the "grid" view (Rider Load)
  const groupedByDriver = useMemo(() => {
    const groups: Record<string, any[]> = { "unassigned": [] };
    deliverymen.forEach(d => groups[d.id] = []);
    
    filteredOrders.forEach(o => {
      const key = o.deliverymanId || "unassigned";
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });
    return groups;
  }, [filteredOrders, deliverymen]);

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
                <option key={d.id} value={d.id}>
                  {d.name} ({d._count?.orders || 0} en cours)
                </option>
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

        <div className="filter-item">
          <Calendar size={16} className="filter-icon" />
          <input 
            type="date"
            className="field-input"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={{ height: 44, paddingLeft: 36, borderRadius: 12 }}
          />
        </div>

        <div className="filter-item">
          <Filter size={16} className="filter-icon" />
          <select 
            className="field-input" 
            style={{ height: 44, paddingLeft: 36, borderRadius: 12, fontSize: 13, fontWeight: 700 }}
            value={filterDeliveryman}
            onChange={e => setFilterDeliveryman(e.target.value)}
          >
            <option value="ALL">Tous les livreurs</option>
            {deliverymen.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d._count?.orders || 0})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
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

      <div className="toolbar">
        <div className="filters-bar">
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

        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} 
            onClick={() => setViewMode('table')}
            title="Vue liste"
          >
            <List size={18} />
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} 
            onClick={() => setViewMode('grid')}
            title="Vue par livreur"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <TableCard title="Suivi des livraisons" meta={`${filteredOrders.length} commande(s)`}>
          {filteredOrders.length === 0 ? (
            <EmptyState icon="📦" title="Aucune commande" description="Aucune commande à livrer trouvée." />
          ) : (
            <div className="table-responsive">
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
                    <th>Date Prévue</th>
                    <th>Livreur actuel</th>
                    <th>Statut</th>
                    <th>Action</th>
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
                        <div className="cell-date">
                          <Calendar size={12} />
                          {order.deliveryDate ? formatDate(order.deliveryDate) : 'Non définie'}
                        </div>
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
                          <option value="" disabled>Attribuer à...</option>
                          {deliverymen.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d._count?.orders || 0})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TableCard>
      )}

      {/* GRID VIEW (BY RIDER) */}
      {viewMode === "grid" && (
        <div className="rider-grid">
          {/* Unassigned column */}
          <div className="rider-column unassigned-col">
            <div className="rider-column-header">
              <div className="header-info">
                <UserPlus size={18} />
                <h3>Non assignées</h3>
              </div>
              <span className="count-badge">{groupedByDriver["unassigned"].length}</span>
            </div>
            <div className="order-cards-list">
              {groupedByDriver["unassigned"].map(order => (
                <OrderMiniCard key={order.id} order={order} deliverymen={deliverymen} onAssign={handleAssign} />
              ))}
              {groupedByDriver["unassigned"].length === 0 && <div className="empty-col">Tout est assigné ✓</div>}
            </div>
          </div>

          {/* Riders columns */}
          {deliverymen.map(driver => (
            <div key={driver.id} className="rider-column">
              <div className="rider-column-header">
                <div className="header-info">
                  <div className="driver-avatar-small">{driver.name.charAt(0)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700 }}>{driver.name}</h3>
                    <span style={{ fontSize: 10, opacity: 0.6 }}>{driver.phone}</span>
                  </div>
                </div>
                <span className="count-badge active">{groupedByDriver[driver.id]?.length || 0}</span>
              </div>
              <div className="order-cards-list">
                {groupedByDriver[driver.id]?.map(order => (
                  <OrderMiniCard key={order.id} order={order} deliverymen={deliverymen} onAssign={handleAssign} />
                ))}
                {(groupedByDriver[driver.id]?.length || 0) === 0 && <div className="empty-col">Aucune livraison</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .filter-container { display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .filter-item { position: relative; flex: 1; min-width: 180px; }
        .filter-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--brown-soft); pointer-events: none; z-index: 2; }
        
        .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; }
        .view-toggle { display: flex; background: var(--cream-2); padding: 4px; border-radius: 10px; border: 1px solid var(--line); }
        .toggle-btn { 
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; 
          border: none; background: transparent; color: var(--brown-soft); border-radius: 8px; cursor: pointer; transition: 0.2s;
        }
        .toggle-btn.active { background: white; color: var(--orange); box-shadow: var(--shadow-sm); }

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

        .table-responsive { overflow-x: auto; }
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
        .cell-date { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--brown); }

        /* RIDER GRID */
        .rider-grid { 
          display: flex; gap: 16px; overflow-x: auto; padding-bottom: 20px;
          min-height: 600px; scroll-snap-type: x mandatory;
        }
        .rider-column { 
          flex: 0 0 300px; background: var(--cream-2); border-radius: 16px; 
          border: 1px solid var(--line); display: flex; flex-direction: column;
          max-height: 80vh; scroll-snap-align: start;
        }
        .unassigned-col { background: #FFF5F2; border-color: #FFDED6; }
        .rider-column-header { 
          padding: 16px; border-bottom: 1px solid var(--line); 
          display: flex; justify-content: space-between; align-items: center;
          position: sticky; top: 0; background: inherit; border-radius: 16px 16px 0 0; z-index: 5;
        }
        .header-info { display: flex; align-items: center; gap: 10px; }
        .header-info h3 { margin: 0; font-size: 14px; font-weight: 800; color: #333; }
        .count-badge { 
          background: var(--line); color: var(--brown-soft); padding: 2px 8px; 
          border-radius: 20px; font-size: 11px; font-weight: 800; 
        }
        .count-badge.active { background: var(--orange); color: white; }
        .order-cards-list { padding: 12px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; }
        .driver-avatar-small {
          width: 28px; height: 28px; background: var(--blue-soft); color: var(--blue);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800;
        }
        .empty-col { 
          text-align: center; padding: 40px 20px; color: var(--brown-soft); 
          font-size: 12px; font-weight: 600; border: 2px dashed var(--line); border-radius: 12px;
        }
      `}</style>
    </div>
  );
}

function OrderMiniCard({ order, deliverymen, onAssign }: { order: any, deliverymen: any[], onAssign: (oid: string, did: string) => void }) {
  return (
    <div className="order-mini-card">
      <div className="card-header">
        <span className="order-ref">{order.ref}</span>
        <StatusBadge status={order.status} size="sm" />
      </div>
      <div className="card-body">
        <div className="customer-name">{order.customerName}</div>
        <div className="commune-info">
          <MapPin size={12} />
          {order.commune}
        </div>
        {order.deliveryDate && (
          <div className="date-info">
            <Calendar size={12} />
            {formatDate(order.deliveryDate)}
          </div>
        )}
      </div>
      <div className="card-footer">
        <select
          className="mini-assign-select"
          value={order.deliverymanId || ""}
          onChange={(e) => onAssign(order.id, e.target.value)}
        >
          <option value="" disabled>Attribuer à...</option>
          {deliverymen.map((d: any) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <style jsx>{`
        .order-mini-card { 
          background: white; border-radius: 12px; padding: 12px; 
          box-shadow: var(--shadow-sm); border: 1px solid var(--line);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .order-mini-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--orange-soft); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .order-ref { font-family: var(--font-mono); font-weight: 700; font-size: 12px; color: var(--orange); }
        .customer-name { font-weight: 700; font-size: 13px; color: #111; margin-bottom: 4px; }
        .commune-info, .date-info { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--brown-soft); margin-bottom: 2px; }
        .card-footer { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line-light); }
        .mini-assign-select { 
          width: 100%; padding: 6px; border-radius: 6px; border: 1px solid var(--line); 
          font-size: 11px; font-weight: 700; background: var(--cream); outline: none;
        }
      `}</style>
    </div>
  );
}

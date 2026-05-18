"use client";

import React, { useState, useTransition, useMemo } from "react";
import { TableCard, EmptyState, StatCard, StatusBadge } from "@/components/UI";
import { formatPrice, formatDate, COMMUNES } from "@/lib/constants";
import { Truck, User, UserPlus, Clock, Search, X, Package, Check, Filter, MapPin, Calendar, LayoutGrid, List, Archive, TrendingUp, ChevronRight, FileText, Phone, Printer, CalendarClock } from "lucide-react";
import { assignOrderToDeliveryman, bulkAssignOrders, updateOrderStatus } from "@/modules/orders/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import "./admin-delivery-client.css";

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
  const [viewMode, setViewMode] = useState<"table" | "grid" | "history" | "sheet">("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const router = useRouter();
  const { showToast } = useToast();

  const handleAssign = (orderId: string, dId: string) => {
    const isUnassigning = dId === "unassigned" || dId === "";
    const driver = deliverymen.find(d => d.id === dId);
    
    if (!isUnassigning && !driver) return;

    const confirmMsg = isUnassigning 
      ? "Désattribuer cette commande et la remettre en attente ?"
      : `Attribuer la commande au livreur ${driver?.name} ?`;

    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      try {
        await assignOrderToDeliveryman(orderId, dId);
        showToast(isUnassigning ? 'Commande désattribuée' : 'Commande attribuée ✓', 'success');
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  const handleBulkAssign = (dId: string) => {
    if (selectedIds.size === 0) return;
    const isUnassigning = dId === "unassigned" || dId === "";
    const driver = deliverymen.find(d => d.id === dId);
    
    if (!isUnassigning && !driver) return;

    const confirmMsg = isUnassigning
      ? `Désattribuer les ${selectedIds.size} commandes sélectionnées ?`
      : `Attribuer ${selectedIds.size} commandes à ${driver?.name} ?`;

    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      try {
        await bulkAssignOrders(Array.from(selectedIds), dId);
        showToast(`${selectedIds.size} commandes ${isUnassigning ? 'désattribuées' : 'attribuées ✓'}`, 'success');
        setSelectedIds(new Set());
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  const handleReproDispo = (orderId: string) => {
    if (!confirm("Mettre cette commande en repro-dispo pour la livraison de demain ?")) return;

    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, "REPRO_DISPO");
        showToast("Commande repro-dispo pour demain ✓", "success");
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
      total: filteredOrders.length,
      unassigned: filteredOrders.filter(o => !o.deliverymanId).length,
      onDelivery: filteredOrders.filter(o => o.status === 'ON_DELIVERY').length,
      deliverymen: deliverymen.length
    };
  }, [filteredOrders, deliverymen]);

  // Live count of orders per deliveryman (to keep UI sync after assignment)
  const riderLiveCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.deliverymanId) {
        counts[o.deliverymanId] = (counts[o.deliverymanId] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

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

  // Group by date for the "history" view
  const groupedByDate = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const sortedOrders = [...filteredOrders].sort((a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    sortedOrders.forEach(o => {
      const date = new Date(o.updatedAt || o.createdAt).toLocaleDateString("fr-CA"); // YYYY-MM-DD
      if (!groups[date]) groups[date] = [];
      groups[date].push(o);
    });
    return groups;
  }, [filteredOrders]);

  // Today's assigned orders grouped by deliveryman for delivery sheets
  const todaySheets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get assigned orders + any BJ orders for today (except Cocody)
    const allRelevantOrders = orders.filter(o => {
      const isBJToBroadcast = o.ref?.toUpperCase().startsWith("BJ") && !o.commune?.toLowerCase().includes("cocody");
      const updated = new Date(o.updatedAt || o.createdAt);
      const isToday = updated >= today;
      return isToday && (o.deliverymanId || isBJToBroadcast);
    });

    const bjOrders = allRelevantOrders.filter(o => o.ref?.toUpperCase().startsWith("BJ") && !o.commune?.toLowerCase().includes("cocody"));
    const assignedOrders = allRelevantOrders.filter(o => o.deliverymanId && !(o.ref?.toUpperCase().startsWith("BJ") && !o.commune?.toLowerCase().includes("cocody")));

    // Find all drivers who have at least one order assigned today
    const activeDriverIds = new Set(assignedOrders.map(o => o.deliverymanId));

    const sheets: Record<string, { driver: any, orders: any[] }> = {};

    // Initialize sheets for active drivers and add their specific orders
    activeDriverIds.forEach(dId => {
      const driver = deliverymen.find(d => d.id === dId);
      sheets[dId] = {
        driver: driver || { id: dId, name: 'Livreur Inconnu', phone: '' },
        orders: assignedOrders.filter(o => o.deliverymanId === dId)
      };
    });

    // Add all BJ orders to every active driver's sheet
    Object.keys(sheets).forEach(dId => {
      sheets[dId].orders = [...sheets[dId].orders, ...bjOrders];
    });

    return Object.values(sheets);
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
              <option value="unassigned" style={{ color: 'var(--red)', fontWeight: 'bold' }}>❌ Désattribuer (Remettre en attente)</option>
              <hr />
              {deliverymen.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({riderLiveCounts[d.id] || 0} en cours)
                </option>
              ))}
            </select>
            <button className="bulk-cancel" onClick={() => setSelectedIds(new Set())}>Annuler</button>
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS */}
      <div className="filter-container">
        <div className="search-container">
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-soft)' }} />
          <input
            type="text"
            className="field-input search-input"
            placeholder="Rechercher par réf, client, commune ou livreur..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-item">
          <Calendar size={16} className="filter-icon" />
          <input
            type="date"
            className="field-input filter-date-input"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>

        <div className="filter-item">
          <Filter size={16} className="filter-icon" />
          <select
            className="field-input filter-select"
            value={filterDeliveryman}
            onChange={e => setFilterDeliveryman(e.target.value)}
          >
            <option value="ALL">Tous les livreurs</option>
            {deliverymen.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({riderLiveCounts[d.id] || 0})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <MapPin size={16} className="filter-icon" />
          <select
            className="field-input filter-select"
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
          <button
            className={`toggle-btn ${viewMode === 'history' ? 'active' : ''}`}
            onClick={() => setViewMode('history')}
            title="Vue Archives"
          >
            <Archive size={18} />
          </button>
          <button
            className={`toggle-btn ${viewMode === 'sheet' ? 'active' : ''}`}
            onClick={() => setViewMode('sheet')}
            title="Fiche de livraison"
          >
            <FileText size={18} />
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
                        <div className="cell-commune">
                          <MapPin size={10} style={{ marginRight: 4, display: 'inline' }} />
                          {order.commune || "N/A"}
                        </div>
                        {order.customerLocation && (
                          <div className="cell-location" title={order.customerLocation}>
                            {order.customerLocation}
                          </div>
                        )}
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
                            <div className="driver-info">
                              <span className="driver-name-text">{order.deliverymanName}</span>
                              {order.updatedAt && <span className="driver-time-text">Assigné le {formatDate(order.updatedAt)}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="unassigned-badge">Non attribuée</span>
                        )}
                      </td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="cell-btn-icon"
                            onClick={() => handleReproDispo(order.id)}
                            disabled={isPending || order.status === "REPRO_DISPO"}
                            title="Repro-dispo demain"
                          >
                            <CalendarClock size={14} />
                          </button>
                          <select
                            className="assign-select"
                            value={order.deliverymanId || ""}
                            onChange={(e) => handleAssign(order.id, e.target.value)}
                            disabled={isPending}
                          >
                            <option value="" disabled>Attribuer à...</option>
                            <option value="unassigned" style={{ color: 'var(--red)' }}>❌ Désattribuer</option>
                            {deliverymen.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name} ({riderLiveCounts[d.id] || 0})
                              </option>
                            ))}
                          </select>
                        </div>
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
                  <OrderMiniCard key={order.id} order={order} deliverymen={deliverymen} onAssign={handleAssign} riderLiveCounts={riderLiveCounts} />
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
                  <div className="driver-info">
                    <h3 className="driver-name-text">{driver.name}</h3>
                    <span className="driver-phone-text">{driver.phone}</span>
                  </div>
                </div>
                <span className="count-badge active">{riderLiveCounts[driver.id] || 0}</span>
              </div>
              <div className="order-cards-list">
                {groupedByDriver[driver.id]?.map(order => (
                  <OrderMiniCard key={order.id} order={order} deliverymen={deliverymen} onAssign={handleAssign} riderLiveCounts={riderLiveCounts} />
                ))}
                {(groupedByDriver[driver.id]?.length || 0) === 0 && <div className="empty-col">Aucune livraison</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HISTORY VIEW (BY DATE) */}
      {viewMode === "history" && (
        <div className="history-archive-container">
          {Object.entries(groupedByDate).map(([date, dateOrders]) => {
            const dateStats = {
              total: dateOrders.length,
              delivered: dateOrders.filter(o => o.status === "DELIVERED").length,
              returned: dateOrders.filter(o => o.status === "RETURNED" || o.status === "CANCELLED").length,
              cash: dateOrders.filter(o => o.status === "DELIVERED").reduce((acc, o) => acc + Number(o.total || 0) + Number(o.deliveryFee || 0), 0)
            };
            const isExpanded = expandedDate === date;

            return (
              <div key={date} className={`history-date-block ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="history-date-header"
                  onClick={() => setExpandedDate(isExpanded ? null : date)}
                >
                  <div className="date-info">
                    <div className="calendar-box">
                      <Calendar size={18} />
                      <span>{new Date(date).getDate()}</span>
                    </div>
                    <div>
                      <h4>{new Date(date).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                      <p>{dateOrders.length} commandes au total</p>
                    </div>
                  </div>

                  <div className="header-stats">
                    <div className="mini-stat">
                      <span className="label">CA Encaissé</span>
                      <span className="value text-green">{formatPrice(dateStats.cash)}</span>
                    </div>
                    <div className="mini-stat">
                      <span className="label">Livrés</span>
                      <span className="value">{dateStats.delivered}</span>
                    </div>
                    <div className="mini-stat">
                      <span className="label">Retours</span>
                      <span className="value text-red">{dateStats.returned}</span>
                    </div>
                    <ChevronRight size={20} className="expand-icon" />
                  </div>
                </div>

                {isExpanded && (
                  <div className="history-date-content animate-fade-in">
                    <div className="table-responsive">
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th>Réf.</th>
                            <th>Client / Commune</th>
                            <th>Livreur</th>
                            <th>Total</th>
                            <th>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dateOrders.map(o => (
                            <tr key={o.id}>
                              <td><span className="cell-mono">{o.ref}</span></td>
                              <td>
                                <div className="cell-strong">{o.customerName}</div>
                                <div className="cell-muted">{o.commune}</div>
                              </td>
                              <td>{o.deliverymanName || '-'}</td>
                              <td>{formatPrice(Number(o.total || 0) + Number(o.deliveryFee || 0))}</td>
                              <td><StatusBadge status={o.status} size="sm" /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {Object.keys(groupedByDate).length === 0 && (
            <EmptyState icon="📅" title="Aucune archive" description="Aucune donnée historique trouvée pour les filtres actuels." />
          )}
        </div>
      )}
      {/* DELIVERY SHEET VIEW */}
      {viewMode === "sheet" && (
        <div className="delivery-sheets-container">
          <div className="sheet-toolbar no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} color="var(--orange)" />
              <span style={{ fontWeight: 800, fontSize: 15 }}>Fiches de livraison du jour</span>
              <span className="count-badge active">{todaySheets.reduce((s, g) => s + g.orders.length, 0)} commandes</span>
            </div>
            <button className="btn-orange" onClick={() => window.print()} style={{ gap: 8 }}>
              <Printer size={14} /> Tout imprimer
            </button>
          </div>

          {todaySheets.length === 0 ? (
            <EmptyState icon="🚛" title="Aucune commande attribuée aujourd'hui" description="Attribuez des commandes aux livreurs pour générer les fiches." />
          ) : (
            todaySheets.map(({ driver, orders: driverOrders }) => {
              const totalAmount = driverOrders.reduce((s, o) => s + (o.total || 0) + (o.deliveryFee || 0) - (o.discount || 0), 0);
              const totalProducts = driverOrders.reduce((s, o) => s + (o.total || 0) - (o.discount || 0), 0);
              const totalDeliveryFee = driverOrders.reduce((s, o) => s + (o.deliveryFee || 0), 0);
              const initials = driver.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

              const byCommune: Record<string, any[]> = {};
              driverOrders.forEach(o => {
                const c = o.commune || 'Non défini';
                if (!byCommune[c]) byCommune[c] = [];
                byCommune[c].push(o);
              });

              let globalIdx = 0;

              return (
                <div key={driver.id} id={`sheet-${driver.id}`} className="delivery-sheet print-sheet">
                  <div className="sheet-header">
                    <div className="sheet-driver-info">
                      <div className="sheet-driver-avatar">{initials}</div>
                      <div>
                        <div className="sheet-driver-name">{driver.name}</div>
                        {driver.phone && <div className="sheet-driver-phone"><Phone size={11} /> {driver.phone}</div>}
                      </div>
                    </div>
                    <div className="sheet-meta">
                      <button className="btn-print-single no-print" onClick={() => {
                        document.querySelectorAll('.delivery-sheet').forEach(el => el.classList.add('print-hidden'));
                        document.getElementById(`sheet-${driver.id}`)?.classList.remove('print-hidden');
                        window.print();
                        document.querySelectorAll('.delivery-sheet').forEach(el => el.classList.remove('print-hidden'));
                      }}>
                        <Printer size={13} /> Imprimer
                      </button>
                      <div className="sheet-date">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      <div className="sheet-stats-row">
                        <span><strong>{driverOrders.length}</strong> colis</span>
                        <span>•</span>
                        <span><strong>{Object.keys(byCommune).length}</strong> zones</span>
                        <span>•</span>
                        <span style={{ fontWeight: 800 }}>{formatPrice(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {Object.entries(byCommune).map(([commune, communeOrders]) => (
                    <div key={commune} className="sheet-commune-block">
                      <div className="sheet-commune-header">
                        <MapPin size={13} />
                        <span>{commune}</span>
                        <span className="commune-count">{communeOrders.length}</span>
                      </div>
                      <table className="sheet-table">
                        <thead>
                          <tr>
                            <th className="col-n">N°</th>
                            <th className="col-ref">Réf</th>
                            <th>Client / Adresse</th>
                            <th className="col-phone">Téléphone</th>

                            <th>Articles</th>
                            <th className="col-total">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {communeOrders.map((o: any) => {
                            globalIdx++;
                            return (
                              <tr key={o.id}>
                                <td className="col-n">{globalIdx}</td>
                                <td className="col-ref"><span className="cell-mono">{o.ref?.split('-').pop()}</span></td>
                                <td>
                                  <strong>{o.customerName}</strong>
                                  {o.customerLocation && <div className="sheet-addr">{o.customerLocation}</div>}
                                  {o.deliveryNote && <div className="sheet-note">Note: {o.deliveryNote}</div>}
                                </td>
                                <td className="col-phone">
                                  <div>{o.customerPhone}</div>
                                  {o.customerPhone2 && <div className="phone2">{o.customerPhone2}</div>}
                                </td>

                                <td>
                                  {o.items?.map((item: any, i: number) => (
                                    <div key={i} className="sheet-item">{item.name} <span className="item-variant">{item.size}/{item.color}</span> ×{item.qty}</div>
                                  ))}
                                </td>
                                <td className="col-total">
                                  <div style={{ fontWeight: 900 }}>{formatPrice((o.total || 0) - (o.discount || 0) + (o.deliveryFee || 0))}</div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}

                  <div className="sheet-footer">
                    <div className="sheet-footer-item"><span className="label">Colis</span><span className="val">{driverOrders.length}</span></div>
                    <div className="sheet-footer-item"><span className="label">Total Produits</span><span className="val">{formatPrice(totalProducts)}</span></div>
                    <div className="sheet-footer-item"><span className="label">Total Livraison</span><span className="val">{formatPrice(totalDeliveryFee)}</span></div>
                    <div className="sheet-footer-item total"><span className="label">TOTAL À ENCAISSER</span><span className="val">{formatPrice(totalAmount)}</span></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}

function OrderMiniCard({ order, deliverymen, onAssign, riderLiveCounts }: { order: any, deliverymen: any[], onAssign: (oid: string, did: string) => void, riderLiveCounts: Record<string, number> }) {
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
          <span className="font-bold">{order.commune}</span>
        </div>
        {order.customerLocation && (
          <div className="location-info">
            <span className="text-[10px] text-zinc-500 leading-tight block mt-1 italic">
              {order.customerLocation}
            </span>
          </div>
        )}
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
          <option value="unassigned">❌ Désattribuer</option>
          {deliverymen.map((d: any) => (
            <option key={d.id} value={d.id}>{d.name} ({riderLiveCounts[d.id] || 0})</option>
          ))}
        </select>
      </div>

    </div>
  );
}

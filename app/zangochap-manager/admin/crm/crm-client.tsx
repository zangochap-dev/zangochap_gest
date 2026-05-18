"use client";

import React, { useState, useMemo, useTransition, useCallback } from "react";
import { TableCard, EmptyState, StatCard } from "@/components/UI";
import { formatPrice, formatDay } from "@/lib/constants";
import {
  Search, Trash2, User as UserIcon, Phone, MapPin, ShoppingBag,
  Download, Calendar, Package, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Filter, X
} from "lucide-react";
import { deleteCustomer } from "@/modules/crm/admin-actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

interface CRMClientProps {
  initialCustomers: any[];
  yesterdayBuyers?: any[];
  buyerOrders?: any[];
}

type SortKey = 'name' | 'totalOrders' | 'totalSpent' | 'lastOrderAt' | 'commune';
type SortDir = 'asc' | 'desc';
type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';
const PAGE_SIZE = 25;

function toLocalDateInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getPresetRange(preset: DatePreset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(today);
  endToday.setHours(23, 59, 59, 999);

  if (preset === 'all') return { from: '', to: '' };
  if (preset === 'yesterday') {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return { from: toLocalDateInputValue(y), to: toLocalDateInputValue(y) };
  }
  if (preset === 'week') {
    const w = new Date(today);
    w.setDate(w.getDate() - 6);
    return { from: toLocalDateInputValue(w), to: toLocalDateInputValue(endToday) };
  }
  if (preset === 'month') {
    const m = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toLocalDateInputValue(m), to: toLocalDateInputValue(endToday) };
  }
  return { from: toLocalDateInputValue(today), to: toLocalDateInputValue(endToday) };
}

function isWithinRange(value: string | Date | null | undefined, from: string, to: string) {
  if (!from && !to) return true;
  if (!value) return false;
  const ts = new Date(value).getTime();
  if (from && ts < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && ts > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
}

export default function CRMClient({ initialCustomers, yesterdayBuyers = [], buyerOrders }: CRMClientProps) {
  const allBuyerOrders = buyerOrders || yesterdayBuyers;
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'orders'>('clients');
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  // ── Sorting ──
  const [sortKey, setSortKey] = useState<SortKey>('lastOrderAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ── Filters ──
  const [communeFilter, setCommuneFilter] = useState('all');
  const [ordersMin, setOrdersMin] = useState('');
  const [spentMin, setSpentMin] = useState('');
  const todayRange = getPresetRange('today');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [dateFrom, setDateFrom] = useState(todayRange.from);
  const [dateTo, setDateTo] = useState(todayRange.to);

  // ── Pagination ──
  const [clientPage, setClientPage] = useState(1);
  const [yesterdayPage, setYesterdayPage] = useState(1);

  // Reset page on filter/search change
  const resetClientPage = () => setClientPage(1);
  const resetYesterdayPage = () => setYesterdayPage(1);

  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const range = getPresetRange(preset);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
    resetClientPage();
    resetYesterdayPage();
  };

  // ── Communes list (derived) ──
  const communes = useMemo(() => {
    const set = new Set<string>();
    initialCustomers.forEach(c => { if (c.commune) set.add(c.commune); });
    return Array.from(set).sort();
  }, [initialCustomers]);

  const ordersInSelectedRange = useMemo(() => {
    return allBuyerOrders.filter((order: any) => isWithinRange(order.createdAt, dateFrom, dateTo));
  }, [allBuyerOrders, dateFrom, dateTo]);

  const orderedCustomerPhones = useMemo(() => {
    return new Set(ordersInSelectedRange.map((order: any) => order.customerPhone).filter(Boolean));
  }, [ordersInSelectedRange]);

  // ── Toggle sort ──
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'commune' ? 'asc' : 'desc');
    }
    resetClientPage();
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: 4 }} />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} style={{ color: 'var(--orange)', marginLeft: 4 }} />
      : <ArrowDown size={12} style={{ color: 'var(--orange)', marginLeft: 4 }} />;
  };

  // ── Filter + Sort + Paginate clients ──
  const { paginatedClients, totalFilteredClients, allFilteredClients } = useMemo(() => {
    let result = [...initialCustomers];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.commune?.toLowerCase().includes(q)
      );
    }

    // Commune filter
    if (communeFilter !== 'all') {
      result = result.filter(c => c.commune === communeFilter);
    }

    // Purchase date filter
    if (datePreset !== 'all') {
      result = result.filter(c => orderedCustomerPhones.has(c.phone));
    }

    // Min orders
    if (ordersMin) {
      const min = parseInt(ordersMin);
      if (!isNaN(min)) result = result.filter(c => c.totalOrders >= min);
    }

    // Min spent
    if (spentMin) {
      const min = parseInt(spentMin);
      if (!isNaN(min)) result = result.filter(c => c.totalSpent >= min);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name' || sortKey === 'commune') {
        cmp = (a[sortKey] || '').localeCompare(b[sortKey] || '');
      } else if (sortKey === 'lastOrderAt') {
        cmp = new Date(a.lastOrderAt || 0).getTime() - new Date(b.lastOrderAt || 0).getTime();
      } else {
        cmp = (a[sortKey] || 0) - (b[sortKey] || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    const total = result.length;
    const start = (clientPage - 1) * PAGE_SIZE;
    return {
      paginatedClients: result.slice(start, start + PAGE_SIZE),
      totalFilteredClients: total,
      allFilteredClients: result,
    };
  }, [initialCustomers, search, communeFilter, datePreset, orderedCustomerPhones, ordersMin, spentMin, sortKey, sortDir, clientPage]);

  const clientTotalPages = Math.ceil(totalFilteredClients / PAGE_SIZE);

  // ── Orders filtering + pagination ──
  const { paginatedYesterday, totalFilteredYesterday, allFilteredYesterday } = useMemo(() => {
    let result = [...ordersInSelectedRange];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.ref.toLowerCase().includes(q) ||
        o.commune?.toLowerCase().includes(q)
      );
    }
    const total = result.length;
    const start = (yesterdayPage - 1) * PAGE_SIZE;
    return {
      paginatedYesterday: result.slice(start, start + PAGE_SIZE),
      totalFilteredYesterday: total,
      allFilteredYesterday: result
    };
  }, [ordersInSelectedRange, search, yesterdayPage]);

  const yesterdayTotalPages = Math.ceil(totalFilteredYesterday / PAGE_SIZE);

  // ── Handlers ──
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement le client "${name}" ?`)) return;
    startTransition(async () => {
      try {
        await deleteCustomer(id);
        showToast('Client supprimé', 'success');
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  const exportToExcel = useCallback(() => {
    if (allFilteredYesterday.length === 0) {
      showToast('Aucun achat à exporter', 'error');
      return;
    }
    const headers = ['Réf', 'Client', 'Téléphone', 'Téléphone 2', 'Commune', 'Adresse', 'Articles', 'Total', 'Livraison', 'Remise', 'Statut', 'Commercial', 'Heure'];
    const rows = allFilteredYesterday.map((o: any) => {
      const itemsSummary = o.items.map((i: any) => `${i.name} (${i.size}/${i.color}) x${i.qty}`).join(' | ');
      const time = new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return [
        o.ref, `"${o.customerName}"`, o.customerPhone, o.customerPhone2 || '',
        o.commune || '', `"${(o.customerLocation || '').replace(/"/g, '""')}"`,
        `"${itemsSummary}"`, o.total, o.deliveryFee || 0, o.discount || 0,
        o.status, o.commercialName || '', time,
      ].join(';');
    });
    const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `achats_${dateFrom || 'debut'}_${dateTo || 'fin'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`${allFilteredYesterday.length} lignes exportées ✓`, 'success');
  }, [allFilteredYesterday, dateFrom, dateTo, showToast]);

  // Export CRM Clients
  const exportClients = useCallback(() => {
    if (allFilteredClients.length === 0) { showToast('Aucun client a exporter', 'error'); return; }

    const headers = ['Nom', 'Telephone', 'Telephone 2', 'Commune', 'Adresse', 'Commandes', 'Total Depense', 'Dernier Achat'];
    const rows = allFilteredClients.map(c => [
      `"${c.name}"`, c.phone, c.phone2 || '', c.commune || '',
      `"${(c.location || '').replace(/"/g, '""')}"`,
      c.totalOrders, c.totalSpent,
      c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('fr-FR') : ''
    ].join(';'));

    const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clients_crm_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`${allFilteredClients.length} clients exportes`, 'success');
  }, [allFilteredClients, showToast]);

  const totalRevenue = initialCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpent = initialCustomers.length ? Math.round(totalRevenue / initialCustomers.length) : 0;
  const selectedOrdersTotal = ordersInSelectedRange.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

  const hasActiveFilters = communeFilter !== 'all' || datePreset !== 'today' || ordersMin || spentMin;

  // ── Pagination Component ──
  const Pagination = ({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '16px 0' }}>
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'white', fontSize: 12, fontWeight: 700, cursor: page > 1 ? 'pointer' : 'default', opacity: page <= 1 ? 0.4 : 1 }}
        >
          <ChevronLeft size={14} /> Préc.
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
          {page} <span style={{ color: '#8E8E93', fontWeight: 400 }}>/ {totalPages}</span>
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'white', fontSize: 12, fontWeight: 700, cursor: page < totalPages ? 'pointer' : 'default', opacity: page >= totalPages ? 0.4 : 1 }}
        >
          Suiv. <ChevronRight size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="content animate-fade-in">
      {/* STATS */}
      <div className="stats-grid">
        <StatCard label="Total Clients" value={initialCustomers.length} />
        <StatCard label="Chiffre d'Affaires" value={formatPrice(totalRevenue)} color="var(--orange)" />
        <StatCard label="Panier Moyen" value={formatPrice(avgSpent)} />
        <StatCard label="Achats période" value={`${ordersInSelectedRange.length} cmd · ${formatPrice(selectedOrdersTotal)}`} color="var(--green)" />
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--cream)', padding: 4, borderRadius: 10, border: '1px solid var(--line)', marginBottom: 20, width: 'fit-content' }}>
        <button onClick={() => { setActiveTab('clients'); resetClientPage(); }} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: activeTab === 'clients' ? 'white' : 'transparent', color: activeTab === 'clients' ? 'var(--ink)' : 'var(--brown-soft)', boxShadow: activeTab === 'clients' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
          <UserIcon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Annuaire ({initialCustomers.length})
        </button>
        <button onClick={() => { setActiveTab('orders'); resetYesterdayPage(); }} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: activeTab === 'orders' ? 'white' : 'transparent', color: activeTab === 'orders' ? 'var(--orange)' : 'var(--brown-soft)', boxShadow: activeTab === 'orders' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
          <Calendar size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Achats ({ordersInSelectedRange.length})
        </button>
      </div>

      {/* SEARCH + FILTERS + EXPORT */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: activeTab === 'clients' ? 0 : 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-soft)' }} />
          <input
            type="text" className="field-input"
            placeholder={activeTab === 'clients' ? "Nom, téléphone, commune..." : "Réf, client, téléphone..."}
            value={search}
            onChange={e => { setSearch(e.target.value); resetClientPage(); resetYesterdayPage(); }}
            style={{ paddingLeft: 44, height: 44, borderRadius: 12 }}
          />
        </div>
        {activeTab === 'clients' && (
          <button className="btn-orange" onClick={exportClients} style={{ height: 44, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontSize: 12 }}>
            <Download size={14} /> Export Clients
          </button>
        )}
        {activeTab === 'orders' && (
          <button className="btn-orange" onClick={exportToExcel} style={{ height: 44, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontSize: 12 }}>
            <Download size={14} /> Export Excel
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 0 14px', flexWrap: 'wrap' }}>
        {[
          { value: 'today', label: "Aujourd'hui" },
          { value: 'yesterday', label: 'Hier' },
          { value: 'week', label: '7 jours' },
          { value: 'month', label: 'Ce mois' },
          { value: 'custom', label: 'Personnalisé' },
          { value: 'all', label: 'Tout' },
        ].map(option => (
          <button
            key={option.value}
            onClick={() => applyDatePreset(option.value as DatePreset)}
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 8,
              border: datePreset === option.value ? '1.5px solid var(--orange)' : '1px solid var(--line)',
              background: datePreset === option.value ? 'var(--orange-soft)' : 'white',
              color: datePreset === option.value ? 'var(--orange)' : 'var(--ink)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        ))}

        {datePreset === 'custom' && (
          <>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); resetClientPage(); resetYesterdayPage(); }}
              style={{ height: 34, borderRadius: 8, border: '1px solid var(--line)', padding: '0 10px', fontSize: 12, fontWeight: 700 }}
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); resetClientPage(); resetYesterdayPage(); }}
              style={{ height: 34, borderRadius: 8, border: '1px solid var(--line)', padding: '0 10px', fontSize: 12, fontWeight: 700 }}
            />
          </>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8E8E93', fontWeight: 700 }}>
          {ordersInSelectedRange.length} commande(s)
        </span>
      </div>

      {/* ADVANCED FILTERS (clients tab only) */}
      {activeTab === 'clients' && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 0 20px', flexWrap: 'wrap' }}>
          <select
            value={communeFilter}
            onChange={e => { setCommuneFilter(e.target.value); resetClientPage(); }}
            style={{ height: 36, borderRadius: 8, border: '1px solid var(--line)', padding: '0 12px', fontSize: 12, fontWeight: 600, background: communeFilter !== 'all' ? 'var(--orange-soft)' : 'white', color: communeFilter !== 'all' ? 'var(--orange)' : 'var(--ink)', minWidth: 140 }}
          >
            <option value="all">Toutes les communes</option>
            {communes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <input
            type="number" placeholder="Cmd min." min="0"
            value={ordersMin}
            onChange={e => { setOrdersMin(e.target.value); resetClientPage(); }}
            style={{ height: 36, width: 100, borderRadius: 8, border: '1px solid var(--line)', padding: '0 10px', fontSize: 12, fontWeight: 600 }}
          />

          <input
            type="number" placeholder="CA min. (F)" min="0" step="1000"
            value={spentMin}
            onChange={e => { setSpentMin(e.target.value); resetClientPage(); }}
            style={{ height: 36, width: 130, borderRadius: 8, border: '1px solid var(--line)', padding: '0 10px', fontSize: 12, fontWeight: 600 }}
          />

          {hasActiveFilters && (
            <button
              onClick={() => { setCommuneFilter('all'); setOrdersMin(''); setSpentMin(''); applyDatePreset('today'); resetClientPage(); }}
              style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#FF3B30' }}
            >
              <X size={12} /> Réinitialiser
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#8E8E93', fontWeight: 600 }}>
            {totalFilteredClients} résultat(s)
          </span>
        </div>
      )}

      {/* ──────── TAB: ANNUAIRE CLIENTS ──────── */}
      {activeTab === 'clients' && (
        <>
          <TableCard title="Annuaire Clients" meta={`Page ${clientPage}/${clientTotalPages || 1} · ${totalFilteredClients} client(s)`}>
            {paginatedClients.length === 0 ? (
              <EmptyState icon="👥" title="Aucun client trouvé" description="Essayez de modifier vos filtres." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Client <SortIcon col="name" />
                    </th>
                    <th>Coordonnées</th>
                    <th onClick={() => toggleSort('commune')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Commune <SortIcon col="commune" />
                    </th>
                    <th onClick={() => toggleSort('totalOrders')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Commandes <SortIcon col="totalOrders" />
                    </th>
                    <th onClick={() => toggleSort('totalSpent')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Total Dépensé <SortIcon col="totalSpent" />
                    </th>
                    <th onClick={() => toggleSort('lastOrderAt')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Dernier Achat <SortIcon col="lastOrderAt" />
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClients.map((c: any) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
                            <UserIcon size={16} />
                          </div>
                          <div className="cell-strong">{c.name}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <Phone size={12} className="cell-muted" />{c.phone}
                        </div>
                        {c.phone2 && <div className="cell-muted" style={{ fontSize: 11, marginTop: 2 }}>{c.phone2}</div>}
                      </td>
                      <td>
                        {c.commune ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <MapPin size={12} className="cell-muted" />{c.commune}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ShoppingBag size={12} className="cell-muted" />
                          <strong>{c.totalOrders}</strong>
                        </div>
                      </td>
                      <td><span className="cell-price">{formatPrice(c.totalSpent)}</span></td>
                      <td><span className="cell-muted">{formatDay(c.lastOrderAt)}</span></td>
                      <td>
                        <button className="action-btn" onClick={() => handleDelete(c.id, c.name)} title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TableCard>
          <Pagination page={clientPage} totalPages={clientTotalPages} setPage={setClientPage} />
        </>
      )}

      {/* ──────── TAB: ACHATS PAR PERIODE ──────── */}
      {activeTab === 'orders' && (
        <>
          <TableCard
            title="Clients ayant commandé"
            meta={`Page ${yesterdayPage}/${yesterdayTotalPages || 1} · ${totalFilteredYesterday} commande(s) · ${formatPrice(allFilteredYesterday.reduce((s: number, o: any) => s + o.total, 0))} CA`}
          >
            {paginatedYesterday.length === 0 ? (
              <EmptyState icon="Calendrier" title="Aucun achat" description="Aucune commande sur cette période." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Réf</th>
                    <th>Client</th>
                    <th>Téléphone</th>
                    <th>Commune</th>
                    <th>Articles</th>
                    <th>Total</th>
                    <th>Commercial</th>
                    <th>Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedYesterday.map((o: any) => (
                    <tr key={o.id}>
                      <td><span className="cell-mono" style={{ color: 'var(--orange)', fontWeight: 700 }}>{o.ref}</span></td>
                      <td>
                        <div className="cell-strong">{o.customerName}</div>
                        {o.customerLocation && (
                          <div className="cell-muted" style={{ fontSize: 10, marginTop: 2 }}>
                            <MapPin size={10} style={{ display: 'inline', verticalAlign: -1, marginRight: 2 }} />{o.customerLocation}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{o.customerPhone}</div>
                        {o.customerPhone2 && <div className="cell-muted" style={{ fontSize: 10 }}>{o.customerPhone2}</div>}
                      </td>
                      <td>
                        {o.commune ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                            <MapPin size={11} className="cell-muted" />{o.commune}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {o.items.slice(0, 3).map((item: any, i: number) => (
                            <div key={i} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Package size={10} className="cell-muted" />
                              <span>{item.name}</span>
                              <span className="cell-muted">({item.size}/{item.color})</span>
                              <strong>×{item.qty}</strong>
                            </div>
                          ))}
                          {o.items.length > 3 && <span className="cell-muted" style={{ fontSize: 10 }}>+{o.items.length - 3} autre(s)</span>}
                        </div>
                      </td>
                      <td><span className="cell-price">{formatPrice(o.total)}</span></td>
                      <td><span className="cell-muted" style={{ fontSize: 12 }}>{o.commercialName || '—'}</span></td>
                      <td>
                        <span className="cell-muted" style={{ fontSize: 12 }}>
                          {new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TableCard>
          <Pagination page={yesterdayPage} totalPages={yesterdayTotalPages} setPage={setYesterdayPage} />
        </>
      )}
    </div>
  );
}

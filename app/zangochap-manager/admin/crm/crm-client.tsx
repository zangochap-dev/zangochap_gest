"use client";

import React, { useState, useMemo, useTransition, useCallback } from "react";
import { TableCard, EmptyState, StatCard } from "@/components/UI";
import { formatPrice, formatDay } from "@/lib/constants";
import {
  Search, Trash2, User as UserIcon, Phone, MapPin, ShoppingBag,
  Download, Calendar, Package, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, Filter, X
} from "lucide-react";
import { deleteCustomer } from "@/modules/crm/admin_actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

interface CRMClientProps {
  initialCustomers: any[];
  yesterdayBuyers?: any[];
}

type SortKey = 'name' | 'totalOrders' | 'totalSpent' | 'lastOrderAt' | 'commune';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 25;

export default function CRMClient({ initialCustomers, yesterdayBuyers = [] }: CRMClientProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'yesterday'>('clients');
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

  // ── Pagination ──
  const [clientPage, setClientPage] = useState(1);
  const [yesterdayPage, setYesterdayPage] = useState(1);

  // Reset page on filter/search change
  const resetClientPage = () => setClientPage(1);
  const resetYesterdayPage = () => setYesterdayPage(1);

  // ── Communes list (derived) ──
  const communes = useMemo(() => {
    const set = new Set<string>();
    initialCustomers.forEach(c => { if (c.commune) set.add(c.commune); });
    return Array.from(set).sort();
  }, [initialCustomers]);

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
  const { paginatedClients, totalFilteredClients } = useMemo(() => {
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
    return { paginatedClients: result.slice(start, start + PAGE_SIZE), totalFilteredClients: total };
  }, [initialCustomers, search, communeFilter, ordersMin, spentMin, sortKey, sortDir, clientPage]);

  const clientTotalPages = Math.ceil(totalFilteredClients / PAGE_SIZE);

  // ── Yesterday filtering + pagination ──
  const { paginatedYesterday, totalFilteredYesterday, allFilteredYesterday } = useMemo(() => {
    let result = [...yesterdayBuyers];
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
  }, [yesterdayBuyers, search, yesterdayPage]);

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
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `achats_${yesterday.toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`${allFilteredYesterday.length} lignes exportées ✓`, 'success');
  }, [allFilteredYesterday, showToast]);

  // ── Export CRM Clients ──
  const exportClients = useCallback(() => {
    // Export ALL filtered (not just current page)
    let result = [...initialCustomers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.commune?.toLowerCase().includes(q));
    }
    if (communeFilter !== 'all') result = result.filter(c => c.commune === communeFilter);
    if (ordersMin) { const min = parseInt(ordersMin); if (!isNaN(min)) result = result.filter(c => c.totalOrders >= min); }
    if (spentMin) { const min = parseInt(spentMin); if (!isNaN(min)) result = result.filter(c => c.totalSpent >= min); }

    if (result.length === 0) { showToast('Aucun client à exporter', 'error'); return; }

    const headers = ['Nom', 'Téléphone', 'Téléphone 2', 'Commune', 'Adresse', 'Commandes', 'Total Dépensé', 'Dernier Achat'];
    const rows = result.map(c => [
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
    showToast(`${result.length} clients exportés ✓`, 'success');
  }, [initialCustomers, search, communeFilter, ordersMin, spentMin, showToast]);

  const totalRevenue = initialCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpent = initialCustomers.length ? Math.round(totalRevenue / initialCustomers.length) : 0;
  const yesterdayTotal = yesterdayBuyers.reduce((sum, o) => sum + o.total, 0);

  const hasActiveFilters = communeFilter !== 'all' || ordersMin || spentMin;

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
        <StatCard label="Achats d'hier" value={`${yesterdayBuyers.length} cmd · ${formatPrice(yesterdayTotal)}`} color="var(--green)" />
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--cream)', padding: 4, borderRadius: 10, border: '1px solid var(--line)', marginBottom: 20, width: 'fit-content' }}>
        <button onClick={() => { setActiveTab('clients'); resetClientPage(); }} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: activeTab === 'clients' ? 'white' : 'transparent', color: activeTab === 'clients' ? 'var(--ink)' : 'var(--brown-soft)', boxShadow: activeTab === 'clients' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
          <UserIcon size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Annuaire ({initialCustomers.length})
        </button>
        <button onClick={() => { setActiveTab('yesterday'); resetYesterdayPage(); }} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: activeTab === 'yesterday' ? 'white' : 'transparent', color: activeTab === 'yesterday' ? 'var(--orange)' : 'var(--brown-soft)', boxShadow: activeTab === 'yesterday' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
          <Calendar size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Achats d'hier ({yesterdayBuyers.length})
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
        {activeTab === 'yesterday' && (
          <button className="btn-orange" onClick={exportToExcel} style={{ height: 44, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontSize: 12 }}>
            <Download size={14} /> Export Excel
          </button>
        )}
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
              onClick={() => { setCommuneFilter('all'); setOrdersMin(''); setSpentMin(''); resetClientPage(); }}
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

      {/* ──────── TAB: ACHATS D'HIER ──────── */}
      {activeTab === 'yesterday' && (
        <>
          <TableCard
            title="Clients ayant acheté hier"
            meta={`Page ${yesterdayPage}/${yesterdayTotalPages || 1} · ${totalFilteredYesterday} commande(s) · ${formatPrice(allFilteredYesterday.reduce((s: number, o: any) => s + o.total, 0))} CA`}
          >
            {paginatedYesterday.length === 0 ? (
              <EmptyState icon="📅" title="Aucun achat hier" description="Aucune commande n'a été enregistrée hier." />
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

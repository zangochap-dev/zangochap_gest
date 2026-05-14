"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { StatCard, TableCard, DetailCard, StatusBadge } from '@/components/UI';
import Modal from '@/components/Modal';
import { TrendingUp, Truck, Users, ShoppingBag, Target, Star, Calendar, Package, Eye, Search, X, Loader2, Award } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { getUserPerformanceDetails } from '@/modules/orders/actions';
import "./performance-client.css";

interface PerformanceClientProps {
  stats: {
    commercialsStats: any[];
    deliveryStats: any[];
    collectorStats: any[];
    packingStats: any[];
    summary: {
      totalRevenue: number;
      totalOrders: number;
      avgOrderValue: number;
      globalSuccessRate: number;
    };
  };
}

export default function PerformanceClient({ stats }: PerformanceClientProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; role: string } | null>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const router = useRouter();

  const setQuickDate = (range: 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'all') => {
    const now = new Date();
    let from = '';
    let to = now.toISOString().split('T')[0];

    if (range === 'today') {
      from = to;
    } else if (range === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      from = y.toISOString().split('T')[0];
      to = from;
    } else if (range === 'week') {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      from = w.toISOString().split('T')[0];
    } else if (range === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else if (range === 'lastMonth') {
      const lmFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lmTo = new Date(now.getFullYear(), now.getMonth(), 0);
      from = lmFrom.toISOString().split('T')[0];
      to = lmTo.toISOString().split('T')[0];
    } else if (range === 'all') {
      from = '';
      to = '';
    }

    setDateFrom(from);
    setDateTo(to);
  };

  // Update URL when dates change to trigger server re-fetch
  React.useEffect(() => {
    if (dateFrom || dateTo) {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      router.push(`/zangochap-manager/admin/performance?${params.toString()}`);
    }
  }, [dateFrom, dateTo, router]);

  const handleViewDetails = useCallback(async (member: any, role: string) => {
    setSelectedMember({ ...member, role });
    setIsLoadingDetails(true);
    try {
      const details = await getUserPerformanceDetails(member.id, role, dateFrom, dateTo);
      setMemberDetails(details);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [dateFrom, dateTo]);

  const filteredStats = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return {
      commercials: stats.commercialsStats.filter(c => c.name.toLowerCase().includes(s)),
      delivery: stats.deliveryStats.filter(d => d.name.toLowerCase().includes(s)),
      collectors: stats.collectorStats.filter(c => c.name.toLowerCase().includes(s)),
      packing: stats.packingStats.filter(p => p.name.toLowerCase().includes(s)),
    };
  }, [stats, searchTerm]);

  return (
    <div className="content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>Équipe & Performance</h1>
          <p style={{ color: 'var(--brown-soft)', fontSize: 14 }}>Analyse détaillée de l'activité par collaborateur.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ width: 220 }}>
            <Search size={16} color="var(--brown-soft)" />
            <input 
              type="text" 
              placeholder="Rechercher un membre..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters-bar" style={{ margin: 0, padding: '4px 12px', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--cream)', padding: '2px 6px', borderRadius: 10, border: '1px solid var(--line)' }}>
              <button className={`shortcut-btn ${!dateFrom && !dateTo ? 'active' : ''}`} onClick={() => setQuickDate('all')}>Tout</button>
              <button className="shortcut-btn" onClick={() => setQuickDate('today')}>Aujourd'hui</button>
              <button className="shortcut-btn" onClick={() => setQuickDate('month')}>Mois</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="date" className="filter-date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span style={{ color: 'var(--line)', fontSize: 10 }}>→</span>
              <input type="date" className="filter-date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard 
          label="Chiffre d'Affaires" 
          value={formatPrice(stats.summary.totalRevenue)} 
          icon={<TrendingUp size={20} />}
          accent
        />
        <StatCard 
          label="Commandes Totales" 
          value={stats.summary.totalOrders} 
          icon={<ShoppingBag size={20} />}
        />
        <StatCard 
          label="Panier Moyen (Livré)" 
          value={formatPrice(stats.summary.avgOrderValue)} 
          icon={<Award size={20} />}
        />
        <StatCard 
          label="Réussite Livraison" 
          value={`${stats.summary.globalSuccessRate}%`} 
          icon={<Target size={20} />}
        />
      </div>

      <div className="role-selector" style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {['ALL', 'COMMERCIAL', 'LIVREUR', 'COLLECTION', 'PACKING'].map(role => (
          <button 
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`role-btn ${roleFilter === role ? 'active' : ''}`}
          >
            {role === 'ALL' ? 'Tous les services' : 
             role === 'COMMERCIAL' ? 'Call Center' :
             role === 'LIVREUR' ? 'Livreurs' :
             role === 'COLLECTION' ? 'Collecte' : 'Emballage'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
        {/* 1. CALL CENTER (COMMERCIALS) */}
        {(roleFilter === 'ALL' || roleFilter === 'COMMERCIAL') && (
          <TableCard 
            title="Performance Call Center" 
            meta={`${filteredStats.commercials.length} commerciaux actifs`}
          >
            <table>
              <thead>
                <tr>
                  <th>Commercial</th>
                  <th>Total</th>
                  <th>Livrées</th>
                  <th>CA Livré</th>
                  <th>Taux</th>
                  <th>Prime (1%)</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.commercials.sort((a, b) => b.revenue - a.revenue).map((c, i) => {
                  const conv = c.sales ? Math.round(c.delivered / c.sales * 100) : 0;
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: i === 0 ? 'var(--orange)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: i === 0 ? 'white' : 'var(--brown)' }}>
                            {i + 1}
                          </div>
                          <span className="cell-strong">{c.name}</span>
                        </div>
                      </td>
                      <td>{c.sales}</td>
                      <td><span style={{ color: 'var(--green)', fontWeight: 600 }}>{c.delivered}</span></td>
                      <td><span className="cell-price">{formatPrice(c.revenue)}</span></td>
                      <td><strong>{conv}%</strong></td>
                      <td><div style={{ color: 'var(--orange)', fontWeight: 700 }}>{formatPrice(c.revenue * 0.01)}</div></td>
                      <td>
                        <button className="icon-btn-small" onClick={() => handleViewDetails(c, 'COMMERCIAL')}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableCard>
        )}

        {/* 2. PACKING PERFORMANCE */}
        {(roleFilter === 'ALL' || roleFilter === 'PACKING') && (
          <TableCard 
            title="Service Emballage" 
            meta="Vitesse et précision des colis"
          >
            <table>
              <thead>
                <tr>
                  <th>Emballeur</th>
                  <th>Colis</th>
                  <th>Partiels</th>
                  <th>Erreurs</th>
                  <th>Score</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.packing.map((p, i) => (
                  <tr key={i}>
                    <td><span className="cell-strong">{p.name}</span></td>
                    <td><div className="cell-strong">{p.packed}</div></td>
                    <td><span style={{ color: 'var(--amber)' }}>{p.partial || 0}</span></td>
                    <td><span style={{ color: 'var(--red)' }}>{p.errors || 0}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--line)', borderRadius: 2, width: 60, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(0, 100 - (p.errors * 10))}%`, height: '100%', background: 'var(--blue)' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{Math.max(0, 100 - (p.errors * 10))}%</span>
                      </div>
                    </td>
                    <td>
                      <button className="icon-btn-small" onClick={() => handleViewDetails(p, 'PACKING')}>
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {/* 3. COLLECTION PERFORMANCE */}
        {(roleFilter === 'ALL' || roleFilter === 'COLLECTION') && (
          <TableCard 
            title="Service Collecte" 
            meta="Taux de récupération articles"
          >
            <table>
              <thead>
                <tr>
                  <th>Collecteur</th>
                  <th>Collectés</th>
                  <th>Indispos</th>
                  <th>Total</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.collectors.sort((a, b) => b.count - a.count).map((c, i) => (
                  <tr key={i}>
                    <td><span className="cell-strong">{c.name}</span></td>
                    <td><span style={{ color: 'var(--green)', fontWeight: 600 }}>{c.collected}</span></td>
                    <td><span style={{ color: 'var(--red)' }}>{c.unavailable}</span></td>
                    <td><strong>{c.count}</strong></td>
                    <td>
                      <button className="icon-btn-small" onClick={() => handleViewDetails(c, 'COLLECTION')}>
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {/* 4. DELIVERY PERFORMANCE */}
        {(roleFilter === 'ALL' || roleFilter === 'LIVREUR') && (
          <TableCard 
            title="Performance Livreurs" 
            meta="Taux de réussite des livraisons"
          >
            <table>
              <thead>
                <tr>
                  <th>Livreur</th>
                  <th>Sortis</th>
                  <th>Livrés</th>
                  <th>Taux</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.delivery.sort((a, b) => b.successRate - a.successRate).map((d, i) => (
                  <tr key={i}>
                    <td><span className="cell-strong">{d.name}</span></td>
                    <td>{d.total}</td>
                    <td><span style={{ color: 'var(--green)', fontWeight: 600 }}>{d.delivered}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--line)', borderRadius: 2, width: 60, overflow: 'hidden' }}>
                          <div style={{ width: `${d.successRate}%`, height: '100%', background: d.successRate > 90 ? 'var(--green)' : d.successRate > 70 ? 'var(--orange)' : 'var(--red)' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{d.successRate}%</span>
                      </div>
                    </td>
                    <td>
                      <button className="icon-btn-small" onClick={() => handleViewDetails(d, 'LIVREUR')}>
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}
      </div>

      {selectedMember && (
        <Modal 
          isOpen={true} 
          onClose={() => { setSelectedMember(null); setMemberDetails(null); }}
          title={`Performance de ${selectedMember.name}`}
        >
          <div style={{ minHeight: 300 }}>
            {isLoadingDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
                <Loader2 className="animate-spin" size={32} color="var(--orange)" />
                <p style={{ color: 'var(--brown-soft)', fontSize: 14 }}>Chargement des détails...</p>
              </div>
            ) : memberDetails ? (
              <div className="member-details">
                <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                  <div style={{ padding: 16, background: 'var(--cream)', borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 11, color: 'var(--brown-soft)', textTransform: 'uppercase', marginBottom: 4 }}>Volume total</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--brown)' }}>
                      {selectedMember.role === 'COLLECTION' ? memberDetails.records?.length : memberDetails.orders?.length || 0}
                    </div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--cream)', borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 11, color: 'var(--brown-soft)', textTransform: 'uppercase', marginBottom: 4 }}>Période</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown)' }}>
                      {dateFrom ? formatDate(dateFrom) : 'Ce mois'}
                    </div>
                  </div>
                  <div style={{ padding: 16, background: 'var(--orange-soft)', borderRadius: 12, border: '1px solid var(--orange)' }}>
                    <div style={{ fontSize: 11, color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 4 }}>Rôle</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--orange)' }}>{selectedMember.role}</div>
                  </div>
                </div>

                <div className="table-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr style={{ position: 'sticky', top: 0, background: 'var(--cream)', zIndex: 1 }}>
                        <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Référence / Action</th>
                        <th style={{ textAlign: 'right', padding: 8 }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(memberDetails.orders || memberDetails.records)?.map((item: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: 8, color: 'var(--brown-soft)' }}>
                            {formatDate(item.createdAt || item.packedAt)}
                          </td>
                          <td style={{ padding: 8 }}>
                            <div style={{ fontWeight: 600 }}>{item.ref || item.action || '—'}</div>
                            {item.customerName && <div style={{ fontSize: 10, color: 'var(--brown-soft)' }}>{item.customerName}</div>}
                          </td>
                          <td style={{ padding: 8, textAlign: 'right' }}>
                            <StatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p>Aucune donnée disponible.</p>
              </div>
            )}
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setSelectedMember(null)}>Fermer</button>
          </div>
        </Modal>
      )}

      
    </div>
  );
}

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TableCard, LocationBadge } from "@/components/UI";
import { Package, AlertTriangle, ArrowRight, Search, Filter, RefreshCw, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./inventory.module.css";

const ITEMS_PER_PAGE = 30;

export default function InventoryClient({ initialProducts }: { initialProducts: any[] }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  // Debounce search — 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(interval);
  }, [router]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [zoneFilter]);
  
  const lowStockThreshold = 5; // Fallback

  const zones = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach(p => {
      if (p.location) {
        const z = p.location.charAt(0).toUpperCase();
        if (/[A-Z]/.test(z)) set.add(z);
      }
      p.variants?.forEach((v: any) => {
        if (v.location) {
          const z = v.location.charAt(0).toUpperCase();
          if (/[A-Z]/.test(z)) set.add(z);
        }
      });
    });
    return Array.from(set).sort();
  }, [initialProducts]);

  const filtered = useMemo(() => {
    return initialProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                           p.supplier?.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const pZone = p.location?.charAt(0).toUpperCase();
      const hasVariantInZone = p.variants?.some((v: any) => v.location?.charAt(0).toUpperCase() === zoneFilter);
      const matchesZone = zoneFilter === 'all' || pZone === zoneFilter || hasVariantInZone;
      
      return matchesSearch && matchesZone;
    });
  }, [initialProducts, debouncedSearch, zoneFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const lowStockItems = filtered.filter(p => p.stock <= p.lowStockThreshold);

  return (
    <div className={`${styles.content} animate-fade-in`}>
      {/* STATS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Valeur du stock</div>
          <div className={styles.statValue}>
            {filtered.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()} FCFA
          </div>
        </div>
        <div className={`${styles.statCard} ${lowStockItems.length > 0 ? styles.statCardWarning : ''}`}>
          <div className={styles.statLabel}>Alertes (Filtre actuel)</div>
          <div className={styles.statValue}>{lowStockItems.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total articles</div>
          <div className={styles.statValue}>{filtered.reduce((acc, p) => acc + p.stock, 0)}</div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-soft)' }} />
          <input 
            className="field-input" 
            placeholder="Rechercher un produit ou fournisseur..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, paddingRight: 40 }}
          />
          {search && (
            <button 
              onClick={() => setSearch('')} 
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: '#dee2e6', border: 'none', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} style={{ color: 'var(--brown-soft)' }} />
          <select className="field-input" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} style={{ width: 140 }}>
            <option value="all">Toutes les zones</option>
            {zones.map(z => <option key={z} value={z}>Zone {z}</option>)}
          </select>
          <button className="btn-secondary" onClick={() => router.refresh()} title="Actualiser" style={{ padding: '8px 10px' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <TableCard title="État des stocks" meta={`${filtered.length} produit(s) · Page ${currentPage}/${totalPages}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Emplacement</th>
              <th>Stock Total</th>
              <th>Variantes</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--brown-soft)' }}>Aucun résultat</td></tr>
            ) : (
              paginated.map((p) => {
                const isLow = p.stock <= p.lowStockThreshold;
                return (
                  <tr key={p.id} className={isLow ? styles.rowWarning : ''}>
                    <td>
                      <div className="cell-strong">{p.name}</div>
                      <div className="cell-muted">{p.supplier?.name || 'Fournisseur inconnu'}</div>
                    </td>
                    <td><span className={styles.catBadge}>{p.category?.name || 'Général'}</span></td>
                    <td><LocationBadge location={p.location} /></td>
                    <td>
                      <div className={`${styles.stockBadge} ${isLow ? styles.stockBadgeLow : p.stock === 0 ? styles.stockBadgeOut : ''}`}>
                        {p.stock} pces
                      </div>
                    </td>
                    <td>
                      <div className={styles.variantDots}>
                        {p.variants.map((v: any, i: number) => (
                          <span key={i} title={`${v.size} - ${v.color}: ${v.stock} @ ${v.location || '?'}`} className={styles.vDot} style={{ background: v.stock === 0 ? 'var(--red)' : 'var(--orange)' }}></span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {isLow ? (
                        <span className={styles.statusWarn}>Stock bas</span>
                      ) : p.stock === 0 ? (
                        <span className={styles.statusErr}>Rupture</span>
                      ) : (
                        <span className={styles.statusOk}>Disponible</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderTop: '1px solid var(--line)', background: 'var(--cream)' }}>
            <div style={{ fontSize: 12, color: 'var(--brown-soft)', fontWeight: 500 }}>
              {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="action-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} style={{ opacity: currentPage <= 1 ? 0.3 : 1 }}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: currentPage === page ? 'var(--ink)' : 'white', color: currentPage === page ? 'white' : 'var(--brown)', boxShadow: currentPage === page ? 'none' : '0 1px 2px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}>
                    {page}
                  </button>
                );
              })}
              <button className="action-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} style={{ opacity: currentPage >= totalPages ? 0.3 : 1 }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </TableCard>
    </div>
  );
}

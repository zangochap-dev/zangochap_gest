"use client";

import React, { useState, useMemo } from 'react';
import { TableCard } from '@/components/UI';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle, 
  Warehouse as WarehouseIcon, 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Tag,
  ArrowRight
} from 'lucide-react';
import { formatDate } from '@/lib/constants';
import { StockMovement } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface StockHistoryClientProps {
  movements: StockMovement[];
  warehouses: any[];
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function StockHistoryClient({ movements, warehouses }: StockHistoryClientProps) {
  // --- States ---
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // --- Helpers ---
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SALE': return { color: 'var(--red)', label: 'Vente', icon: <ArrowUpRight size={12} />, bg: 'var(--red-soft)' };
      case 'RESTOCK': return { color: 'var(--green)', label: 'Réappro.', icon: <ArrowDownLeft size={12} />, bg: 'var(--green-soft)' };
      case 'RETURN': return { color: 'var(--amber)', label: 'Retour', icon: <ArrowDownLeft size={12} />, bg: 'var(--amber-soft)' };
      case 'EXCHANGE': return { color: 'var(--blue)', label: 'Échange', icon: <History size={12} />, bg: 'var(--blue-soft)' };
      case 'ADJUSTMENT': return { color: '#6366F1', label: 'Ajustement', icon: <AlertCircle size={12} />, bg: '#EEF2FF' };
      default: return { color: 'var(--brown-soft)', label: type, icon: <AlertCircle size={12} />, bg: 'var(--cream)' };
    }
  };

  // --- Filtering Logic ---
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesSearch = 
        m.variant.product.name.toLowerCase().includes(search.toLowerCase()) ||
        m.variant.size.toLowerCase().includes(search.toLowerCase()) ||
        m.variant.color.toLowerCase().includes(search.toLowerCase()) ||
        m.byName.toLowerCase().includes(search.toLowerCase()) ||
        (m.orderId && m.orderId.toLowerCase().includes(search.toLowerCase()));

      const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
      const matchesWarehouse = warehouseFilter === 'ALL' || m.warehouseId === warehouseFilter;
      
      const mDate = new Date(m.createdAt);
      const matchesStart = !startDate || mDate >= new Date(startDate);
      const matchesEnd = !endDate || mDate <= new Date(endDate + 'T23:59:59');

      return matchesSearch && matchesType && matchesWarehouse && matchesStart && matchesEnd;
    });
  }, [movements, search, typeFilter, warehouseFilter, startDate, endDate]);

  // --- Pagination Logic ---
  const totalItems = filteredMovements.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Reset Filters ---
  const resetFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setWarehouseFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasFilters = search || typeFilter !== 'ALL' || warehouseFilter !== 'ALL' || startDate || endDate;

  return (
    <div className="content animate-fade-in" style={{ padding: '24px 32px' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--orange-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
              <History size={24} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>Historique des Stocks</h1>
          </div>
          <p style={{ color: 'var(--brown-soft)', fontSize: 14, margin: 0 }}>Traçabilité et audit en temps réel de votre inventaire.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           {/* Add export button here if needed */}
        </div>
      </div>

      {/* FILTERS CARD */}
      <div style={{ 
        background: 'white', 
        border: '1px solid var(--line)', 
        borderRadius: 20, 
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* SEARCH */}
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--brown-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Recherche</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-soft)', opacity: 0.5 }} />
              <input 
                type="text" 
                placeholder="Produit, auteur, CMD..." 
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ 
                  width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, 
                  background: 'var(--cream)', border: '1px solid var(--line)',
                  color: 'var(--ink)', fontSize: 13, outline: 'none'
                }}
              />
            </div>
          </div>

          {/* TYPE */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--brown-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Type de mouvement</label>
            <select 
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              style={{ 
                width: '100%', padding: '10px 12px', borderRadius: 10, 
                background: 'var(--cream)', border: '1px solid var(--line)',
                color: 'var(--ink)', fontSize: 13, outline: 'none'
              }}
            >
              <option value="ALL">Tous les types</option>
              <option value="SALE">Ventes</option>
              <option value="RESTOCK">Réapprovisionnement</option>
              <option value="RETURN">Retours</option>
              <option value="EXCHANGE">Échanges</option>
              <option value="ADJUSTMENT">Ajustements</option>
            </select>
          </div>

          {/* WAREHOUSE */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--brown-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Entrepôt</label>
            <select 
              value={warehouseFilter}
              onChange={e => { setWarehouseFilter(e.target.value); setCurrentPage(1); }}
              style={{ 
                width: '100%', padding: '10px 12px', borderRadius: 10, 
                background: 'var(--cream)', border: '1px solid var(--line)',
                color: 'var(--ink)', fontSize: 13, outline: 'none'
              }}
            >
              <option value="ALL">Tous les sites</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* DATES */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--brown-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Période (Du/Au)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="date" 
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                style={{ 
                  flex: 1, padding: '10px 8px', borderRadius: 10, 
                  background: 'var(--cream)', border: '1px solid var(--line)',
                  color: 'var(--ink)', fontSize: 12, outline: 'none'
                }}
              />
              <input 
                type="date" 
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                style={{ 
                  flex: 1, padding: '10px 8px', borderRadius: 10, 
                  background: 'var(--cream)', border: '1px solid var(--line)',
                  color: 'var(--ink)', fontSize: 12, outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={resetFilters}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
                color: '#F97316', background: 'rgba(249,115,22,0.1)', border: 'none',
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer'
              }}
            >
              <X size={14} /> Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* DATA TABLE */}
      <TableCard 
        title="Journal des mouvements" 
        meta={`${totalItems} mouvement(s) trouvé(s) ${hasFilters ? 'sur ce filtre' : ''}`}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: 'var(--brown-soft)', borderBottom: '1px solid var(--line)' }}>DATE</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: 'var(--brown-soft)', borderBottom: '1px solid var(--line)' }}>PRODUIT / VARIANTE</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: 'var(--brown-soft)', borderBottom: '1px solid var(--line)' }}>ENTREPÔT</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: 'var(--brown-soft)', borderBottom: '1px solid var(--line)' }}>TYPE</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--brown-soft)', borderBottom: '1px solid var(--line)' }}>QTÉ</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: 'var(--brown-soft)', borderBottom: '1px solid var(--line)' }}>AUTEUR</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: 'var(--brown-soft)', borderBottom: '1px solid var(--line)' }}>RÉFÉRENCE</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paginatedMovements.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{ opacity: 0.3, marginBottom: 12 }}><History size={48} style={{ margin: '0 auto' }} /></div>
                      <p style={{ color: 'var(--brown-soft)', fontWeight: 600 }}>Aucun mouvement trouvé pour ces critères.</p>
                    </td>
                  </motion.tr>
                ) : (
                  paginatedMovements.map((m, i) => {
                    const badge = getTypeBadge(m.type);
                    return (
                      <motion.tr 
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        style={{ borderBottom: '1px solid var(--line)' }}
                      >
                        <td style={{ padding: '16px 20px' }}><div className="cell-muted">{formatDate(m.createdAt)}</div></td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                              {m.variant.product.emoji || '📦'}
                            </div>
                            <div>
                              <div className="cell-strong">{m.variant.product.name}</div>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ fontSize: 10, background: 'var(--cream-2)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{m.variant.size}</span>
                                <span className="cell-muted" style={{ fontSize: 11 }}>{m.variant.color}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <WarehouseIcon size={14} style={{ color: 'var(--orange)' }} />
                            <span className="cell-strong">{m.warehouse?.name || 'Inconnu'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            color: badge.color, fontSize: 11, fontWeight: 800,
                            background: badge.bg, padding: '4px 10px',
                            borderRadius: 20, width: 'fit-content',
                            textTransform: 'uppercase', letterSpacing: '0.02em'
                          }}>
                            {badge.icon} {badge.label}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <div style={{ 
                            fontSize: 16, 
                            fontWeight: 900, 
                            color: m.quantity > 0 ? 'var(--green)' : 'var(--red)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40, height: 32,
                            borderRadius: 8,
                            background: m.quantity > 0 ? 'var(--green-soft)' : 'var(--red-soft)'
                          }}>
                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                             <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                                {m.byName.charAt(0)}
                             </div>
                             <div className="cell-strong" style={{ fontSize: 13 }}>{m.byName}</div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {m.orderId ? (
                            <div style={{ 
                              color: 'var(--blue)', 
                              fontWeight: 700, 
                              fontSize: 12, 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 4,
                              background: 'var(--blue-soft)',
                              padding: '4px 8px',
                              borderRadius: 6,
                              width: 'fit-content'
                            }}>
                              <Tag size={12} /> {m.orderId.substring(0, 8).toUpperCase()}
                            </div>
                          ) : (
                            <div className="cell-muted" style={{ fontSize: 12 }}>{m.reason || '—'}</div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* PAGINATION SECTION */}
        <div style={{ 
          padding: '20px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(0,0,0,0.01)',
          borderTop: '1px solid var(--line)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--brown-soft)', fontWeight: 600 }}>
              Affichage de <span style={{ color: 'var(--ink)' }}>{Math.min(startIndex + 1, totalItems)}</span> à <span style={{ color: 'var(--ink)' }}>{Math.min(startIndex + pageSize, totalItems)}</span> sur <span style={{ color: 'var(--ink)' }}>{totalItems}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--brown-soft)', fontWeight: 600 }}>Lignes :</span>
              <select 
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{ 
                  padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)',
                  background: 'white', fontSize: 12, fontWeight: 700, outline: 'none'
                }}
              >
                {PAGE_SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              className="action-btn"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              style={{ opacity: currentPage === 1 ? 0.3 : 1 }}
            >
              <ChevronLeft size={18} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              // Show max 5 pages, with current in middle if possible
              if (totalPages > 7) {
                if (page > 1 && page < totalPages && (page < currentPage - 1 || page > currentPage + 1)) {
                  if (page === 2 || page === totalPages - 1) return <span key={page} style={{ padding: '0 4px', color: 'var(--brown-soft)' }}>...</span>;
                  return null;
                }
              }
              
              return (
                <button 
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{ 
                    width: 34, height: 34, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, border: 'none',
                    background: currentPage === page ? 'var(--ink)' : 'white',
                    color: currentPage === page ? 'white' : 'var(--brown)',
                    boxShadow: currentPage === page ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {page}
                </button>
              );
            })}

            <button 
              className="action-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{ opacity: (currentPage === totalPages || totalPages === 0) ? 0.3 : 1 }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </TableCard>

      <style jsx>{`
        .action-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .action-btn:hover:not(:disabled) {
          background: var(--cream);
          transform: translateY(-1px);
        }
        .action-btn:disabled {
          cursor: not-allowed;
          background: var(--line);
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

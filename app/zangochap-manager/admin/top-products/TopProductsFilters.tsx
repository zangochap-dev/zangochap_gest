"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Filter, Users, Tag, AlertCircle, RotateCcw } from 'lucide-react';

interface TopProductsFiltersProps {
  commercials: any[];
  types: string[];
  statuses: [string, string][];
  currentFilters: {
    commercialId?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export default function TopProductsFilters({ commercials, types, statuses, currentFilters }: TopProductsFiltersProps) {
  const router = useRouter();

  const updateFilters = (newFilters: any) => {
    const params = new URLSearchParams();
    const combined = { ...currentFilters, ...newFilters };
    
    Object.entries(combined).forEach(([key, value]) => {
      if (value) params.set(key, value as string);
    });
    
    router.push(`/zangochap-manager/admin/top-products?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push('/zangochap-manager/admin/top-products');
  };

  const hasFilters = Object.values(currentFilters).some(v => v);

  // Inline styles for better compatibility
  const selectStyle = {
    width: '100%',
    height: '38px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid var(--line)',
    background: 'var(--cream)',
    color: 'var(--brown)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const labelStyle = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    fontSize: 10, 
    fontWeight: 700, 
    color: 'var(--brown-soft)', 
    marginBottom: 6, 
    textTransform: 'uppercase' as const 
  };

  return (
    <div className="filters-container" style={{ 
      background: 'white', 
      padding: '16px 20px', 
      borderRadius: 16, 
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      marginBottom: 24,
      border: '1px solid var(--line)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Filter size={18} color="var(--orange)" />
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--brown)' }}>Affiner l'analyse</h3>
        {hasFilters && (
          <button 
            onClick={resetFilters}
            style={{ 
              marginLeft: 'auto', 
              fontSize: 11, 
              color: 'var(--brown-soft)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={12} /> Réinitialiser
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {/* COMMERCIAL */}
        <div className="filter-group">
          <label style={labelStyle}>
            <Users size={12} /> Commercial
          </label>
          <select 
            value={currentFilters.commercialId || ''} 
            onChange={e => updateFilters({ commercialId: e.target.value })}
            style={selectStyle}
          >
            <option value="">Tous les commerciaux</option>
            {commercials.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* TYPE */}
        <div className="filter-group">
          <label style={labelStyle}>
            <Tag size={12} /> Type d'ordre
          </label>
          <select 
            value={currentFilters.type || ''} 
            onChange={e => updateFilters({ type: e.target.value })}
            style={selectStyle}
          >
            <option value="">Tous les types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* STATUS */}
        <div className="filter-group">
          <label style={labelStyle}>
            <AlertCircle size={12} /> Statut final
          </label>
          <select 
            value={currentFilters.status || ''} 
            onChange={e => updateFilters({ status: e.target.value })}
            style={selectStyle}
          >
            <option value="">Tous (hors annulés)</option>
            {statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>

        {/* DATE RANGE */}
        <div className="filter-group" style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>
            <Calendar size={12} /> Période d'analyse
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="date" 
              style={selectStyle}
              value={currentFilters.dateFrom || ''} 
              onChange={e => updateFilters({ dateFrom: e.target.value })}
            />
            <span style={{ color: 'var(--line)' }}>→</span>
            <input 
              type="date" 
              style={selectStyle}
              value={currentFilters.dateTo || ''} 
              onChange={e => updateFilters({ dateTo: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

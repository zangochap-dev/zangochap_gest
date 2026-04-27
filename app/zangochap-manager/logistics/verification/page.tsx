"use client";

import React, { useState, useMemo, useTransition, useEffect } from "react";
import Topbar from "@/components/Topbar";
import { TableCard, EmptyState, StatCard, StatusBadge } from "@/components/UI";
import { formatDay } from "@/lib/constants";
import { Printer, CheckCircle2, Search, X, Warehouse, MapPin, Loader2 } from "lucide-react";
import { toggleItemVerification } from "@/modules/logistics/actions";
import { useToast } from "@/components/Toast";

export default function VerificationPage() {
  return (
    <>
      <Topbar title="Fiche" subtitle="vérification" />
      <VerificationClient />
    </>
  );
}

function VerificationClient() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all"); // all, checked, unchecked
  const { showToast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/delivery-sheet?date=${date}`);
      const data = await res.json();
      setOrders(data);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  // Load on mount
  useEffect(() => {
    loadOrders();
  }, []);

  const handleToggleCheck = (itemId: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await toggleItemVerification(itemId, !currentStatus);
        // Optimistic update
        setOrders(prev => prev.map(o => ({
          ...o,
          items: o.items.map((i: any) => i.id === itemId ? { ...i, isVerified: !currentStatus } : i)
        })));
        showToast(!currentStatus ? 'Article vérifié ✓' : 'Vérification annulée', 'success');
      } catch (e: any) {
        showToast(e.message || 'Erreur lors de la vérification', 'error');
      }
    });
  };

  const allItems = useMemo(() => {
    const flat: any[] = [];
    orders.forEach(o => {
      o.items?.forEach((item: any) => {
        flat.push({ ...item, order: o });
      });
    });
    return flat;
  }, [orders]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = item.order.ref.toLowerCase().includes(search.toLowerCase()) || 
                            item.order.customerName.toLowerCase().includes(search.toLowerCase()) ||
                            item.name.toLowerCase().includes(search.toLowerCase());
      
      const isChecked = !!item.isVerified;
      if (verificationFilter === 'checked') return matchesSearch && isChecked;
      if (verificationFilter === 'unchecked') return matchesSearch && !isChecked;
      return matchesSearch;
    });
  }, [allItems, search, verificationFilter]);

  const totalItems = allItems.length;
  const checkedCount = allItems.filter(i => i.isVerified).length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  return (
    <div className="content animate-fade-in">
      {/* CONTROLS */}
      <div className="filters-bar no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, background: 'white', padding: '16px 20px', borderRadius: 16, marginBottom: 24, border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)' }}>Date :</label>
          <input type="date" className="filter-date" value={date} onChange={e => setDate(e.target.value)} />
          <button className="btn-orange" onClick={loadOrders} disabled={loading} style={{ height: 38 }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Charger'}
          </button>
        </div>
        
        <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            type="text" 
            placeholder="Rechercher une réf, un client ou un produit..." 
            className="field-input" 
            style={{ paddingLeft: 40, height: 38 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`filter-chip ${verificationFilter === 'all' ? 'active' : ''}`} onClick={() => setVerificationFilter('all')}>Tous</button>
          <button className={`filter-chip ${verificationFilter === 'unchecked' ? 'active' : ''}`} onClick={() => setVerificationFilter('unchecked')}>À vérifier</button>
          <button className={`filter-chip ${verificationFilter === 'checked' ? 'active' : ''}`} onClick={() => setVerificationFilter('checked')}>Vérifiés</button>
        </div>

        {orders.length > 0 && (
          <button className="btn-secondary" onClick={() => window.print()} style={{ height: 38 }}>
            <Printer size={16} /> Imprimer
          </button>
        )}
      </div>

      {/* STATS */}
      {orders.length > 0 && (
        <div className="stats-grid no-print" style={{ marginBottom: 24 }}>
          <StatCard label="Colis du jour" value={orders.length} accent />
          <StatCard label="Articles totaux" value={totalItems} />
          <div className="stat-card" style={{ background: 'white', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--brown-soft)', fontWeight: 600 }}>Vérification terminée</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--orange)' }}>{checkedCount} / {totalItems}</span>
            </div>
            <div style={{ height: 6, background: 'var(--cream)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--orange)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* PRINT HEADER */}
      <div className="print-only" style={{ display: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#000', margin: 0, letterSpacing: '-1px' }}>ZANGOCHAP</h1>
            <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Logistique & Vérification · Fiche de sortie du {formatDay(date)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{orders.length} colis · {totalItems} articles</div>
          </div>
        </div>
        <div style={{ height: 2, background: '#000', marginBottom: 24 }} />
      </div>

      {/* TABLE */}
      <TableCard 
        title="Contrôle de sortie" 
        meta={orders.length > 0 ? `${filteredItems.length} article(s) affiché(s)` : ""}
        className="verification-card"
      >
        {orders.length === 0 ? (
          <EmptyState icon="📋" title={loading ? "Chargement..." : "Aucune donnée"} description={loading ? "Veuillez patienter..." : "Sélectionnez une date et chargez les commandes."} />
        ) : filteredItems.length === 0 ? (
          <EmptyState icon="🔍" title="Aucun résultat" description="Aucun article ne correspond à votre recherche ou filtre." />
        ) : (
          <table className="verification-table">
            <thead>
              <tr>
                <th style={{ width: 45 }}>✓</th>
                <th style={{ width: 100 }}>Réf.</th>
                <th>Client / Commune</th>
                <th>Article & Localisation</th>
                <th style={{ width: 60, textAlign: 'center' }}>Qté</th>
                <th className="no-print">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isChecked = !!item.isVerified;
                return (
                  <tr key={item.id} className={isChecked ? 'row-checked' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className={`check-btn ${isChecked ? 'active' : ''}`}
                        onClick={() => handleToggleCheck(item.id, isChecked)}
                        disabled={isPending}
                      >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : (isChecked && <CheckCircle2 size={18} />)}
                      </button>
                    </td>
                    <td>
                      <span className="cell-mono">{item.order.ref}</span>
                    </td>
                    <td>
                      <div className="cell-strong">{item.order.customerName}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-soft)' }}>{item.order.commune || '—'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          onClick={() => setPreviewImage(item.image || item.product?.images?.[0]?.url)}
                          style={{ width: 44, height: 44, background: 'var(--cream)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--line)', cursor: 'zoom-in' }}
                        >
                          {item.image || item.product?.images?.[0]?.url ? (
                            <img src={item.image || item.product?.images?.[0]?.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: 20 }}>{item.emoji || '📦'}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                            <span className="size-dot">{item.size}</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{item.color}</span>
                            {item.product?.variants?.find((v: any) => v.size === item.size && v.color === item.color)?.stockLevels?.map((sl: any) => (
                              <div key={sl.id} className="loc-badge-mini">
                                <Warehouse size={10} />
                                <span>{sl.warehouse.name}</span>
                                {sl.position && <strong>• {sl.position}</strong>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--orange)' }}>{item.qty}</div>
                    </td>
                    <td className="no-print">
                      <StatusBadge status={item.order.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      {/* IMMERSIVE LIGHTBOX */}
      {previewImage && (
        <div
          className="lightbox-overlay"
          onClick={() => setPreviewImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', cursor: 'zoom-out' }}
        >
          <div className="lightbox-content animate-zoom-in" onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={previewImage}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            />
            <button
              className="lightbox-close"
              onClick={() => setPreviewImage(null)}
              style={{ position: 'absolute', top: -40, right: 0, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .check-btn {
          width: 28px;
          height: 28px;
          border: 2px solid var(--line-2);
          border-radius: 8px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--green);
          transition: all 0.2s;
        }
        .check-btn:hover { border-color: var(--green); background: var(--green-soft); }
        .check-btn.active { background: var(--green); border-color: var(--green); color: white; transform: scale(1.1); }
        
        .row-checked { background: var(--cream-2); opacity: 0.7; }
        .loc-badge-mini { font-size: 9px; color: var(--orange); background: var(--orange-soft); padding: 2px 6px; border-radius: 5px; display: flex; alignItems: center; gap: 4; font-weight: 600; }

        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .content { padding: 0 !important; background: white !important; }
          .verification-card { border: none !important; box-shadow: none !important; margin: 0 !important; }
          .verification-table { width: 100% !important; border-collapse: collapse !important; }
          .verification-table th, .verification-table td { border: 1px solid #eee !important; padding: 8px 10px !important; color: #000 !important; }
          .check-btn { border: 1.5px solid #000 !important; width: 20px !important; height: 20px !important; background: transparent !important; }
          .cell-mono { background: #f0f0f0 !important; border: 1px solid #ddd !important; padding: 2px 4px !important; border-radius: 4px !important; }
          :global(.sidebar), :global(.topbar) { display: none !important; }
          :global(.main) { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

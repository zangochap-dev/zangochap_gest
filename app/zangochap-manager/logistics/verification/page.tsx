"use client";

import React, { useState, useMemo } from "react";
import Topbar from "@/components/Topbar";
import { TableCard, EmptyState, StatCard, StatusBadge } from "@/components/UI";
import { formatPrice, formatDay } from "@/lib/constants";
import { FileText, Printer } from "lucide-react";

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

  return (
    <div className="content animate-fade-in">
      <div className="filters-bar no-print">
        <label className="field-label" style={{ marginBottom: 0 }}>Date :</label>
        <input type="date" className="filter-date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn-orange" onClick={loadOrders} disabled={loading}>
          {loading ? 'Chargement...' : 'Charger'}
        </button>
        <div className="filter-spacer" />
        {orders.length > 0 && (
          <button className="btn-secondary" onClick={() => window.print()}>
            <Printer size={14} /> Imprimer la fiche
          </button>
        )}
      </div>

      <div className="print-header" style={{ display: 'none' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4 }}>ZANGOCHAP · Fiche de Vérification</h1>
        <p style={{ fontSize: 14, color: 'var(--brown-soft)' }}>Date du jour : <strong>{formatDay(date)}</strong> · {orders.length} commandes à vérifier</p>
        <div style={{ borderBottom: '2px solid var(--ink)', marginTop: 12, marginBottom: 20 }} />
      </div>

      {orders.length > 0 && (
        <div className="stats-grid no-print">
          <StatCard label="Colis à vérifier" value={orders.length} accent />
          <StatCard
            label="Articles totaux"
            value={orders.reduce((s: number, o: any) => s + (o.items?.reduce((x: number, i: any) => x + i.qty, 0) || 0), 0)}
          />
        </div>
      )}

      <TableCard 
        title="Fiche de vérification" 
        meta={orders.length > 0 ? "Cochez chaque article au fur et à mesure" : ""}
        className="print-table-card"
      >
        {orders.length === 0 ? (
          <EmptyState icon="📋" title="Chargez une date" description="Sélectionnez une date et cliquez Charger." />
        ) : (
          <table className="verification-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>✓</th>
                <th style={{ width: 100 }}>Réf.</th>
                <th>Client / Commune</th>
                <th>Article / Détails</th>
                <th style={{ width: 60 }}>Qté</th>
                <th className="no-print">Emballé par</th>
              </tr>
            </thead>
            <tbody>
              {orders.flatMap((o: any) =>
                o.items?.map((item: any, idx: number) => (
                  <tr key={`${o.id}-${idx}`}>
                    <td style={{ textAlign: 'center' }}>
                      <div className="check-box" />
                    </td>
                    <td><span className="cell-mono" style={{ fontSize: 14 }}>{o.ref}</span></td>
                    <td>
                      <div className="cell-strong">{o.customerName}</div>
                      <div className="cell-muted" style={{ fontSize: 10 }}>{o.commune || '—'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{item.emoji || '📦'}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
                            <span className="size-dot" style={{ fontSize: 10 }}>{item.size}</span>
                            <span className="cell-muted" style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown)' }}>{item.color}</span>
                            {/* Warehouse / Location info */}
                            {item.product?.variants?.find((v: any) => v.size === item.size && v.color === item.color)?.stockLevels?.map((sl: any) => (
                              <div key={sl.id} style={{ fontSize: 9, color: 'var(--orange)', background: 'var(--orange-soft)', padding: '1px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span>{sl.warehouse.name}</span>
                                {sl.position && <strong>• {sl.position}</strong>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <strong style={{ fontSize: 16, color: 'var(--orange)' }}>{item.qty}</strong>
                    </td>
                    <td className="no-print"><span className="cell-muted">{o.packedByName || '—'}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </TableCard>

      <style jsx>{`
        .check-box {
          width: 22px;
          height: 22px;
          border: 2px solid var(--line-2);
          border-radius: 6px;
          margin: 0 auto;
        }
        
        @media print {
          .no-print { display: none !important; }
          .content { padding: 0 !important; background: white !important; }
          .print-header { display: block !important; }
          .print-table-card { border: none !important; box-shadow: none !important; }
          .verification-table { width: 100% !important; border-collapse: collapse !important; }
          .verification-table th, .verification-table td { 
            border: 1px solid #ddd !important; 
            padding: 10px !important;
          }
          .verification-table th { background: #f9f9f9 !important; }
          .check-box { border-color: #333 !important; }
          .cell-mono { background: #eee !important; border: 1px solid #ccc !important; }
          
          body { background: white !important; }
          :global(.sidebar), :global(.topbar) { display: none !important; }
          :global(.main) { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

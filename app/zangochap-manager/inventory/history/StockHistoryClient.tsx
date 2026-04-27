"use client";

import React from 'react';
import { TableCard } from '@/components/UI';
import { History, ArrowUpRight, ArrowDownLeft, AlertCircle, Warehouse } from 'lucide-react';
import { formatDate } from '@/lib/constants';

interface StockHistoryClientProps {
  movements: any[];
}

export default function StockHistoryClient({ movements }: StockHistoryClientProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SALE': return { color: 'var(--red)', label: 'Vente', icon: <ArrowUpRight size={12} /> };
      case 'RESTOCK': return { color: 'var(--green)', label: 'Réappro.', icon: <ArrowDownLeft size={12} /> };
      case 'RETURN': return { color: 'var(--orange)', label: 'Retour', icon: <ArrowDownLeft size={12} /> };
      case 'EXCHANGE': return { color: 'var(--blue)', label: 'Échange', icon: <History size={12} /> };
      default: return { color: 'var(--brown-soft)', label: type, icon: <AlertCircle size={12} /> };
    }
  };

  return (
    <div className="content animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 4 }}>Historique des Stocks</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Traçabilité complète des mouvements de marchandises.</p>
      </div>

      <TableCard title="Journal des mouvements" meta={`${movements.length} opérations enregistrées`}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Produit / Variante</th>
              <th>Entrepôt</th>
              <th>Type</th>
              <th>Quantité</th>
              <th>Auteur</th>
              <th>Référence / Motif</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Aucun mouvement enregistré.</td></tr>
            ) : (
              movements.map((m, i) => {
                const badge = getTypeBadge(m.type);
                return (
                  <tr key={i}>
                    <td><div className="cell-muted">{formatDate(m.createdAt)}</div></td>
                    <td>
                      <div className="cell-strong">{m.variant.product.name}</div>
                      <div className="cell-muted" style={{ fontSize: 11 }}>{m.variant.size} — {m.variant.color}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <Warehouse size={14} className="text-orange" />
                        <span className="cell-strong">{m.warehouse?.name || 'Inconnu'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: badge.color, fontSize: 12, fontWeight: 700,
                        background: `${badge.color}15`, padding: '4px 8px',
                        borderRadius: 6, width: 'fit-content'
                      }}>
                        {badge.icon} {badge.label}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 15, fontWeight: 800, color: m.quantity > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </div>
                    </td>
                    <td><div className="cell-strong">{m.byName}</div></td>
                    <td>
                      {m.orderId ? (
                        <div style={{ color: 'var(--blue)', fontWeight: 600, fontSize: 12 }}>CMD: {m.orderId.substring(0, 8)}...</div>
                      ) : (
                        <div className="cell-muted">{m.reason || '—'}</div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

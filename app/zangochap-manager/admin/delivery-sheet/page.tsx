"use client";

import React, { useState, useMemo } from "react";
import Topbar from "@/components/Topbar";
import { TableCard, EmptyState, StatCard, SectionLabel } from "@/components/UI";
import { formatPrice, formatDay, COMMUNES } from "@/lib/constants";
import { FileText, Download } from "lucide-react";

export default function DeliverySheetPage() {
  return (
    <>
      <Topbar title="Fiche" subtitle="livreurs" />
      <DeliverySheetClient />
    </>
  );
}

function DeliverySheetClient() {
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

  // Group by commune
  const byCommune = useMemo(() => {
    const map: Record<string, any[]> = {};
    orders.forEach(o => {
      const c = o.commune || 'Non défini';
      if (!map[c]) map[c] = [];
      map[c].push(o);
    });
    return map;
  }, [orders]);

  const totalAmount = orders.reduce((s, o) => s + (o.total || 0) + (o.deliveryFee || 0) - (o.discount || 0), 0);

  return (
    <div className="content animate-fade-in">
      <div className="filters-bar">
        <label className="field-label" style={{ marginBottom: 0 }}>Date :</label>
        <input type="date" className="filter-date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn-orange" onClick={loadOrders} disabled={loading}>
          {loading ? 'Chargement...' : 'Charger'}
        </button>
        <div className="filter-spacer" />
        {orders.length > 0 && (
          <button className="btn-secondary" onClick={() => handlePrint()}>
            <FileText size={14} /> Imprimer
          </button>
        )}
      </div>

      {orders.length > 0 && (
        <div className="stats-grid">
          <StatCard label="Commandes à livrer" value={orders.length} accent />
          <StatCard label="Communes" value={Object.keys(byCommune).length} />
          <StatCard label="Montant total" value={formatPrice(totalAmount)} color="var(--orange)" />
        </div>
      )}

      {orders.length === 0 ? (
        <TableCard title="Fiche livreurs">
          <EmptyState icon="🚛" title="Aucune commande" description="Sélectionnez une date et chargez les commandes." />
        </TableCard>
      ) : (
        Object.entries(byCommune).map(([commune, communeOrders]) => (
          <div key={commune} style={{ marginBottom: 16 }}>
            <TableCard title={`${commune} — ${communeOrders.length} colis`} meta={`Total : ${formatPrice(communeOrders.reduce((s: number, o: any) => s + (o.total || 0) + (o.deliveryFee || 0) - (o.discount || 0), 0))}`}>
              <table>
                <thead>
                  <tr><th>Réf.</th><th>Client</th><th>Adresse</th><th>Articles</th><th>Total</th><th>Téléphone</th></tr>
                </thead>
                <tbody>
                  {communeOrders.map((o: any) => (
                    <tr key={o.id}>
                      <td><span className="cell-mono">{o.ref}</span></td>
                      <td><strong>{o.customerName}</strong></td>
                      <td><span className="cell-muted">{o.customerLocation || '—'}</span></td>
                      <td>
                        {o.items?.map((i: any, idx: number) => (
                          <div key={idx} style={{ fontSize: 11 }}>{i.emoji} {i.name} ({i.size}/{i.color}) ×{i.qty}</div>
                        ))}
                      </td>
                      <td><span className="cell-price">{formatPrice((o.total || 0) + (o.deliveryFee || 0) - (o.discount || 0))}</span></td>
                      <td>
                        <span className="cell-mono" style={{ fontSize: 12 }}>{o.customerPhone}</span>
                        {o.customerPhone2 && <div className="cell-muted">{o.customerPhone2}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableCard>
          </div>
        ))
      )}
    </div>
  );
}

function handlePrint() {
  window.print();
}

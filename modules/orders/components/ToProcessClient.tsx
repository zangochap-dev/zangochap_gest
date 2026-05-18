"use client";

import React, { useMemo, useState } from "react";
import { TableCard, EmptyState } from "@/components/UI";
import { formatPrice, formatDate } from "@/lib/constants";
import { ArrowRight, RefreshCw, Clock } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import "./to-process-client.css";

interface ToProcessClientProps {
  orders: any[];
}

type DatePreset = 'today' | 'yesterday' | 'custom' | 'all';

function toLocalDateInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ToProcessClient({ orders: initialOrders }: ToProcessClientProps) {
  const todayStr = toLocalDateInputValue();
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  // React Query — smooth background polling, no page flash
  const { data, isFetching } = useQuery({
    queryKey: ['to-process-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders/to-process');
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
    initialData: { orders: initialOrders },
    refetchInterval: 10_000,
    staleTime: 0,
  });

  const orders = data?.orders ?? initialOrders;
  const filteredOrders = useMemo(() => {
    if (!dateFrom && !dateTo) return orders;
    return orders.filter((order: any) => {
      const createdAt = new Date(order.createdAt).getTime();
      if (dateFrom && createdAt < new Date(`${dateFrom}T00:00:00`).getTime()) return false;
      if (dateTo && createdAt > new Date(`${dateTo}T23:59:59.999`).getTime()) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === 'custom') return;
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
      return;
    }

    const date = new Date();
    if (preset === 'yesterday') date.setDate(date.getDate() - 1);
    const value = toLocalDateInputValue(date);
    setDateFrom(value);
    setDateTo(value);
  };

  const handleDateFromChange = (value: string) => {
    setDatePreset('custom');
    setDateFrom(value);
  };

  const handleDateToChange = (value: string) => {
    setDatePreset('custom');
    setDateTo(value);
  };

  return (
    <div className="content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--cream)', padding: 3, borderRadius: 10, border: '1px solid var(--line)', flexWrap: 'wrap' }}>
          {[
            { label: "Aujourd'hui", val: 'today' },
            { label: 'Hier', val: 'yesterday' },
            { label: 'Perso', val: 'custom' },
            { label: 'Tout', val: 'all' },
          ].map(d => (
            <button key={d.val} className={`shortcut-btn ${datePreset === d.val ? 'active' : ''}`} onClick={() => applyDatePreset(d.val as DatePreset)}>
              {d.label}
            </button>
          ))}
          {datePreset === 'custom' && (
            <>
              <input type="date" className="filter-date" value={dateFrom} onChange={e => handleDateFromChange(e.target.value)} />
              <input type="date" className="filter-date" value={dateTo} onChange={e => handleDateToChange(e.target.value)} />
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
         {isFetching && <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--orange)', opacity: 0.5 }} />}
         <span style={{ fontSize: 11, color: '#8E8E93', fontWeight: 600 }}>Mise à jour auto</span>
        </div>
      </div>

      <TableCard title={`Commandes en attente de traitement`} meta={`${filteredOrders.length} commande(s) provenant du site web`}>
        {filteredOrders.length === 0 ? (
          <EmptyState icon="✨" title="Tout est à jour" description="Aucune nouvelle commande à traiter pour le moment." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order: any) => (
                <tr key={order.id}>
                  <td>
                    <div className="cell-mono" style={{ color: 'var(--orange)', fontWeight: 700 }}>{order.ref}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                       <Clock size={10} color="var(--brown-soft)" />
                       <span className="cell-muted" style={{ fontSize: 10 }}>{formatDate(order.createdAt)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-strong">{order.customerName}</div>
                    <div className="cell-muted">{order.customerPhone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {order.items.map((item: any, i: number) => (
                        <div key={i} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{item.emoji}</span>
                          <span className="cell-strong">{item.name}</span>
                          <span className="cell-muted">({item.size}/{item.color})</span>
                          <span style={{ fontWeight: 700 }}>×{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td><span className="cell-price">{formatPrice(order.total)}</span></td>
                  <td><span className="cell-muted">{formatDate(order.createdAt)}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/zangochap-manager/orders?q=${order.ref}&status=to_process`} className="btn-orange">
                      Traiter <ArrowRight size={14} style={{ marginLeft: 4 }} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      
    </div>
  );
}

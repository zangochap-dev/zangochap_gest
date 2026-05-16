"use client";

import React from "react";
import { TableCard, EmptyState } from "@/components/UI";
import { formatPrice, formatDate } from "@/lib/constants";
import { ArrowRight, RefreshCw, Clock } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import "./to-process-client.css";

interface ToProcessClientProps {
  orders: any[];
}

export default function ToProcessClient({ orders: initialOrders }: ToProcessClientProps) {
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

  return (
    <div className="content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, alignItems: 'center', gap: 8 }}>
         {isFetching && <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--orange)', opacity: 0.5 }} />}
         <span style={{ fontSize: 11, color: '#8E8E93', fontWeight: 600 }}>Mise à jour auto</span>
      </div>

      <TableCard title={`Commandes en attente de traitement`} meta={`${orders.length} commande(s) provenant du site web`}>
        {orders.length === 0 ? (
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
              {orders.map((order: any) => (
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

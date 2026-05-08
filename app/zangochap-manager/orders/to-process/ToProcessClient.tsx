"use client";

import React, { useEffect, useTransition } from "react";
import { TableCard, EmptyState, DetailCard, StatusBadge } from "@/components/UI";
import { formatPrice, formatDate } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, ShoppingCart, Clock } from "lucide-react";
import Link from "next/link";

interface ToProcessClientProps {
  orders: any[];
}

export default function ToProcessClient({ orders }: ToProcessClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Auto-refresh every 30s to catch new web orders
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
         <button className="btn-secondary" onClick={() => router.refresh()} disabled={isPending}>
            <RefreshCw size={14} className={isPending ? "animate-spin" : ""} /> Actualiser
         </button>
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
              {orders.map(order => (
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

      <style jsx>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { TableCard, StatusBadge, EmptyState } from "@/components/UI";
import { formatPrice, formatDate } from "@/lib/constants";
import { Eye, Printer, MessageSquare } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/Modal";

export default function DashboardRecentOrders({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  return (
    <>
      <TableCard
        title="Activité récente"
        actions={
          <Link href="/zangochap-manager/orders" style={{ fontSize: 11, padding: '8px 16px', background: '#221F1D', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>
            Voir tout →
          </Link>
        }
      >
        {orders.length === 0 ? (
          <EmptyState icon="📦" title="Aucune commande" description="Le pipeline est vide." />
        ) : (
          <div className="table-wrap">
            <table style={{ background: 'white' }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 9, opacity: 0.5, letterSpacing: '0.05em' }}>RÉFÉRENCE</th>
                  <th style={{ fontSize: 9, opacity: 0.5, letterSpacing: '0.05em' }}>DATE</th>
                  <th style={{ fontSize: 9, opacity: 0.5, letterSpacing: '0.05em' }}>CLIENT</th>
                  <th style={{ fontSize: 9, opacity: 0.5, letterSpacing: '0.05em' }}>COMMERCIAL</th>
                  <th style={{ fontSize: 9, opacity: 0.5, letterSpacing: '0.05em' }}>COMMUNE</th>
                  <th style={{ fontSize: 9, opacity: 0.5, letterSpacing: '0.05em' }}>ARTICLES</th>
                  <th style={{ fontSize: 9, opacity: 0.5, letterSpacing: '0.05em' }}>TOTAL</th>
                  <th style={{ fontSize: 9, opacity: 0.5, letterSpacing: '0.05em' }}>STATUT</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <div className="cell-mono" style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 12 }}>{order.ref}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--brown-soft)' }}>
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}.<br/>
                        <span style={{ opacity: 0.7 }}>{new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-strong" style={{ fontSize: 13, color: 'var(--ink)' }}>{order.customerName}</div>
                      <div className="cell-muted" style={{ fontSize: 11, color: 'var(--brown-soft)' }}>{order.customerPhone}</div>
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--brown-soft)' }}>{order.commercialName || 'Web'}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>{order.commune}</span></td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--brown-soft)' }}>{order.items.length} article{order.items.length > 1 ? 's' : ''}</div>
                    </td>
                    <td>
                      <div className="cell-price" style={{ color: 'var(--orange)', fontWeight: 800, fontSize: 13 }}>{formatPrice(order.total)}</div>
                    </td>
                    <td><StatusBadge status={order.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => setSelectedOrder(order)} style={{ background: 'var(--cream-2)', border: 'none', cursor: 'pointer', fontSize: 13, padding: '4px 6px', borderRadius: 6 }} title="Détails">👁️</button>
                        <Link href={`/zangochap-manager/logistics/packing?order=${order.ref}`} style={{ textDecoration: 'none', fontSize: 13, background: 'var(--cream-2)', padding: '4px 6px', borderRadius: 6 }} title="Imprimer">📄</Link>
                        <a href={`https://wa.me/${order.customerPhone.replace(/\s/g, '')}`} target="_blank" style={{ textDecoration: 'none', fontSize: 13, background: '#E7FCEF', padding: '4px 6px', borderRadius: 6 }} title="WhatsApp">💬</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {selectedOrder && (
        <Modal isOpen={true} onClose={() => setSelectedOrder(null)} title={`Commande ${selectedOrder.ref}`} large>
           <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.5, marginBottom: 12 }}>Informations Client</h4>
                <div style={{ background: 'var(--cream)', padding: 16, borderRadius: 12 }}>
                   <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedOrder.customerName}</div>
                   <div style={{ fontSize: 14, marginTop: 4 }}>{selectedOrder.customerPhone}</div>
                   <div style={{ fontSize: 14, color: 'var(--brown-soft)', marginTop: 8 }}>
                     📍 {selectedOrder.customerLocation} ({selectedOrder.commune})
                   </div>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.5, marginBottom: 12 }}>Détails Commande</h4>
                <div style={{ background: 'var(--cream)', padding: 16, borderRadius: 12 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                     <span>Statut :</span>
                     <StatusBadge status={selectedOrder.status} />
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                     <span>Date :</span>
                     <span>{formatDate(selectedOrder.createdAt)}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                     <span>Total :</span>
                     <span style={{ color: 'var(--orange)' }}>{formatPrice(selectedOrder.total)}</span>
                   </div>
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.5, marginBottom: 12 }}>Articles</h4>
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Variant</th>
                      <th>Qty</th>
                      <th>Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item: any, i: number) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>{item.size} / {item.color}</td>
                        <td>x{item.qty}</td>
                        <td>{formatPrice(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </Modal>
      )}

      <style jsx>{`
        .order-details-grid h4 { margin-top: 0; }
        .simple-table { width: 100%; border-collapse: collapse; }
        .simple-table th { text-align: left; padding: 10px; border-bottom: 2px solid var(--line); font-size: 11px; text-transform: uppercase; opacity: 0.6; }
        .simple-table td { padding: 10px; border-bottom: 1px solid var(--line); font-size: 13px; }
      `}</style>
    </>
  );
}

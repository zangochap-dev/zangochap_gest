"use client";

import React, { useState, useTransition } from "react";
import { TableCard, StatusBadge, EmptyState, DetailCard, ItemLine, SectionLabel } from "@/components/UI";
import Modal from "@/components/Modal";
import { formatPrice, formatDate, STATUS_LABELS } from "@/lib/constants";
import { Eye, X, MessageCircle, Truck, Package, Ban, Check } from "lucide-react";
import { updateOrderStatus } from "@/modules/orders/actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

export default function NonPackedClient({ notPacked, withAlternatives, user }: { notPacked: any[]; withAlternatives: any[]; user: any }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const handleStatusChange = (orderId: string, status: string) => {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status);
        showToast('Statut mis à jour ✓', 'success');
        router.refresh();
        setSelectedOrder(null);
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  const handleWhatsApp = (order: any) => {
    const phone = order.customerPhone.replace(/[^0-9]/g, '');
    const msg = `Bonjour ${order.customerName}, je reviens vers vous concernant votre commande ${order.ref}...`;
    window.open(`https://wa.me/225${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const OrderTable = ({ orders, title, meta, showCommercial = false }: { orders: any[], title: string, meta: string, showCommercial?: boolean }) => (
    <TableCard title={title} meta={meta}>
      {orders.length === 0 ? (
        <EmptyState icon="✓" title="Tout est emballé" description="Aucune commande dans cette section." />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Client</th>
              <th>Articles</th>
              <th style={{ width: 220 }}>Motif / État Logistique</th>
              {showCommercial && <th>Commercial</th>}
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td><span className="cell-mono">{order.ref}</span></td>
                <td>
                  <div className="cell-strong">{order.customerName}</div>
                  <div className="cell-muted" style={{ fontSize: 10 }}>{order.commune}</div>
                </td>
                <td>
                  {order.items.map((item: any, i: number) => (
                    <div key={i} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0' }}>
                      {item.image ? (
                        <img src={item.image} style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' }} />
                      ) : (
                        <span>{item.emoji || '📦'}</span>
                      )}
                      <span>{item.name}</span>
                      <span className="size-dot" style={{ fontSize: 9 }}>{item.size}</span>
                    </div>
                  ))}
                </td>
                <td>
                  <div style={{ fontSize: 11, color: 'var(--brown)', lineHeight: 1.4, fontWeight: 500 }}>
                    {order.motif}
                  </div>
                </td>
                {showCommercial && <td><span className="cell-muted" style={{ fontSize: 11 }}>{order.commercialName}</span></td>}
                <td><StatusBadge status={order.status} /></td>
                <td>
                  <button className="action-btn" onClick={() => setSelectedOrder(order)}>
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableCard>
  );

  return (
    <div className="content animate-fade-in">
      <div className="info-banner amber">
        ⚠️ {notPacked.length + withAlternatives.length} commande(s) en attente d'emballage ou de confirmation client.
      </div>

      <OrderTable 
        orders={notPacked} 
        title="Commandes non emballées" 
        meta={`${notPacked.length} en attente`} 
      />

      {withAlternatives.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <OrderTable 
            orders={withAlternatives} 
            title="En attente de confirmation (Alternatives)" 
            meta={`${withAlternatives.length} à relancer`}
            showCommercial={true}
          />
        </div>
      )}

      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Détail · ${selectedOrder.ref}`}
          large
          footer={
            <>
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>Fermer</button>
              <button className="btn-whatsapp" onClick={() => handleWhatsApp(selectedOrder)}>
                <MessageCircle size={14} /> WhatsApp
              </button>
              {user.role === 'admin' && (
                <button className="btn-orange" onClick={() => handleStatusChange(selectedOrder.id, 'CONFIRMED')} disabled={isPending}>
                  <Check size={14} /> Confirmer
                </button>
              )}
            </>
          }
        >
          <div className="order-detail-grid">
            <div>
              <DetailCard label="Client">
                <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedOrder.customerName}</div>
                <div className="cell-muted" style={{ marginTop: 4 }}>{selectedOrder.customerPhone}</div>
                <div className="cell-muted" style={{ marginTop: 4 }}>{selectedOrder.customerLocation} ({selectedOrder.commune})</div>
              </DetailCard>

              <div style={{ marginTop: 14 }}>
                <DetailCard label="Articles">
                  {selectedOrder.items.map((item: any, i: number) => (
                    <ItemLine
                      key={i}
                      emoji={item.emoji}
                      name={item.name}
                      meta={`Taille ${item.size} · ${item.color} · Qté ${item.qty}`}
                      price={formatPrice(item.price * item.qty)}
                    />
                  ))}
                </DetailCard>
              </div>
            </div>

            <div>
              <DetailCard label="Historique Logistique">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedOrder.history as any[]).map((h, i) => (
                    <div key={i} style={{ fontSize: 11, borderLeft: '2px solid var(--line)', paddingLeft: 10 }}>
                      <div style={{ fontWeight: 600 }}>{h.action}</div>
                      <div className="cell-muted">{h.byName} · {formatDate(h.at)}</div>
                    </div>
                  ))}
                </div>
              </DetailCard>
              
              {selectedOrder.notes && (
                <div style={{ marginTop: 14 }}>
                  <DetailCard label="Notes">
                    <div style={{ fontSize: 12 }}>{selectedOrder.notes}</div>
                  </DetailCard>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

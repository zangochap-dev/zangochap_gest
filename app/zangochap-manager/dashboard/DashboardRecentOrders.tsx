"use client";

import React, { useState } from "react";
import { TableCard, StatusBadge, EmptyState } from "@/components/UI";
import { formatPrice, formatDate } from "@/lib/constants";
import { Eye, Printer, MessageSquare } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/Modal";
import "./dashboard-recent-orders.css";
import "./dashboard.css";

export default function DashboardRecentOrders({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleWhatsApp = (order: any) => {
    const totalAmount = Number(order.total || 0) + Number(order.deliveryFee || 0) - Number(order.discount || 0);
    const names = (order.customerName || "").trim().split(/\s+/);
    const lastName = names[0] || "";
    const firstName = names.slice(1).join(" ") || "—";
    const itemsList = order.items.map((i: any) => `${i.name} (${i.size}/${i.color}) x${i.qty}`).join("\n");

    const msg = `🎉 *Votre commande est validée !*
Veuillez vérifier vos informations enregistrées pour la commande
Nom: ${lastName}
Prenom: ${firstName}

Numéro joignable 1: ${order.customerPhone}

Numéro joignable 2 : ${order.customerPhone2 || '—'}

Lieu de livraison : ${order.customerLocation} (${order.commune})

Nom du produit : 
${itemsList}

Prix total: ${totalAmount.toLocaleString('fr-FR')} FCFA

1️⃣ Téléchargez l’application dès maintenant en cliquant ici 👇🏾:
📲 *Android* : https://play.google.com/store/apps/details?id=com.zangochap.zangochap&pcampaignid=web_share

🍏 iPhone : https://apps.apple.com/ci/app/zangochap/id6737241287

2️⃣ Envoyez-nous une capture d’écran de l’application installée pour activer votre surprise .

Ne passez pas à côté de cette belle surprise ! 😍🔥`;

    let phone = order.customerPhone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '225' + phone.substring(1);
    else if (!phone.startsWith('225') && phone.length === 10) phone = '225' + phone;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <>
      <TableCard
        title="Activité récente"
        actions={
          <Link href="/zangochap-manager/orders" className="leaderboard-footer" style={{ padding: '8px 16px', background: '#221F1D', color: 'white', border: 'none' }}>
            Voir tout →
          </Link>
        }
      >
        {orders.length === 0 ? (
          <EmptyState icon="📦" title="Aucune commande" description="Le pipeline est vide." />
        ) : (
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>RÉFÉRENCE</th>
                  <th>DATE</th>
                  <th>CLIENT</th>
                  <th>COMMERCIAL</th>
                  <th>COMMUNE</th>
                  <th>ARTICLES</th>
                  <th>TOTAL</th>
                  <th>STATUT</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <div className="cell-mono cell-price-orange" style={{ color: 'var(--ink)' }}>{order.ref}</div>
                    </td>
                    <td>
                      <div className="cell-time">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}.<br />
                        <span className="cell-time-sec">{new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-strong" style={{ fontSize: 13, color: 'var(--ink)' }}>{order.customerName}</div>
                      <div className="cell-muted cell-subtext">{order.customerPhone}</div>
                    </td>
                    <td><span className="cell-subtext" style={{ fontSize: 12 }}>{order.commercialName || 'Web'}</span></td>
                    <td><span className="cell-strong" style={{ fontSize: 12 }}>{order.commune}</span></td>
                    <td>
                      <div className="cell-subtext" style={{ fontSize: 12 }}>{order.items.length} article{order.items.length > 1 ? 's' : ''}</div>
                    </td>
                    <td>
                      <div className="cell-price-orange">{formatPrice(order.total)}</div>
                    </td>
                    <td><StatusBadge status={order.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="cell-action-row">
                        <button onClick={() => setSelectedOrder(order)} className="cell-btn-icon" title="Détails">👁️</button>
                        <Link href={`/zangochap-manager/logistics/packing?order=${order.ref}`} className="cell-btn-icon" style={{ textDecoration: 'none' }} title="Imprimer">📄</Link>
                        <button onClick={() => handleWhatsApp(order)} className="cell-btn-icon cell-btn-whatsapp" title="WhatsApp">💬</button>
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
          <div className="modal-grid-2">
            <div>
              <h4 className="modal-section-title">Informations Client</h4>
              <div className="modal-info-box">
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedOrder.customerName}</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>{selectedOrder.customerPhone}</div>
                <div style={{ fontSize: 14, color: 'var(--brown-soft)', marginTop: 8 }}>
                  📍 {selectedOrder.customerLocation} ({selectedOrder.commune})
                </div>
              </div>
            </div>
            <div>
              <h4 className="modal-section-title">Détails Commande</h4>
              <div className="modal-info-box">
                <div className="modal-row-flex">
                  <span>Statut :</span>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div className="modal-row-flex">
                  <span>Date :</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="modal-total-row">
                  <span>Total :</span>
                  <span className="cell-price-orange">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <h4 className="modal-section-title">Articles</h4>
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

      
    </>
  );
}

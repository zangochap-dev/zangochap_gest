"use client";

import React from "react";
import Modal from "@/components/Modal";
import { DetailCard, ItemLine } from "@/components/UI";
import { MessageCircle, Check } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/constants";

interface NonPackedModalProps {
  order: any;
  user: any;
  isPending: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, status: string) => void;
}

export default function NonPackedModal({
  order,
  user,
  isPending,
  onClose,
  onStatusChange
}: NonPackedModalProps) {
  if (!order) return null;

  const isAdmin = user?.role?.toLowerCase() === "admin";

  const handleWhatsApp = () => {
    const phone = (order.customerPhone || '').replace(/[^0-9]/g, '');
    const formattedPhone = phone.startsWith('0') ? '225' + phone.substring(1) : (phone.startsWith('225') ? phone : '225' + phone);
    
    const itemsText = order.items.map((i: any) => {
      return `• *${i.name}*\n   Taille : ${i.size} | Couleur : ${i.color}\n   Quantité : ${i.qty} — ${formatPrice(i.price * i.qty)}`;
    }).join('\n\n');

    const totalPayer = (order.total || 0) + (order.deliveryFee || 0);

    const msg = `🛍️ *ZANGOCHAP — Suivi Commande*\n\n` +
      `Bonjour *${order.customerName}*,\n\n` +
      `Je reviens vers vous concernant votre commande *${order.ref}*. Voici le récapitulatif actuel :\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*ARTICLES*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `${itemsText}\n\n` +
      `💰 *Total à payer :* ${formatPrice(totalPayer)}\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `⚠️ *Note :* ${order.motif || 'En cours de traitement'}\n\n` +
      `Merci pour votre confiance ! 🧡\n\n` +
      `_${user?.name || 'L\'équipe'} — Zangochap_`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Détail · ${order.ref}`}
      large
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Fermer</button>
          <button 
            className="btn-whatsapp" 
            onClick={handleWhatsApp}
            style={{ 
              background: '#25D366', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: 12, 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <MessageCircle size={16} /> Relance WhatsApp
          </button>
          {isAdmin && (
            <button className="btn-orange" onClick={() => onStatusChange(order.id, 'CONFIRMED')} disabled={isPending}>
              <Check size={16} /> Marquer Traitée
            </button>
          )}
        </>
      }
    >
      <div className="order-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div>
          <DetailCard label="Client">
            <div style={{ fontWeight: 600, fontSize: 15 }}>{order.customerName}</div>
            <div className="cell-muted" style={{ marginTop: 4 }}>{order.customerPhone}</div>
            <div className="cell-muted" style={{ marginTop: 4 }}>{order.customerLocation} ({order.commune})</div>
          </DetailCard>

          <div style={{ marginTop: 14 }}>
            <DetailCard label="Articles">
              {order.items.map((item: any, i: number) => (
                <ItemLine
                  key={i}
                  emoji={item.emoji}
                  image={item.image}
                  name={item.name}
                  meta={`Taille ${item.size} · ${item.color} · Qté ${item.qty}`}
                  price={formatPrice(item.price * item.qty)}
                  isGift={item.isGift}
                />
              ))}
            </DetailCard>
          </div>
        </div>

        <div>
          <DetailCard label="Historique Logistique">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(order.history as any[]).map((h, i) => (
                <div key={i} style={{ fontSize: 11, borderLeft: '2px solid var(--line)', paddingLeft: 10 }}>
                  <div style={{ fontWeight: 600 }}>{h.action}</div>
                  <div className="cell-muted">{h.byName} · {formatDate(h.at)}</div>
                </div>
              ))}
            </div>
          </DetailCard>
          
          {order.notes && (
            <div style={{ marginTop: 14 }}>
              <DetailCard label="Notes">
                <div style={{ fontSize: 12 }}>{order.notes}</div>
              </DetailCard>
            </div>
          )}
          
          {order.motif && (
            <div style={{ marginTop: 14, padding: 12, background: 'var(--orange-soft)', borderRadius: 8, borderLeft: '4px solid var(--orange)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', marginBottom: 4 }}>MOTIF SIGNALEMENT</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{order.motif}</div>
              {order.motifs?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                  {order.motifs.map((motif: string, index: number) => (
                    <div key={`${motif}-${index}`} style={{ fontSize: 12, fontWeight: 700 }}>
                      Motif: {motif}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

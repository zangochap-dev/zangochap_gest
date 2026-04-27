"use client";

import React from "react";
import Modal from "@/components/Modal";
import { Download, Share2 } from "lucide-react";

interface ReceiptModalProps {
  order: any;
  onClose: () => void;
  onPrint: (order: any, format: 'a4' | 'a6' | 'thermal') => void;
  onDownloadPDF: (order: any) => void;
  onWhatsApp: (order: any) => void;
}

export default function ReceiptModal({
  order, onClose, onPrint, onDownloadPDF, onWhatsApp
}: ReceiptModalProps) {
  if (!order) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Options d'impression & partage"
    >
      <div style={{ textAlign: 'center', padding: '14px 0' }}>
        <div style={{ fontSize: 50, marginBottom: 8 }}>🧾</div>
        <p style={{ color: 'var(--brown)', fontSize: 14 }}>
          Choisis le format pour la commande <strong style={{ color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}>{order.ref}</strong>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => { onPrint(order, 'a4'); onClose(); }}
          style={{ background: 'var(--cream)', border: '2px solid var(--line)', borderRadius: 12, padding: 18, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
          className="receipt-format-btn"
        >
          <div style={{ fontSize: 32, marginBottom: 4 }}>📄</div>
          <strong>A4</strong>
          <div style={{ fontSize: 10, color: 'var(--brown-soft)', marginTop: 2, fontWeight: 500 }}>Facture pleine page</div>
        </button>

        <button
          onClick={() => { onPrint(order, 'a6'); onClose(); }}
          style={{ background: 'var(--cream)', border: '2px solid var(--line)', borderRadius: 12, padding: 18, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
          className="receipt-format-btn"
        >
          <div style={{ fontSize: 32, marginBottom: 4 }}>📋</div>
          <strong>A6</strong>
          <div style={{ fontSize: 10, color: 'var(--brown-soft)', marginTop: 2, fontWeight: 500 }}>Format carte postale</div>
        </button>

        <button
          onClick={() => { onPrint(order, 'thermal'); onClose(); }}
          style={{ background: 'var(--cream)', border: '2px solid var(--line)', borderRadius: 12, padding: 18, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
          className="receipt-format-btn"
        >
          <div style={{ fontSize: 32, marginBottom: 4 }}>🧾</div>
          <strong>Ticket 80mm</strong>
          <div style={{ fontSize: 10, color: 'var(--brown-soft)', marginTop: 2, fontWeight: 500 }}>Reçu thermique</div>
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
        <div style={{ fontSize: 11, color: 'var(--brown-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 12 }}>
          Partager au client
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            onClick={() => onDownloadPDF(order)}
            style={{
              background: 'linear-gradient(135deg, #FFE0CC, #FCC096)',
              border: '2px solid var(--orange)',
              color: 'var(--brown)',
              borderRadius: 12,
              padding: 14,
              cursor: 'pointer',
              textAlign: 'center',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Download size={24} />
            <span style={{ fontSize: 13 }}>Télécharger PDF</span>
            <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--brown-soft)' }}>Pour envoi manuel</span>
          </button>

          <button
            onClick={() => { onWhatsApp(order); onClose(); }}
            style={{
              background: 'linear-gradient(135deg, #DCFCE7, #86EFAC)',
              border: '2px solid #16A34A',
              color: '#14532D',
              borderRadius: 12,
              padding: 14,
              cursor: 'pointer',
              textAlign: 'center',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Share2 size={24} />
            <span style={{ fontSize: 13 }}>Envoyer WhatsApp</span>
            <span style={{ fontSize: 10, fontWeight: 400, color: '#166534' }}>Message direct</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  X, Phone, MessageCircle, Package,
  Check, RotateCcw, ChevronRight, MapPin, Banknote, CheckCircle2,
  AlertCircle, Users, CheckSquare, Square, Navigation, Send, CalendarClock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";
import { RiderOrder, RiderOrderItem } from "../types";
import { calculateOrderCollectionTotal } from "../utils";

// ── Constants ────────────────────────────────────────────────
const QUICK_MESSAGES = [
  "Bonjour, je suis en route pour votre livraison (5-10 min).",
  "Bonjour, je suis arrivé devant chez vous.",
  "Je ne trouve pas votre adresse, pouvez-vous m'aider ?",
  "Votre téléphone ne passe pas, je suis à votre porte.",
];

const RETURN_REASONS = [
  "Client absent",
  "Mauvaise adresse",
  "Refusé par le client",
  "Article défectueux",
  "Produit non conforme",
  "Pas de budget/monnaie",
];

const PARTIAL_REASONS = [
  "Article manquant",
  "Taille/Couleur incorrecte",
  "Client ne veut plus cet article",
  "Article abîmé",
];

// ── Types ────────────────────────────────────────────────────
interface OrderDetailsSheetProps {
  order: RiderOrder;
  onClose: () => void;
  partialMode: boolean;
  setPartialMode: (v: boolean) => void;
  includeDeliveryFee: boolean;
  setIncludeDeliveryFee: (v: boolean) => void;
  deliveredQuantities: Record<string, number>;
  updateItemQty: (id: string, qty: number) => void;
  returnReasons: Record<string, string>;
  updateReturnReason: (id: string, reason: string) => void;
  partialSummary: { subtotal: number; total: number; fee: number };
  onStatusUpdate: (id: string, status: string) => void;
  onPartialConfirm: () => void;
  isPending: boolean;
}

// ── Main Component ───────────────────────────────────────────
export function OrderDetailsSheet({
  order,
  onClose,
  partialMode,
  setPartialMode,
  includeDeliveryFee,
  setIncludeDeliveryFee,
  deliveredQuantities,
  updateItemQty,
  returnReasons,
  updateReturnReason,
  partialSummary,
  onStatusUpdate,
  onPartialConfirm,
  isPending,
}: OrderDetailsSheetProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  if (!order) return null;

  useEffect(() => {
    setCheckedItems({});
  }, [order.id]);

  const collectionTotal = calculateOrderCollectionTotal(order);
  const deliveredCount = order.items.reduce(
    (sum, item) => sum + (deliveredQuantities[item.id] || 0),
    0
  );

  const allChecked = order.items.every(item => checkedItems[item.id]);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openWhatsApp = (msg?: string) => {
    let p = order.customerPhone.replace(/\D/g, "");
    if (p.startsWith("0")) p = "225" + p.slice(1);
    else if (!p.startsWith("225")) p = "225" + p;
    
    const text = msg || `Bonjour ${order.customerName}, votre livreur ZangoChap est en route.`;
    window.open(`https://wa.me/${p}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const openMaps = () => {
    if (!order.customerLocation) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      order.customerLocation + (order.commune ? `, ${order.commune}` : "") + ", Ivory Coast"
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative z-10 w-full max-w-md h-[92dvh] bg-[#F5F5F7] rounded-t-[20px] flex flex-col overflow-hidden shadow-xl"
      >
        {/* ── Header ── */}
        <div className="shrink-0 px-5 pt-3 pb-4 bg-white border-b border-[#F2F2F7]">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-[#E5E5EA]" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#1C1C1E] active:scale-90 transition-transform"
              >
                <X size={18} />
              </button>
              <div>
                <h2 className="text-[16px] font-bold text-[#1C1C1E] leading-none mb-1">
                  Commande #{order.ref}
                </h2>
                <div className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-[#FF6B2C]" />
                  <span className="text-[11px] font-bold text-[#FF6B2C]">{order.commune}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={order.status} />
              {order.isCommercialContacted && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-[#34C759] uppercase bg-[#34C759]/10 px-1.5 py-0.5 rounded border border-[#34C759]/10">
                  <CheckCircle2 size={9} /> Contacté
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-32">
          <div className="p-3.5 space-y-3.5">
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl p-4 border border-[#F2F2F7] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="text-[16px] font-extrabold text-[#1C1C1E] truncate mb-0.5">
                    {order.customerName}
                  </h3>
                  <p className="text-[13px] font-semibold text-[#8E8E93]">
                    {order.customerPhone}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="w-10 h-10 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#1C1C1E] active:scale-90 transition-transform"
                  >
                    <Phone size={16} strokeWidth={2.5} />
                  </a>
                  <button
                    onClick={() => openWhatsApp()}
                    className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] active:scale-90 transition-transform"
                  >
                    <MessageCircle size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Quick WhatsApp Messages */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {QUICK_MESSAGES.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => openWhatsApp(msg)}
                    className="shrink-0 px-3 py-2 bg-[#F2F2F7] rounded-lg text-[10px] font-bold text-[#1C1C1E] flex items-center gap-2 active:bg-[#E5E5EA] transition-colors"
                  >
                    <Send size={10} className="text-[#AEAEB2]" />
                    {msg.split(",")[1]?.trim() || msg.split(".")[0]}...
                  </button>
                ))}
              </div>

              {/* Enhanced Location/Navigation */}
              <button 
                onClick={openMaps}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#007AFF]/5 border border-[#007AFF]/10 active:bg-[#007AFF]/10 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#007AFF] flex items-center justify-center text-white shrink-0 shadow-sm group-active:scale-90 transition-transform">
                  <Navigation size={16} fill="white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[13px] font-bold text-[#1C1C1E] truncate leading-tight">
                    {order.customerLocation || "Adresse non précisée"}
                  </p>
                  <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-wider">
                    Lancer l'itinéraire
                  </p>
                </div>
                <ChevronRight size={14} className="text-[#007AFF]/50" />
              </button>
            </div>

            {/* Checklist Info Banner */}
            {!allChecked && !partialMode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-xl p-3 flex items-center gap-3"
              >
                <CheckSquare size={18} className="text-[#FF9500] shrink-0" />
                <p className="text-[12px] font-bold text-[#FF9500]">
                  Cochez les articles pour activer la livraison.
                </p>
              </motion.div>
            )}

            {/* Amount Card */}
            <div className="bg-white rounded-xl p-5 border border-[#F2F2F7] shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-[#F2F2F7]/50">
                <Banknote size={100} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-[0.1em]">
                    {partialMode ? "Encaissement Partiel" : "Montant à Encaisser"}
                  </span>
                  <div className="flex items-center gap-1.5 text-[#34C759] bg-[#34C759]/10 px-2.5 py-0.5 rounded border border-[#34C759]/10">
                    <Banknote size={12} />
                    <span className="text-[9px] font-black uppercase">Cash</span>
                  </div>
                </div>
                <p className="text-[32px] font-black tracking-tight text-[#1C1C1E] tabular-nums leading-none mb-4">
                  {formatPrice(partialMode ? partialSummary.total : collectionTotal)}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-[#F2F2F7]">
                  <span className="text-[12px] font-semibold text-[#AEAEB2]">
                    Livraison : {formatPrice(order.deliveryFee)}
                  </span>
                  {partialMode && (
                    <button
                      onClick={() => setIncludeDeliveryFee(!includeDeliveryFee)}
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded transition-all ${
                        includeDeliveryFee
                          ? "bg-[#34C759] text-white shadow-sm"
                          : "bg-[#F2F2F7] text-[#AEAEB2]"
                      }`}
                    >
                      {includeDeliveryFee ? "Livraison Incluse" : "Exclure Frais"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black text-[#8E8E93] uppercase tracking-[0.1em]">
                  Articles ({order.items.length})
                </span>
                <button
                  onClick={() => setPartialMode(!partialMode)}
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded transition-all border ${
                    partialMode
                      ? "bg-[#FF3B30] text-white border-[#FF3B30] shadow-sm shadow-red-100"
                      : "bg-white text-[#FF6B2C] border-[#FF6B2C]/30"
                  }`}
                >
                  {partialMode ? "Annuler Partiel" : "Mode Partiel"}
                </button>
              </div>

              {order.items.map((item: RiderOrderItem, idx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  partialMode={partialMode}
                  deliveredQty={deliveredQuantities[item.id] ?? 0}
                  onQtyChange={(qty) => updateItemQty(item.id, qty)}
                  reason={returnReasons[item.id]}
                  onReasonChange={(reason) => updateReturnReason(item.id, reason)}
                  checked={checkedItems[item.id] || false}
                  onCheck={() => toggleCheck(item.id)}
                />
              ))}
            </div>

            {/* Preparation Team Section */}
            <div className="bg-white rounded-xl p-4 border border-[#F2F2F7] shadow-sm space-y-3">
              <div className="flex items-center gap-2 px-0.5">
                <div className="w-7 h-7 rounded bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
                  <Users size={14} />
                </div>
                <span className="text-[11px] font-black text-[#1C1C1E] uppercase tracking-wider">
                  Équipe Préparation
                </span>
              </div>

              <div className="space-y-2.5">
                {order.commercial && (
                  <StaffRow label="Commercial" name={order.commercial.name} phone={order.commercial.phone} />
                )}
                {order.packer && (
                  <StaffRow label="Emballeur" name={order.packer.name} phone={order.packer.phone} />
                )}
                {order.collectors?.map((c, i) => (
                  <StaffRow key={i} label="Collecteur" name={c.name} phone={c.phone} />
                ))}
                {(!order.commercial && !order.packer && (!order.collectors || order.collectors.length === 0)) && (
                  <p className="text-[11px] font-semibold text-[#AEAEB2] italic text-center py-2">
                    Aucune info équipe
                  </p>
                )}
              </div>
            </div>

            {/* Delivery Note */}
            {order.deliveryNote && (
              <div className="bg-white rounded-xl p-4 border border-[#F2F2F7] shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <AlertCircle size={14} className="text-[#AEAEB2]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#AEAEB2]">
                    Note de livraison
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-[#1C1C1E] leading-relaxed">
                  {order.deliveryNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Fixed Action Bar ── */}
        <div
          className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-[#F2F2F7]"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 12px)" }}
        >
          {!partialMode ? (
            <div className="flex gap-3">
              <button
                disabled={isPending || !allChecked}
                onClick={() => onStatusUpdate(order.id, "DELIVERED")}
                className="flex-[4] h-14 bg-[#34C759] rounded-xl text-white font-black text-[16px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-sm disabled:opacity-40 disabled:grayscale"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={20} strokeWidth={3} /> 
                    {!allChecked ? "VÉRIFIEZ LES ARTICLES" : "TOUT LIVRÉ"}
                  </>
                )}
              </button>
              
              <button
                disabled={isPending}
                onClick={() => onStatusUpdate(order.id, "RETURNED")}
                className="flex-1 h-14 bg-[#FF3B30]/10 rounded-xl text-[#FF3B30] flex items-center justify-center active:scale-[0.98] transition-all border border-[#FF3B30]/10 disabled:opacity-40"
                title="Retour"
              >
                <RotateCcw size={20} strokeWidth={2.5} />
              </button>
              <button
                disabled={isPending}
                onClick={() => onStatusUpdate(order.id, "REPRO_DISPO")}
                className="flex-1 h-14 bg-[#FF9500]/10 rounded-xl text-[#FF9500] flex items-center justify-center active:scale-[0.98] transition-all border border-[#FF9500]/10 disabled:opacity-40"
                title="Repro-dispo demain"
              >
                <CalendarClock size={20} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              disabled={isPending || deliveredCount === 0}
              onClick={onPartialConfirm}
              className="w-full h-14 bg-[#FF9500] rounded-xl text-white font-black text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm disabled:opacity-40"
            >
              {isPending ? (
                <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  CONFIRMER PARTIEL · {formatPrice(partialSummary.total)}
                  <ChevronRight size={18} strokeWidth={3} />
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Item Row Sub-component ───────────────────────────────────
function ItemRow({
  item,
  index,
  partialMode,
  deliveredQty,
  onQtyChange,
  reason,
  onReasonChange,
  checked,
  onCheck,
}: {
  item: RiderOrderItem;
  index: number;
  partialMode: boolean;
  deliveredQty: number;
  onQtyChange: (qty: number) => void;
  reason?: string;
  onReasonChange: (reason: string) => void;
  checked: boolean;
  onCheck: () => void;
}) {
  const isExcluded = partialMode && deliveredQty === 0;
  const isPartial = partialMode && deliveredQty < item.qty && deliveredQty > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-xl p-3 border transition-all ${
        isExcluded ? "opacity-50 grayscale border-[#F2F2F7]" : "border-[#F2F2F7] shadow-sm"
      } ${isPartial ? "border-orange-200 bg-orange-50/30" : ""} ${checked && !partialMode ? "bg-[#34C759]/5 border-[#34C759]/20" : ""}`}
    >
      <div className="flex gap-3">
        {!partialMode && (
          <button 
            onClick={onCheck}
            className={`w-10 h-14 rounded-lg flex items-center justify-center transition-all ${
              checked ? "bg-[#34C759] text-white" : "bg-[#F2F2F7] text-[#AEAEB2] border border-[#E5E5EA]"
            }`}
          >
            {checked ? <CheckSquare size={20} /> : <Square size={20} />}
          </button>
        )}

        <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F2F2F7] shrink-0 flex items-center justify-center border border-[#E5E5EA]">
          {item.image ? (
            <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <Package size={20} className="text-[#AEAEB2]" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className={`text-[14px] font-bold truncate ${isExcluded ? "line-through text-[#AEAEB2]" : "text-[#1C1C1E]"}`}>
              {item.name}
            </p>
            <p className="text-[13px] font-black text-[#1C1C1E] tabular-nums whitespace-nowrap">
              {formatPrice(item.price * (partialMode ? deliveredQty : item.qty))}
            </p>
          </div>
          <p className="text-[11px] font-bold text-[#AEAEB2] uppercase tracking-wider">
            {item.size} · {item.color} · ×{item.qty}
          </p>
        </div>
      </div>

      {partialMode && (
        <div className="mt-4 space-y-3.5 pt-3.5 border-t border-[#F2F2F7]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#AEAEB2]">
              Quantité livrée
            </span>
            <div className="flex items-center gap-1 bg-[#F2F2F7] rounded p-1">
              <button
                onClick={() => onQtyChange(Math.max(0, deliveredQty - 1))}
                disabled={deliveredQty === 0}
                className="w-8 h-8 rounded bg-white flex items-center justify-center text-[#1C1C1E] text-base font-black shadow-sm disabled:opacity-30 active:scale-90 transition-transform"
              >
                −
              </button>
              <span className="w-8 text-center text-[14px] font-black text-[#1C1C1E] tabular-nums">{deliveredQty}</span>
              <button
                onClick={() => onQtyChange(Math.min(item.qty, deliveredQty + 1))}
                disabled={deliveredQty === item.qty}
                className="w-8 h-8 rounded bg-[#FF6B2C] flex items-center justify-center text-white text-base font-black shadow-sm disabled:opacity-30 active:scale-90 transition-transform"
              >
                +
              </button>
            </div>
          </div>

          {deliveredQty < item.qty && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#AEAEB2] block">
                Motif {deliveredQty === 0 ? "du refus" : "du partiel"}
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {PARTIAL_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => onReasonChange(r)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                      reason === r ? "bg-[#1C1C1E] text-white border-[#1C1C1E]" : "bg-white text-[#8E8E93] border-[#E5E5EA]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Staff Row Sub-component ───────────────────────────────────
function StaffRow({ label, name, phone }: { label: string; name: string; phone: string | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#F2F2F7] last:border-0">
      <div className="min-w-0">
        <span className="text-[9px] font-black uppercase tracking-wider text-[#AEAEB2] block">{label}</span>
        <p className="text-[13px] font-bold text-[#1C1C1E] truncate">{name}</p>
      </div>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="w-8 h-8 rounded bg-[#F2F2F7] flex items-center justify-center text-[#1C1C1E] active:scale-90 transition-transform"
        >
          <Phone size={13} strokeWidth={2.5} />
        </a>
      )}
    </div>
  );
}

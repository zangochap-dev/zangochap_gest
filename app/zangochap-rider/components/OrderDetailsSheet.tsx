"use client";

import React from "react";
import {
  X, Phone, MessageCircle, Navigation, Package,
  Check, RotateCcw, ChevronRight, MapPin, Banknote, CheckCircle2
} from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";
import { RiderOrder, RiderOrderItem } from "../types";
import { calculateOrderCollectionTotal } from "../utils";

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
  partialSummary,
  onStatusUpdate,
  onPartialConfirm,
  isPending,
}: OrderDetailsSheetProps) {
  if (!order) return null;

  const collectionTotal = calculateOrderCollectionTotal(order);
  const deliveredCount = order.items.reduce(
    (sum, item) => sum + (deliveredQuantities[item.id] || 0),
    0
  );

  const openWhatsApp = () => {
    let p = order.customerPhone.replace(/\D/g, "");
    if (p.startsWith("0")) p = "225" + p.slice(1);
    else if (!p.startsWith("225")) p = "225" + p;
    window.open(
      `https://wa.me/${p}?text=${encodeURIComponent(
        `Bonjour ${order.customerName}, votre livreur ZangoChap est en route.`
      )}`,
      "_blank"
    );
  };

  const openMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        (order.customerLocation ?? "") + ", " + (order.commune ?? "") + ", Abidjan"
      )}`,
      "_blank"
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-md h-[94dvh] bg-[#F5F5F7] rounded-t-2xl flex flex-col overflow-hidden shadow-xl">
        {/* ── Header ── */}
        <div className="shrink-0 px-5 pt-3 pb-4 bg-white border-b border-[#E5E5EA]">
          {/* Handle */}
          <div className="flex justify-center mb-3">
            <div className="w-9 h-1 rounded-full bg-[#E5E5EA]" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F0F0F2] text-[#8E8E93] active:scale-90 transition-transform duration-75"
              >
                <X size={18} />
              </button>
              <div>
                <h2 className="text-base font-semibold text-[#1C1C1E] leading-none mb-0.5">
                  #{order.ref}
                </h2>
                <p className="text-[11px] font-medium text-[#AEAEB2]">
                  {order.commune}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={order.status} />
              {order.isCommercialContacted && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#34C759] uppercase bg-[#34C759]/10 px-2 py-0.5 rounded-md">
                  <CheckCircle2 size={10} /> Contacté
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-36">
          <div className="p-4 space-y-3">
            {/* Customer Card */}
            <div className="bg-white rounded-xl p-4 border border-[#E5E5EA] space-y-4 ">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[#1C1C1E] truncate">
                    {order.customerName}
                  </h3>
                  <p className="text-sm font-medium text-[#8E8E93]">
                    {order.customerPhone}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="w-10 h-10 rounded-full bg-[#F0F0F2] border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] active:scale-90 transition-transform duration-75"
                  >
                    <Phone size={16} />
                  </a>
                  <button
                    onClick={openWhatsApp}
                    className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] active:scale-90 transition-transform duration-75"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              </div>

              {/* Location Bar */}
              <button
                onClick={openMaps}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-[#F5F5F7] active:bg-[#E5E5EA] transition-colors"
              >
                <MapPin size={16} className="shrink-0 text-[#FF6B2C]" />
                <p className="text-sm font-medium text-[#8E8E93] flex-1 text-left truncate">
                  {order.customerLocation || "Aucune adresse"}
                </p>
                <Navigation size={14} className="shrink-0 text-[#AEAEB2]" />
              </button>
            </div>

            {/* Amount Card */}
            <div className="bg-white rounded-xl p-5 border border-[#E5E5EA] ">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">
                  {partialMode ? "Encaissement partiel" : "À encaisser"}
                </span>
                <div className="flex items-center gap-1.5 text-[#AEAEB2]">
                  <Banknote size={14} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    Cash
                  </span>
                </div>
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-[#1C1C1E] tabular-nums">
                {formatPrice(partialMode ? partialSummary.total : collectionTotal)}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-medium text-[#AEAEB2]">
                  Livraison : {formatPrice(order.deliveryFee)}
                </span>
                {partialMode && (
                  <button
                    onClick={() => setIncludeDeliveryFee(!includeDeliveryFee)}
                    className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full transition-colors ${
                      includeDeliveryFee
                        ? "bg-[#34C759]/10 text-[#34C759]"
                        : "bg-[#F0F0F2] text-[#AEAEB2]"
                    }`}
                  >
                    {includeDeliveryFee ? "Livraison incluse" : "Livraison exclue"}
                  </button>
                )}
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-xs font-semibold text-[#AEAEB2] uppercase tracking-wider">
                  Articles ({order.items.length})
                </span>
                <button
                  onClick={() => setPartialMode(!partialMode)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                    partialMode
                      ? "bg-[#FF453A]/10 text-[#FF453A]"
                      : "bg-[#F0F0F2] text-[#FF6B2C] border border-[#E5E5EA]"
                  }`}
                >
                  {partialMode ? "Annuler" : "Mode partiel"}
                </button>
              </div>

              {order.items.map((item: RiderOrderItem) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  partialMode={partialMode}
                  deliveredQty={deliveredQuantities[item.id] ?? 0}
                  onQtyChange={(qty) => updateItemQty(item.id, qty)}
                />
              ))}
            </div>

            {/* Delivery Note */}
            {order.deliveryNote && (
              <div className="bg-white rounded-xl p-4 border border-[#E5E5EA] ">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AEAEB2] mb-2">
                  Note client
                </p>
                <p className="text-sm font-medium text-[#8E8E93] leading-relaxed">
                  {order.deliveryNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Fixed Action Bar ── */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#E5E5EA]"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 16px)" }}
        >
          {!partialMode ? (
            <div className="flex gap-3">
              <button
                disabled={isPending}
                onClick={() => onStatusUpdate(order.id, "DELIVERED")}
                className="flex-[4] h-14 bg-[#34C759] rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-75 disabled:opacity-40 "
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Check size={20} strokeWidth={3} /> Livré</>
                )}
              </button>
              
              <button
                disabled={isPending}
                onClick={() => setPartialMode(true)}
                className="flex-1 h-14 bg-[#FF9F0A]/10 rounded-xl text-[#FF9F0A] flex items-center justify-center active:scale-[0.97] transition-transform duration-75 disabled:opacity-40"
                title="Livraison Partielle"
              >
                <Package size={20} />
              </button>

              <button
                disabled={isPending}
                onClick={() => onStatusUpdate(order.id, "RETURNED")}
                className="flex-1 h-14 bg-[#FF453A]/10 rounded-xl text-[#FF453A] flex items-center justify-center active:scale-[0.97] transition-transform duration-75 disabled:opacity-40"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          ) : (
            <button
              disabled={isPending || deliveredCount === 0}
              onClick={onPartialConfirm}
              className="w-full h-14 bg-[#FF9F0A] rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-75 disabled:opacity-40 "
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Confirmer partiel · {formatPrice(partialSummary.total)}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Item Row Sub-component ───────────────────────────────────
function ItemRow({
  item,
  partialMode,
  deliveredQty,
  onQtyChange,
}: {
  item: RiderOrderItem;
  partialMode: boolean;
  deliveredQty: number;
  onQtyChange: (qty: number) => void;
}) {
  const isExcluded = partialMode && deliveredQty === 0;

  return (
    <div
      className={`bg-white rounded-xl p-4 border border-[#E5E5EA]  transition-opacity ${
        isExcluded ? "opacity-40" : ""
      }`}
    >
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F0F0F2] shrink-0 flex items-center justify-center">
          {item.image ? (
            <img
              src={item.image}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Package size={18} className="text-[#AEAEB2]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className={`text-sm font-semibold truncate ${isExcluded ? "line-through text-[#AEAEB2]" : "text-[#1C1C1E]"}`}>
              {item.name}
            </p>
            <p className="text-sm font-bold text-[#1C1C1E] tabular-nums whitespace-nowrap">
              {formatPrice(item.price * (partialMode ? deliveredQty : item.qty))}
            </p>
          </div>
          <p className="text-[11px] font-medium text-[#AEAEB2]">
            {item.size} · {item.color} · ×{item.qty}
          </p>
        </div>
      </div>

      {partialMode && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#AEAEB2]">
            Qté livrée
          </span>
          <div className="flex items-center gap-1 bg-[#F0F0F2] rounded-full p-1">
            <button
              onClick={() => onQtyChange(Math.max(0, deliveredQty - 1))}
              disabled={deliveredQty === 0}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#1C1C1E] text-sm font-bold disabled:opacity-30 active:scale-90 transition-transform duration-75 "
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-bold text-[#1C1C1E] tabular-nums">
              {deliveredQty}
            </span>
            <button
              onClick={() => onQtyChange(Math.min(item.qty, deliveredQty + 1))}
              disabled={deliveredQty === item.qty}
              className="w-8 h-8 rounded-full bg-[#FF6B2C] flex items-center justify-center text-white text-sm font-bold disabled:opacity-30 active:scale-90 transition-transform duration-75"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
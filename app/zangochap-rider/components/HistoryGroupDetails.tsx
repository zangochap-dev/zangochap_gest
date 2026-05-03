"use client";

import React from "react";
import { X, Calendar, Banknote, Package, CheckCircle2, XCircle, RotateCcw, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/constants";
import { RiderOrder } from "../types";
import { OrderCard } from "./OrderCard";

interface HistoryGroupDetailsProps {
  date: string;
  orders: RiderOrder[];
  onClose: () => void;
  onOpenOrder: (order: RiderOrder) => void;
}

export function HistoryGroupDetails({ date, orders, onClose, onOpenOrder }: HistoryGroupDetailsProps) {
  const stats = {
    total: orders.reduce((acc, o) => acc + o.total + o.deliveryFee - (o.discount || 0), 0),
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    returned: orders.filter(o => o.status === "RETURNED" || o.status === "CANCELLED").length,
    partial: orders.filter(o => o.status === "PARTIALLY_DELIVERED").length,
    count: orders.length
  };

  const label = new Date(date).toLocaleDateString("fr-FR", { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[200] bg-[#F5F5F7] flex flex-col"
    >
      {/* Header */}
      <header className="shrink-0 px-4 pt-6 pb-4 bg-white border-b border-[#E5E5EA]">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#1C1C1E] active:scale-90 transition-transform"
          >
            <X size={18} />
          </button>
          <div>
            <h2 className="text-[16px] font-black text-[#1C1C1E] leading-none mb-1">
              Détails de Session
            </h2>
            <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
              {label}
            </p>
          </div>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="p-4 space-y-4 overflow-y-auto pb-10">
        <div className="bg-[#1C1C1E] rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-white/5 rotate-12">
            <Banknote size={100} strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1 block">
              Recettes Totales
            </span>
            <p className="text-[28px] font-black text-white tabular-nums mb-4">
              {formatPrice(stats.total)}
            </p>
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
              <div className="text-center">
                <p className="text-[14px] font-black text-[#34C759]">{stats.delivered}</p>
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-wider">Livrés</p>
              </div>
              <div className="text-center">
                <p className="text-[14px] font-black text-[#FF9500]">{stats.partial}</p>
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-wider">Partiels</p>
              </div>
              <div className="text-center">
                <p className="text-[14px] font-black text-[#FF3B30]">{stats.returned}</p>
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-wider">Retours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-[#1C1C1E] uppercase tracking-wider">
              Liste des courses ({stats.count})
            </span>
          </div>
          <div className="space-y-2">
            {orders.map((order, idx) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                index={idx} 
                onClick={() => onOpenOrder(order)} 
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

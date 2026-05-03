"use client";

import React from "react";
import { Calendar, ChevronRight, Banknote, Package, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { RiderOrder } from "../types";

interface HistoryGroupCardProps {
  date: string;
  orders: RiderOrder[];
  onClick: () => void;
}

export function HistoryGroupCard({ date, orders, onClick }: HistoryGroupCardProps) {
  const stats = {
    total: orders.reduce((acc, o) => acc + o.total + o.deliveryFee - (o.discount || 0), 0),
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    pending: orders.filter(o => !["DELIVERED", "RETURNED", "CANCELLED"].includes(o.status)).length,
    count: orders.length
  };

  const isToday = date === new Date().toDateString();
  const isYesterday = date === new Date(Date.now() - 86400000).toDateString();
  const label = isToday ? "Aujourd'hui" : isYesterday ? "Hier" : new Date(date).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-[#F2F2F7] p-4 text-left active:scale-[0.98] transition-all shadow-sm flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-xl bg-[#F2F2F7] flex flex-col items-center justify-center text-[#1C1C1E]">
        <Calendar size={18} className="mb-0.5 opacity-50" />
        <span className="text-[10px] font-black uppercase">{new Date(date).getDate()}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[15px] font-black text-[#1C1C1E] capitalize">{label}</h3>
          <span className="text-[14px] font-black text-[#FF6B2C] tabular-nums">
            {formatPrice(stats.total)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Package size={12} className="text-[#AEAEB2]" />
            <span className="text-[11px] font-bold text-[#AEAEB2]">
              {stats.count} courses
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-[#34C759]" />
            <span className="text-[11px] font-bold text-[#34C759]">
              {stats.delivered} livrés
            </span>
          </div>
          {stats.pending > 0 && (
            <div className="flex items-center gap-1 bg-[#FF3B30]/10 px-1.5 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-[#FF3B30] animate-pulse" />
              <span className="text-[10px] font-black text-[#FF3B30] uppercase">
                {stats.pending} à faire
              </span>
            </div>
          )}
        </div>
      </div>

      <ChevronRight size={18} className="text-[#AEAEB2]" />
    </button>
  );
}

"use client";

import React from "react";
import { Wallet, TrendingUp, Banknote, History, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/constants";
import { RiderOrder, RiderStats } from "../types";

export function WalletView({ stats, ordersToSettle }: { stats: RiderStats, ordersToSettle: RiderOrder[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 py-2 pb-10"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[20px] font-black text-[#1C1C1E]">Mes Revenus</h2>
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[#34C759] bg-[#34C759]/10 px-2.5 py-1.5 rounded border border-[#34C759]/10">
          <span className="w-1 h-1 rounded-full bg-[#34C759] animate-pulse" />
          En service
        </span>
      </div>

      {/* Main Revenue Card */}
      <div className="bg-[#1C1C1E] rounded-2xl p-6 relative overflow-hidden shadow-lg">
        <div className="absolute -right-8 -top-8 text-white/5 rotate-12">
          <Wallet size={120} strokeWidth={1} />
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2">
            Cash en main
          </p>
          <h3 className="text-[36px] font-black tracking-tight text-white mb-6 tabular-nums leading-none">
            {formatPrice(stats.cash)}
          </h3>

          <div className="flex items-center justify-between pt-5 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#34C759]/20 flex items-center justify-center">
                <TrendingUp size={14} className="text-[#34C759]" />
              </div>
              <span className="text-[12px] font-bold text-white/80">
                {stats.deliveredToday} livraisons aujourd'hui
              </span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded border border-white/10">
              <Banknote size={12} className="text-white/60" />
              <span className="text-[9px] font-black uppercase text-white/60">Cash</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Breakdown */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-[0.2em] px-1">
          Détails des encaissements
        </h4>
        <div className="bg-white border border-[#F2F2F7] rounded-xl overflow-hidden divide-y divide-[#F2F2F7] shadow-sm">
          {ordersToSettle.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[12px] font-bold text-[#AEAEB2]">Aucun encaissement en attente</p>
            </div>
          ) : (
            ordersToSettle.map(order => (
              <div key={order.id} className="p-4 flex items-center justify-between bg-white hover:bg-[#F2F2F7]/50 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-black text-[#1C1C1E]">#{order.ref}</span>
                    <span className="text-[10px] font-bold text-[#AEAEB2] truncate max-w-[100px]">{order.customerName}</span>
                  </div>
                  <p className="text-[10px] font-bold text-[#AEAEB2] uppercase">
                    {new Date(order.updatedAt || order.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-black text-[#1C1C1E] tabular-nums">
                    {formatPrice(order.total + order.deliveryFee - (order.discount || 0))}
                  </p>
                  <span className="text-[9px] font-black text-[#34C759] uppercase bg-[#34C759]/10 px-1.5 py-0.5 rounded">Reçu</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-[0.2em] px-1">
          Rapports
        </h4>
        <button className="w-full bg-white rounded-xl border border-[#F2F2F7] p-3.5 flex items-center justify-between group active:bg-[#F2F2F7] transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
              <History size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#1C1C1E]">Historique des versements</p>
              <p className="text-[10px] font-semibold text-[#AEAEB2]">Consultez vos reçus de caisse</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#AEAEB2] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

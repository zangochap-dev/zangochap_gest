"use client";

import React from "react";
import { Wallet, TrendingUp, Banknote, History, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/constants";
import { RiderOrder, RiderStats } from "../types";
import { calculateOrderCollectionTotal } from "../utils";

export function WalletView({ stats, ordersToSettle }: { stats: RiderStats, ordersToSettle: RiderOrder[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 py-2 pb-10"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[20px] font-black text-[#111827]">Mes Revenus</h2>
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[#166534] bg-[#F0FDF4] px-2.5 py-1.5 rounded-sm border border-[#BBF7D0]">
          <span className="w-1.5 h-1.5 rounded-sm bg-[#166534]" />
          En service
        </span>
      </div>

      {/* Main Revenue Card */}
      <div className="bg-[#111827] rounded-md p-6 relative overflow-hidden shadow-sm">
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
              <div className="w-7 h-7 rounded bg-[#166534]/20 flex items-center justify-center">
                <TrendingUp size={14} className="text-[#166534]" />
              </div>
              <span className="text-[12px] font-bold text-white/80">
                {stats.deliveredToday} livraisons aujourd&apos;hui
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
        <h4 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-[0.2em] px-1">
          Détails des encaissements
        </h4>
        <div className="bg-white border border-[#F3F4F6] rounded-md overflow-hidden divide-y divide-[#F3F4F6] shadow-sm">
          {ordersToSettle.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[12px] font-bold text-[#9CA3AF]">Aucun encaissement en attente</p>
            </div>
          ) : (
            ordersToSettle.map(order => (
              <div key={order.id} className="p-4 flex items-center justify-between bg-white hover:bg-[#F3F4F6]/50 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-black text-[#111827]">#{order.ref}</span>
                    <span className="text-[10px] font-bold text-[#9CA3AF] truncate max-w-[100px]">{order.customerName}</span>
                  </div>
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase">
                    {new Date(order.updatedAt || order.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-black text-[#111827] tabular-nums">
                    {formatPrice(calculateOrderCollectionTotal(order))}
                  </p>
                  <span className="text-[9px] font-black text-[#166534] uppercase bg-[#F0FDF4] px-1.5 py-0.5 rounded-sm border border-[#BBF7D0]">Reçu</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-[0.2em] px-1">
          Rapports
        </h4>
        <button className="w-full bg-white rounded-md border border-[#F3F4F6] p-3.5 flex items-center justify-between group active:bg-[#F3F4F6] transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#EFF6FF] flex items-center justify-center text-[#1E40AF]">
              <History size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111827]">Historique des versements</p>
              <p className="text-[10px] font-semibold text-[#9CA3AF]">Consultez vos reçus de caisse</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#9CA3AF] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

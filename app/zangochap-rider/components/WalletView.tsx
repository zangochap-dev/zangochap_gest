"use client";

import React from "react";
import { Wallet, TrendingUp, Banknote, History } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { RiderStats } from "../types";

export function WalletView({ stats }: { stats: RiderStats }) {
  return (
    <div className="space-y-6 py-2 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1C1C1E]">Revenus</h2>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#34C759] bg-[#34C759]/10 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
          En service
        </span>
      </div>

      {/* Main Revenue Card */}
      <div className="bg-white rounded-xl p-6 border border-[#E5E5EA]  relative overflow-hidden">
        <div className="absolute -right-4 -top-4 text-[#F0F0F2]">
          <Wallet size={120} strokeWidth={1} />
        </div>

        <div className="relative z-10">
          <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-2">
            Total à reverser
          </p>
          <h3 className="text-4xl font-extrabold tracking-tight text-[#1C1C1E] mb-6">
            {formatPrice(stats.cash)}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-[#34C759]" />
              <span className="text-sm font-medium text-[#8E8E93]">
                {stats.deliveredToday} livraisons aujourd'hui
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#AEAEB2] bg-[#F0F0F2] px-2.5 py-1 rounded-full border border-[#E5E5EA]">
              Cash
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="text-xs font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">
          Actions rapides
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center justify-center gap-3 h-28 bg-white border border-[#E5E5EA] rounded-xl active:scale-[0.97] transition-transform duration-75 ">
            <div className="w-10 h-10 rounded-full bg-[#F0F0F2] flex items-center justify-center text-[#FF6B2C]">
              <Banknote size={20} />
            </div>
            <span className="text-[11px] font-semibold text-[#8E8E93]">
              Verser Cash
            </span>
          </button>
          <button className="flex flex-col items-center justify-center gap-3 h-28 bg-white border border-[#E5E5EA] rounded-xl active:scale-[0.97] transition-transform duration-75 ">
            <div className="w-10 h-10 rounded-full bg-[#F0F0F2] flex items-center justify-center text-[#8E8E93]">
              <History size={20} />
            </div>
            <span className="text-[11px] font-semibold text-[#8E8E93]">
              Historique
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { User, LogOut, ChevronRight, Shield, Star } from "lucide-react";

interface UserProps {
  id: string;
  name: string;
  email: string;
}

export function ProfileView({ user, logout }: { user: UserProps; logout: () => void }) {
  return (
    <div className="space-y-6 py-2 pb-10">
      <h2 className="text-xl font-bold text-[#1C1C1E]">Mon compte</h2>

      {/* Identity Card */}
      <div className="bg-white rounded-xl p-5 border border-[#E5E5EA]  flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#FF6B2C] flex items-center justify-center text-xl font-bold text-white shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[#1C1C1E] truncate">{user?.name}</h3>
          <p className="text-xs font-medium text-[#AEAEB2] truncate">{user?.email}</p>
        </div>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#E5E5EA] rounded-xl p-4 ">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-[#FF6B2C]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#AEAEB2]">
              Statut
            </span>
          </div>
          <p className="text-lg font-bold text-[#1C1C1E]">Élite</p>
        </div>
        <div className="bg-white border border-[#E5E5EA] rounded-xl p-4 ">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-[#FF9F0A]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#AEAEB2]">
              Fiabilité
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-bold text-[#1C1C1E]">4.98</p>
            <span className="text-xs font-medium text-[#AEAEB2]">/5</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div>
        <h4 className="text-xs font-semibold text-[#AEAEB2] uppercase tracking-wider mb-3">
          Paramètres
        </h4>
        <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden divide-y divide-[#E5E5EA] ">
          <button className="w-full flex items-center justify-between px-4 py-4 active:bg-[#F0F0F2] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F0F0F2] flex items-center justify-center text-[#8E8E93]">
                <User size={16} />
              </div>
              <span className="text-sm font-medium text-[#1C1C1E]">Gérer mon profil</span>
            </div>
            <ChevronRight size={16} className="text-[#AEAEB2]" />
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-between px-4 py-4 active:bg-[#F0F0F2] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF453A]/10 flex items-center justify-center text-[#FF453A]">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-medium text-[#FF453A]">Déconnexion</span>
            </div>
            <ChevronRight size={16} className="text-[#AEAEB2]" />
          </button>
        </div>
      </div>
    </div>
  );
}

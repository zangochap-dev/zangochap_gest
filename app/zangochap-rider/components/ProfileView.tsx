"use client";

import React from "react";
import { User, LogOut, ChevronRight, Shield, Star, Bell, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

interface UserProps {
  id: string;
  name: string;
  email: string;
}

export function ProfileView({ user, logout }: { user: UserProps; logout: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 py-2 pb-10"
    >
      <h2 className="text-[20px] font-black text-[#1C1C1E] px-1">Mon Compte</h2>

      {/* Identity Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#F2F2F7] shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#FF6B2C] flex items-center justify-center text-xl font-black text-white shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-black text-[#1C1C1E] truncate mb-0.5">{user?.name}</h3>
          <p className="text-[12px] font-bold text-[#AEAEB2] truncate uppercase tracking-wider">{user?.email}</p>
        </div>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-white border border-[#F2F2F7] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-6 h-6 rounded bg-[#FF6B2C]/10 flex items-center justify-center">
              <Shield size={12} className="text-[#FF6B2C]" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#AEAEB2]">
              Statut
            </span>
          </div>
          <p className="text-[16px] font-black text-[#1C1C1E]">Livreur Élite</p>
        </div>
        <div className="bg-white border border-[#F2F2F7] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-6 h-6 rounded bg-[#FF9500]/10 flex items-center justify-center">
              <Star size={12} className="text-[#FF9500]" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#AEAEB2]">
              Note
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-[16px] font-black text-[#1C1C1E]">4.98</p>
            <span className="text-[11px] font-bold text-[#AEAEB2]">/5</span>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-[0.2em] px-1">
          Préférences
        </h4>
        <div className="bg-white border border-[#F2F2F7] rounded-xl overflow-hidden divide-y divide-[#F2F2F7] shadow-sm">
          <MenuButton icon={<User size={16} />} label="Informations personnelles" />
          <MenuButton icon={<Bell size={16} />} label="Notifications" />
          <MenuButton icon={<HelpCircle size={16} />} label="Centre d'aide" />
          <button
            onClick={logout}
            className="w-full flex items-center justify-between px-4 py-4 active:bg-[#FFF5F5] transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30] group-hover:scale-105 transition-transform">
                <LogOut size={16} />
              </div>
              <span className="text-[14px] font-bold text-[#FF3B30]">Déconnexion</span>
            </div>
            <ChevronRight size={16} className="text-[#FF3B30]/30" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MenuButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-4 active:bg-[#F2F2F7] transition-colors group">
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <span className="text-[14px] font-bold text-[#1C1C1E]">{label}</span>
      </div>
      <ChevronRight size={16} className="text-[#AEAEB2] group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

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
      <h2 className="text-[20px] font-black text-[#111827] px-1">Mon Compte</h2>

      {/* Identity Card */}
      <div className="bg-white rounded-md p-5 border border-[#F3F4F6] shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-md bg-[#334155] flex items-center justify-center text-xl font-black text-white shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-black text-[#111827] truncate mb-0.5">{user?.name}</h3>
          <p className="text-[12px] font-bold text-[#9CA3AF] truncate uppercase tracking-wider">{user?.email}</p>
        </div>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-white border border-[#F3F4F6] rounded-md p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-6 h-6 rounded bg-[#334155]/10 flex items-center justify-center">
              <Shield size={12} className="text-[#334155]" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">
              Statut
            </span>
          </div>
          <p className="text-[16px] font-black text-[#111827]">Livreur Élite</p>
        </div>
        <div className="bg-white border border-[#F3F4F6] rounded-md p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-6 h-6 rounded bg-[#B45309]/10 flex items-center justify-center">
              <Star size={12} className="text-[#B45309]" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#9CA3AF]">
              Note
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-[16px] font-black text-[#111827]">4.98</p>
            <span className="text-[11px] font-bold text-[#9CA3AF]">/5</span>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-[0.2em] px-1">
          Préférences
        </h4>
        <div className="bg-white border border-[#F3F4F6] rounded-md overflow-hidden divide-y divide-[#F3F4F6] shadow-sm">
          <MenuButton icon={<User size={16} />} label="Informations personnelles" />
          <MenuButton icon={<Bell size={16} />} label="Notifications" />
          <MenuButton icon={<HelpCircle size={16} />} label="Centre d'aide" />
          <button
            onClick={logout}
            className="w-full flex items-center justify-between px-4 py-4 active:bg-[#FFF5F5] transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-md bg-[#B91C1C]/10 flex items-center justify-center text-[#B91C1C] group-hover:scale-105 transition-transform">
                <LogOut size={16} />
              </div>
              <span className="text-[14px] font-bold text-[#B91C1C]">Déconnexion</span>
            </div>
            <ChevronRight size={16} className="text-[#B91C1C]/30" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MenuButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-4 active:bg-[#F3F4F6] transition-colors group">
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-md bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <span className="text-[14px] font-bold text-[#111827]">{label}</span>
      </div>
      <ChevronRight size={16} className="text-[#9CA3AF] group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

"use client";

import React from "react";
import { LayoutDashboard, Wallet, User, LucideIcon } from "lucide-react";

type Tab = "missions" | "wallet" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  pendingCount?: number;
}

interface NavItem {
  key: Tab;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: "missions", label: "Missions", icon: LayoutDashboard },
  { key: "wallet",   label: "Revenus",  icon: Wallet },
  { key: "profile",  label: "Compte",   icon: User },
];

export function BottomNav({ activeTab, setActiveTab, pendingCount }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around bg-white border-t border-[#E5E5EA] px-2 pt-2 pb-2 shadow-[0_-1px_10px_rgba(0,0,0,0.04)]">
        {NAV_ITEMS.map((item) => (
          <NavBtn
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.key}
            badge={item.key === "missions" ? pendingCount : undefined}
            onClick={() => setActiveTab(item.key)}
          />
        ))}
      </div>
    </nav>
  );
}

interface NavBtnProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}

function NavBtn({ icon: Icon, label, active, badge, onClick }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-1 py-2 px-5 rounded-xl transition-colors duration-150"
      style={active ? { backgroundColor: "rgba(255,107,44,0.08)" } : undefined}
    >
      <div className="relative">
        <Icon
          size={22}
          strokeWidth={active ? 2.5 : 1.8}
          className={active ? "text-[#FF6B2C]" : "text-[#AEAEB2]"}
        />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#FF453A] text-[9px] font-bold text-white px-1">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span
        className={`text-[10px] font-semibold ${
          active ? "text-[#FF6B2C]" : "text-[#AEAEB2]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
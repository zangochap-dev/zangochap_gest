"use client";

import React from "react";
import { History, LayoutDashboard, Wallet, User, LucideIcon } from "lucide-react";

type Tab = "missions" | "history" | "wallet" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  pendingCount?: number;
  historyCount?: number;
}

interface NavItem {
  key: Tab;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: "missions", label: "Missions", icon: LayoutDashboard },
  { key: "history",  label: "Historique", icon: History },
  { key: "wallet",   label: "Revenus",  icon: Wallet },
  { key: "profile",  label: "Compte",   icon: User },
];

export function BottomNav({ activeTab, setActiveTab, pendingCount, historyCount }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around bg-white border-t border-[#E5E7EB] px-2 pt-2 pb-2">
        {NAV_ITEMS.map((item) => (
          <NavBtn
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.key}
            badge={item.key === "missions" ? pendingCount : item.key === "history" ? historyCount : undefined}
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
      className="relative flex flex-col items-center justify-center gap-1 pt-1.5 pb-1 px-4 transition-colors duration-150"
    >
      <div className="relative">
        <Icon
          size={20}
          strokeWidth={active ? 2.5 : 2}
          className={active ? "text-[#111827]" : "text-[#9CA3AF]"}
        />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-sm bg-[#FF453A] text-[8px] font-bold text-white px-1">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span
        className={`text-[9px] font-bold tracking-wide ${
          active ? "text-[#111827]" : "text-[#9CA3AF]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

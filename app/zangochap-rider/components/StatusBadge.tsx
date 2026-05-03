"use client";

import React from "react";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DELIVERED: { label: "Livré", color: "#34C759", bg: "#EAF9EE", dot: "#34C759" },
  RETURNED: { label: "Retourné", color: "#FF3B30", bg: "#FFEBEA", dot: "#FF3B30" },
  CANCELLED: { label: "Annulé", color: "#FF3B30", bg: "#FFEBEA", dot: "#FF3B30" },
  PENDING: { label: "À livrer", color: "#FF9500", bg: "#FFF4E6", dot: "#FF9500" },
  ON_DELIVERY: { label: "En cours", color: "#007AFF", bg: "#E5F1FF", dot: "#007AFF" },
  PARTIALLY_DELIVERED: { label: "Partiel", color: "#FF9500", bg: "#FFF4E6", dot: "#FF9500" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.PENDING;
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-[0.05em] whitespace-nowrap border"
      style={{ 
        backgroundColor: cfg.bg, 
        color: cfg.color,
        borderColor: `${cfg.color}15`
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: cfg.dot }}
      />
      {cfg.label}
    </div>
  );
}

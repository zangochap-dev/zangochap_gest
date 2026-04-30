"use client";

import React from "react";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  DELIVERED: { label: "Livré", color: "#34C759", bg: "rgba(52,199,89,0.12)" },
  RETURNED: { label: "Retour", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  CANCELLED: { label: "Annulé", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  PENDING: { label: "À faire", color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
  ON_DELIVERY: { label: "En cours", color: "#0A84FF", bg: "rgba(10,132,255,0.12)" },
  PARTIALLY_DELIVERED: { label: "Partiel", color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.PENDING;
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 px-1 rounded-full text-[8px] font-semibold uppercase tracking-wider whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span
        className="w-1.5 h-1.5 text-sm rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </div>
  );
}

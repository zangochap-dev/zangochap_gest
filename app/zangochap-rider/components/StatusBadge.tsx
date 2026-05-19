"use client";

import React from "react";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DELIVERED: { label: "Livré", color: "#166534", bg: "#F0FDF4", border: "#BBF7D0" },
  RETURNED: { label: "Retourné", color: "#991B1B", bg: "#FEF2F2", border: "#FECACA" },
  CANCELLED: { label: "Annulé", color: "#991B1B", bg: "#FEF2F2", border: "#FECACA" },
  PENDING: { label: "À livrer", color: "#334155", bg: "#F8FAFC", border: "#E2E8F0" },
  ON_DELIVERY: { label: "En route", color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE" },
  REPRO_DISPO: { label: "Repro-dispo", color: "#92400E", bg: "#FFFBEB", border: "#FDE68A" },
  PARTIALLY_DELIVERED: { label: "Partiel", color: "#92400E", bg: "#FFFBEB", border: "#FDE68A" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.PENDING;

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] whitespace-nowrap"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        borderColor: cfg.border,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </div>
  );
}

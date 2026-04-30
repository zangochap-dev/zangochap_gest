"use client";

import React from "react";
import { MapPin, Package, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";
import { RiderOrder } from "../types";
import { calculateOrderCollectionTotal } from "../utils";

interface OrderCardProps {
  order: RiderOrder;
  onClick: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const total = calculateOrderCollectionTotal(order);
  const isActive = !["DELIVERED", "RETURNED", "CANCELLED", "PARTIALLY_DELIVERED"].includes(order.status);
  const totalQty = order.items?.reduce((sum, i) => sum + i.qty, 0) ?? 0;

  return (
    <div className="bg-white overflow-hidden rounded-md border border-[#E5E5EA]">
      <button
        onClick={onClick}
        className="w-full bg-white border-b border-[#E5E5EA] flex items-center gap-4 p-4 bg-white text-left"
      >


        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1 truncate">
              <span className="font-semibold text-[14px] text-[#1C1C1E]">{order.ref}</span>

              <MapPin size={10} className="shrink-0 text-orange-500" />
              <span className="truncate">{order.commune}</span>
            </div>
            <span className="w-0.5 h-0.5 rounded-full bg-[#AEAEB2]" />
            <span className="text-[12px] font-bold text-[#FF6B2C] tabular-nums whitespace-nowrap">
              {formatPrice(total)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#8E8E93]">
            <span className="text-[14px] font-semibold text-[#1C1C1E] truncate">
              {order.customerName}
            </span>


          </div>

          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            <span className="text-[11px] font-medium text-[#AEAEB2]">
              {totalQty} art.
            </span>
          </div>
        </div>

        <ChevronRight size={16} className="shrink-0 text-[#AEAEB2]" />
      </button>
    </div>
  );
}
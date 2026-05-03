"use client";

import React from "react";
import { MapPin, Package, ChevronRight, Banknote, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";
import { RiderOrder } from "../types";
import { calculateOrderCollectionTotal } from "../utils";

interface OrderCardProps {
  order: RiderOrder;
  onClick: () => void;
  index?: number;
}

export function OrderCard({ order, onClick, index = 0 }: OrderCardProps) {
  const total = calculateOrderCollectionTotal(order);
  const totalQty = order.items?.reduce((sum, i) => sum + i.qty, 0) ?? 0;
  const time = new Date(order.updatedAt || order.createdAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <button
        onClick={onClick}
        className="w-full bg-white rounded-xl border border-[#E5E5EA] p-3.5 text-left active:scale-[0.98] transition-all duration-150 shadow-sm hover:shadow-sm group"
      >
        <div className="flex flex-col gap-3">
          {/* Top Row: Ref & Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-[#F2F2F7] px-2 py-1 rounded-md">
                <span className="text-[11px] font-bold text-[#1C1C1E] tabular-nums">#{order.ref}</span>
              </div>
              <div className="flex items-center gap-1 text-[#8E8E93]">
                <Clock size={12} />
                <span className="text-[10px] font-medium">{time}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FF6B2C]/5 px-3 py-1 rounded-full border border-[#FF6B2C]/10">
              <Banknote size={12} className="text-[#FF6B2C]" />
              <span className="text-[13px] font-extrabold text-[#FF6B2C] tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Middle Row: Customer & Location */}
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold text-[#1C1C1E] leading-tight">
              {order.customerName}
            </h3>
            <div className="flex items-center gap-1.5 text-[#8E8E93]">
              <MapPin size={12} className="text-[#FF6B2C] shrink-0" />
              <span className="text-[12px] font-medium truncate">{order.commune}</span>
            </div>
          </div>

          {/* Bottom Row: Status & Items */}
          <div className="flex items-center justify-between pt-1 border-t border-[#F2F2F7]">
            <StatusBadge status={order.status} />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[#AEAEB2]">
                <Package size={12} />
                <span className="text-[11px] font-semibold">{totalQty} art.</span>
              </div>
              <ChevronRight size={16} className="text-[#AEAEB2] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
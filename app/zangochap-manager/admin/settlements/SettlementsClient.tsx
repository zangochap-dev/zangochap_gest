"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  Filter,
  Landmark,
  ReceiptText,
  ShoppingBag,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";
import { EmptyState, StatusBadge, TableCard } from "@/components/UI";
import { formatDay, formatPrice } from "@/lib/constants";

type SettlementStat = {
  method: string;
  count: number;
  total: number;
};

type SettlementOrder = {
  id: string;
  ref: string;
  total: number;
  deliveryFee: number;
  discount: number;
  paymentMethod: string | null;
  customerName: string;
  createdAt: string | Date;
  commercialName: string | null;
  status: string;
};

type CommercialOption = {
  id: string;
  name: string;
};

type SettlementsClientProps = {
  initialStats: {
    methods: SettlementStat[];
    orders: SettlementOrder[];
  };
  initialFrom?: string;
  initialTo?: string;
  commercials: CommercialOption[];
  initialCommercialId?: string;
  initialMethod?: string;
};

const PAYMENT_METHODS = [
  "MTN Money",
  "Orange Money",
  "Moov Money",
  "Wave",
  "Virement",
  "Cash",
];

function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function orderNetTotal(order: SettlementOrder) {
  return Number(order.total || 0) + Number(order.deliveryFee || 0) - Number(order.discount || 0);
}

export default function SettlementsClient({
  initialStats,
  initialFrom,
  initialTo,
  commercials,
  initialCommercialId,
  initialMethod,
}: SettlementsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(initialFrom || "");
  const [to, setTo] = useState(initialTo || "");
  const [commercialId, setCommercialId] = useState(initialCommercialId || "");
  const [method, setMethod] = useState(initialMethod || "");

  const totalAmount = useMemo(
    () => initialStats.methods.reduce((sum, stat) => sum + stat.total, 0),
    [initialStats.methods],
  );
  const totalTransactions = useMemo(
    () => initialStats.methods.reduce((sum, stat) => sum + stat.count, 0),
    [initialStats.methods],
  );
  const averageBasket = totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0;
  const today = localDateInputValue();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDateInputValue(yesterdayDate);
  const hasFilters = Boolean(from || to || commercialId || method);

  const applyFilters = (next: {
    from?: string;
    to?: string;
    commercialId?: string;
    method?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextFrom = next.from ?? from;
    const nextTo = next.to ?? to;
    const nextCommercial = next.commercialId ?? commercialId;
    const nextMethod = next.method ?? method;

    if (nextFrom) params.set("from", nextFrom); else params.delete("from");
    if (nextTo) params.set("to", nextTo); else params.delete("to");
    if (nextCommercial) params.set("commercialId", nextCommercial); else params.delete("commercialId");
    if (nextMethod) params.set("method", nextMethod); else params.delete("method");

    const query = params.toString();
    router.push(query ? `?${query}` : "?");
  };

  const applyDateRange = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom);
    setTo(nextTo);
    applyFilters({ from: nextFrom, to: nextTo });
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setCommercialId("");
    setMethod("");
    router.push("?");
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-5 md:px-6 md:py-6">
      <div className="mb-5 flex flex-col gap-4 border-b border-[#E8DED4] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase text-[#D4541C]">
            <Landmark size={14} />
            Encaissements
          </div>
          <h1 className="text-[24px] font-black text-[#1A1410] md:text-[28px]">Comptes operateurs</h1>
          <p className="mt-1 max-w-2xl text-[13px] font-semibold text-[#806A58]">
            Suivez les commandes par operateur ou virement. Les reglements livreurs restent suivis dans leur file dediee.
          </p>
        </div>

        <div className="inline-flex w-fit rounded-lg border border-[#E8DED4] bg-white p-1 shadow-sm">
          <button className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1A1410] px-3 text-[12px] font-black text-white">
            <CreditCard size={15} /> Operateurs
          </button>
          <Link
            href="/zangochap-manager/admin/delivery/settlement"
            className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-[12px] font-black text-[#6B4F3B] no-underline transition hover:bg-[#FAF6F1]"
          >
            <Truck size={15} /> Livreurs
          </Link>
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(380px,1fr)]">
        <section className="rounded-lg border border-[#E8DED4] bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`h-8 rounded-md px-3 text-[11px] font-black ${!from && !to ? "bg-[#FF6B2C] text-white" : "bg-[#FAF6F1] text-[#6B4F3B]"}`}
              onClick={() => applyDateRange("", "")}
            >
              Tout
            </button>
            <button
              type="button"
              className={`h-8 rounded-md px-3 text-[11px] font-black ${from === today && to === today ? "bg-[#FF6B2C] text-white" : "bg-[#FAF6F1] text-[#6B4F3B]"}`}
              onClick={() => applyDateRange(today, today)}
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              className={`h-8 rounded-md px-3 text-[11px] font-black ${from === yesterday && to === yesterday ? "bg-[#FF6B2C] text-white" : "bg-[#FAF6F1] text-[#6B4F3B]"}`}
              onClick={() => applyDateRange(yesterday, yesterday)}
            >
              Hier
            </button>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto] md:items-center">
            <label className="flex h-10 items-center gap-2 rounded-md border border-[#E8DED4] bg-[#FCFAF7] px-3">
              <Calendar size={15} className="text-[#8B735E]" />
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[13px] font-bold text-[#1A1410] outline-none"
              />
            </label>
            <ArrowRight size={15} className="hidden text-[#8B735E] md:block" />
            <label className="flex h-10 items-center gap-2 rounded-md border border-[#E8DED4] bg-[#FCFAF7] px-3">
              <Calendar size={15} className="text-[#8B735E]" />
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[13px] font-bold text-[#1A1410] outline-none"
              />
            </label>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1A1410] px-3 text-[12px] font-black text-white"
              onClick={() => applyFilters({ from, to })}
            >
              <Filter size={14} /> Appliquer
            </button>
          </div>
        </section>

        <section className="grid gap-2 rounded-lg border border-[#E8DED4] bg-white p-3 shadow-sm sm:grid-cols-2">
          <label className="relative block">
            <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B735E]" />
            <select
              value={commercialId}
              onChange={(event) => {
                setCommercialId(event.target.value);
                applyFilters({ commercialId: event.target.value });
              }}
              className="h-10 w-full appearance-none rounded-md border border-[#E8DED4] bg-[#FCFAF7] pl-9 pr-3 text-[12px] font-black text-[#1A1410] outline-none"
            >
              <option value="">Tous commerciaux</option>
              {commercials.map((commercial) => (
                <option key={commercial.id} value={commercial.id}>{commercial.name}</option>
              ))}
            </select>
          </label>

          <label className="relative block">
            <CreditCard size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B735E]" />
            <select
              value={method}
              onChange={(event) => {
                setMethod(event.target.value);
                applyFilters({ method: event.target.value });
              }}
              className="h-10 w-full appearance-none rounded-md border border-[#E8DED4] bg-[#FCFAF7] pl-9 pr-3 text-[12px] font-black text-[#1A1410] outline-none"
            >
              <option value="">Tous operateurs</option>
              {PAYMENT_METHODS.map((paymentMethod) => (
                <option key={paymentMethod} value={paymentMethod}>{paymentMethod}</option>
              ))}
            </select>
          </label>

          <div className="flex min-h-10 items-center gap-2 text-[11px] font-bold text-[#806A58] sm:col-span-2">
            <ReceiptText size={14} />
            {hasFilters ? "Filtres appliques au detail et au recapitulatif." : "Vue globale des commandes avec mode de paiement renseigne."}
            {hasFilters && (
              <button
                type="button"
                className="ml-auto inline-flex h-8 items-center gap-1 rounded-md border border-[#E8DED4] px-2 text-[11px] font-black text-[#6B4F3B]"
                onClick={clearFilters}
              >
                <X size={13} /> Effacer
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <MetricCard icon={<Wallet size={18} />} label="Total net" value={formatPrice(totalAmount)} tone="orange" />
        <MetricCard icon={<ShoppingBag size={18} />} label="Commandes" value={String(totalTransactions)} tone="ink" />
        <MetricCard icon={<ReceiptText size={18} />} label="Panier moyen" value={formatPrice(averageBasket)} tone="blue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.35fr)]">
        <TableCard title="Recapitulatif par operateur" meta={`${initialStats.methods.length} source(s)`}>
          {initialStats.methods.length === 0 ? (
            <EmptyState icon="$" title="Aucune donnee" description="Aucun encaissement ne correspond aux filtres." />
          ) : (
            <div className="flex flex-col">
              {initialStats.methods.map((stat) => {
                const share = totalAmount > 0 ? Math.round((stat.total / totalAmount) * 100) : 0;
                return (
                  <div key={stat.method} className="border-b border-[#EFE5DB] px-4 py-3 last:border-b-0">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#FFF1E8] text-[13px] font-black text-[#D4541C]">
                          {stat.method.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-black text-[#1A1410]">{stat.method}</div>
                          <div className="text-[11px] font-bold text-[#806A58]">{stat.count} transaction(s)</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-black text-[#1A1410]">{formatPrice(stat.total)}</div>
                        <div className="text-[11px] font-black text-[#D4541C]">{share}%</div>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-sm bg-[#F2E7DC]">
                      <div className="h-full rounded-sm bg-[#FF6B2C]" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TableCard>

        <TableCard title="Detail des commandes" meta={`${initialStats.orders.length} commande(s)`}>
          {initialStats.orders.length === 0 ? (
            <EmptyState icon="#" title="Aucune commande" description="Ajustez la periode ou les operateurs." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#E8DED4] text-left text-[10px] font-black uppercase text-[#806A58]">
                    <th className="px-4 py-3">Commande</th>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Commercial</th>
                    <th className="px-3 py-3">Operateur</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {initialStats.orders.map((order) => (
                    <tr key={order.id} className="border-b border-[#F1E8DF] text-[12px] last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-mono text-[12px] font-black text-[#D4541C]">{order.ref}</div>
                        <div className="text-[10px] font-bold text-[#806A58]">{formatDay(order.createdAt)}</div>
                      </td>
                      <td className="px-3 py-3 font-bold text-[#1A1410]">{order.customerName}</td>
                      <td className="px-3 py-3 text-[#6B4F3B]">{order.commercialName || "-"}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-md bg-[#EFF6FF] px-2 py-1 text-[10px] font-black text-[#1D4ED8]">
                          {order.paymentMethod || "Inconnu"}
                        </span>
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={order.status} size="sm" /></td>
                      <td className="px-4 py-3 text-right text-[13px] font-black text-[#1A1410]">{formatPrice(orderNetTotal(order))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TableCard>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "orange" | "ink" | "blue";
}) {
  const toneClass = tone === "orange"
    ? "bg-[#FF6B2C] text-white"
    : tone === "blue"
      ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
      : "border-[#E8DED4] bg-white text-[#1A1410]";

  return (
    <div className={`flex min-h-[92px] items-center gap-3 rounded-lg border p-4 shadow-sm ${toneClass}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tone === "orange" ? "bg-white/20" : "bg-white"}`}>
        {icon}
      </div>
      <div>
        <div className={`text-[10px] font-black uppercase ${tone === "orange" ? "text-white/80" : "text-current/70"}`}>{label}</div>
        <div className="text-[20px] font-black">{value}</div>
      </div>
    </div>
  );
}

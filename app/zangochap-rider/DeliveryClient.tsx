"use client";

import React, { useState, useTransition, useMemo, useCallback } from "react";
import { Search, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

// Components
import RiderGlobalStyles from "./components/RiderGlobalStyles";
import { OrderCard } from "./components/OrderCard";
import { OrderDetailsSheet } from "./components/OrderDetailsSheet";
import { BottomNav } from "./components/BottomNav";
import { WalletView } from "./components/WalletView";
import { ProfileView } from "./components/ProfileView";

// Types & Utils
import { RiderOrder, RiderStats } from "./types";
import { calculatePartialSummary } from "./utils";

// Actions
import { updateOrderStatus, markPartialDelivery } from "@/modules/orders/actions";
import { logoutAction } from "@/modules/auth/actions";

// ── Main Component ───────────────────────────────────────────
export default function DeliveryClient({
  orders,
  user,
}: {
  orders: RiderOrder[];
  user: { id: string; name: string; email: string; role?: string };
}) {
  // ── State ──
  const [activeTab, setActiveTab] = useState<"missions" | "wallet" | "profile">("missions");
  const [missionFilter, setMissionFilter] = useState<"pending" | "history">("pending");
  const [historyFilter, setHistoryFilter] = useState<"all" | "DELIVERED" | "CANCELLED" | "PARTIALLY_DELIVERED">("all");
  const [historyTodayOnly, setHistoryTodayOnly] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RiderOrder | null>(null);
  const [partialMode, setPartialMode] = useState(false);
  const [includeDeliveryFee, setIncludeDeliveryFee] = useState(true);
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, number>>({});
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [confirmingStatus, setConfirmingStatus] = useState<{ id: string; status: string } | null>(null);

  const router = useRouter();
  const { showToast } = useToast();

  // ── Derived Data (memoized) ──
  const pending = useMemo(
    () => orders.filter((o) => !["DELIVERED", "RETURNED", "CANCELLED"].includes(o.status)),
    [orders]
  );
  const history = useMemo(
    () => orders.filter((o) => ["DELIVERED", "RETURNED", "CANCELLED"].includes(o.status)),
    [orders]
  );

  const displayedOrders = useMemo(() => {
    let base: RiderOrder[];
    if (missionFilter === "pending") {
      base = pending;
    } else {
      base = history;
      // Sub-filter by status
      if (historyFilter !== "all") {
        base = base.filter((o) => o.status === historyFilter);
      }
      // Sub-filter by today
      if (historyTodayOnly) {
        const today = new Date().toDateString();
        base = base.filter((o) => new Date(o.updatedAt || o.createdAt).toDateString() === today);
      }
    }
    if (!searchQuery) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      (o) =>
        o.customerName?.toLowerCase().includes(q) ||
        o.ref?.toLowerCase().includes(q) ||
        o.commune?.toLowerCase().includes(q)
    );
  }, [missionFilter, historyFilter, historyTodayOnly, pending, history, searchQuery]);

  const stats = useMemo<RiderStats>(
    () => ({
      cash: pending.reduce((acc, o) => acc + o.total + o.deliveryFee - (o.discount || 0), 0),
      count: pending.length,
      deliveredToday: history.filter((o) => {
        const d = new Date(o.updatedAt || o.createdAt);
        return d.toDateString() === new Date().toDateString() && o.status === "DELIVERED";
      }).length,
    }),
    [pending, history]
  );

  const partialSummary = useMemo(() => {
    if (!selectedOrder) return { subtotal: 0, total: 0, fee: 0 };
    return calculatePartialSummary(selectedOrder, deliveredQuantities, includeDeliveryFee);
  }, [selectedOrder, deliveredQuantities, includeDeliveryFee]);

  // ── Handlers (stable refs) ──
  const handleOpenOrder = useCallback((order: RiderOrder) => {
    setSelectedOrder(order);
    setPartialMode(false);
    setIncludeDeliveryFee(true);
    setReturnReasons({});
    const initialQty: Record<string, number> = {};
    order.items.forEach((i) => (initialQty[i.id] = i.qty));
    setDeliveredQuantities(initialQty);
  }, []);

  const handleUpdateItemQty = useCallback((id: string, qty: number) => {
    setDeliveredQuantities((prev) => ({ ...prev, [id]: qty }));
  }, []);

  const handleUpdateReturnReason = useCallback((id: string, reason: string) => {
    setReturnReasons((prev) => ({ ...prev, [id]: reason }));
  }, []);

  const handleStatusUpdate = useCallback((id: string, status: string) => {
    setConfirmingStatus({ id, status });
  }, []);

  const executeStatusUpdate = useCallback(
    (id: string, status: string) => {
      setConfirmingStatus(null);
      startTransition(async () => {
        try {
          await updateOrderStatus(id, status);
          showToast("Statut mis à jour ✓", "success");
          setSelectedOrder(null);
          router.refresh();
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Erreur inconnue";
          showToast(msg, "error");
        }
      });
    },
    [router, showToast]
  );

  const handlePartialConfirm = useCallback(() => {
    if (!selectedOrder) return;

    const hasItems = Object.values(deliveredQuantities).some((qty) => qty > 0);
    if (!hasItems) return showToast("Sélectionnez au moins un article", "error");

    const noteParts: string[] = [];
    selectedOrder.items.forEach((item) => {
      const dQty = deliveredQuantities[item.id] || 0;
      if (dQty < item.qty) {
        const reason = returnReasons[item.id];
        if (reason) {
          noteParts.push(`${item.name} (${item.qty - dQty}x): ${reason}`);
        }
      }
    });
    const aggregatedNote =
      noteParts.length > 0
        ? "Motifs spécifiques : " + noteParts.join(" | ")
        : undefined;

    startTransition(async () => {
      try {
        await markPartialDelivery(
          selectedOrder.id,
          deliveredQuantities,
          aggregatedNote,
          includeDeliveryFee
        );
        showToast("Livraison partielle enregistrée", "success");
        setSelectedOrder(null);
        router.refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        showToast(msg, "error");
      }
    });
  }, [selectedOrder, deliveredQuantities, returnReasons, includeDeliveryFee, router, showToast]);

  const handleLogout = useCallback(async () => {
    await logoutAction();
    router.push("/zangochap-manager");
  }, [router]);

  // ── Render ──
  return (
    <div className="h-[100dvh] overflow-hidden">
      <RiderGlobalStyles />

      <div className="max-w-md mx-auto relative h-full flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="shrink-0 px-5 pt-6 pb-4 bg-white border-b border-[#E5E5EA]">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B2C] flex items-center justify-center text-base font-bold text-white">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-base font-semibold text-[#1C1C1E] leading-none mb-1">
                  {user?.name?.split(" ")[0]}
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                  <span className="text-[10px] font-medium text-[#8E8E93]">
                    En service
                  </span>
                </div>
              </div>
            </div>

            {activeTab === "missions" && (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-[#F0F0F2] border border-[#E5E5EA] rounded-full">
                  <span className="text-xs font-bold text-[#FF6B2C] tabular-nums">
                    {new Intl.NumberFormat("fr-FR").format(stats.cash)} F
                  </span>
                </div>
                <div className="px-3 py-1.5 bg-[#F0F0F2] border border-[#E5E5EA] rounded-full">
                  <span className="text-xs font-bold text-[#34C759] tabular-nums">
                    {stats.deliveredToday}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs + Search */}
          {activeTab === "missions" && (
            <div className="space-y-3">
              <div className="flex bg-[#F0F0F2] p-1 rounded-lg border border-[#E5E5EA]">
                <button
                  onClick={() => { setMissionFilter("pending"); setHistoryFilter("all"); }}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                    missionFilter === "pending"
                      ? "bg-[#FF6B2C] text-white"
                      : "text-[#AEAEB2]"
                  }`}
                >
                  À faire ({stats.count})
                </button>
                <button
                  onClick={() => setMissionFilter("history")}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                    missionFilter === "history"
                      ? "bg-[#FF6B2C] text-white"
                      : "text-[#AEAEB2]"
                  }`}
                >
                  Historique
                </button>
              </div>

              {/* History sub-filters */}
              {missionFilter === "history" && (
                <div className="space-y-2">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {(["all", "DELIVERED", "CANCELLED", "PARTIALLY_DELIVERED"] as const).map((f) => {
                      const labels: Record<string, string> = { all: "Tous", DELIVERED: "Livrés", CANCELLED: "Annulés", PARTIALLY_DELIVERED: "Partiels" };
                      return (
                        <button
                          key={f}
                          onClick={() => setHistoryFilter(f)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                            historyFilter === f
                              ? "bg-[#1C1C1E] text-white"
                              : "bg-[#F0F0F2] text-[#8E8E93] border border-[#E5E5EA]"
                          }`}
                        >
                          {labels[f]}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setHistoryTodayOnly(!historyTodayOnly)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        historyTodayOnly
                          ? "bg-[#FF6B2C] text-white"
                          : "bg-[#F0F0F2] text-[#8E8E93] border border-[#E5E5EA]"
                      }`}
                    >
                      Aujourd'hui
                    </button>
                  </div>
                </div>
              )}

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
                />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 bg-[#F0F0F2] border border-[#E5E5EA] rounded-lg pl-10 pr-4 text-sm font-medium text-[#1C1C1E] outline-none focus:border-[#FF6B2C]/40 transition-colors placeholder:text-[#AEAEB2]"
                />
              </div>
            </div>
          )}
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-28">
          {activeTab === "missions" && (
            <div className="space-y-2">
              {displayedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-[#AEAEB2]">
                  <Package size={40} strokeWidth={1.5} className="mb-3 opacity-50" />
                  <p className="text-xs font-semibold uppercase tracking-wider">
                    Aucune mission
                  </p>
                </div>
              ) : (
                displayedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => handleOpenOrder(order)}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "wallet" && <WalletView stats={stats} />}
          {activeTab === "profile" && <ProfileView user={user} logout={handleLogout} />}
        </main>

        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={stats.count}
        />

        {selectedOrder && (
          <OrderDetailsSheet
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            partialMode={partialMode}
            setPartialMode={setPartialMode}
            includeDeliveryFee={includeDeliveryFee}
            setIncludeDeliveryFee={setIncludeDeliveryFee}
            deliveredQuantities={deliveredQuantities}
            updateItemQty={handleUpdateItemQty}
            returnReasons={returnReasons}
            updateReturnReason={handleUpdateReturnReason}
            partialSummary={partialSummary}
            onStatusUpdate={handleStatusUpdate}
            onPartialConfirm={handlePartialConfirm}
            isPending={isPending}
          />
        )}

        {/* Confirmation Modal */}
        {confirmingStatus && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmingStatus(null)}
            />
            <div className="relative bg-white w-full max-w-xs rounded-xl border border-[#E5E5EA] overflow-hidden">
              <div className="p-6 text-center">
                <h3 className="text-base font-semibold text-[#1C1C1E] mb-1">
                  Confirmer l'action ?
                </h3>
                <p className="text-xs font-medium text-[#AEAEB2]">
                  Cette action est irréversible
                </p>
              </div>
              <div className="flex border-t border-[#E5E5EA]">
                <button
                  onClick={() => setConfirmingStatus(null)}
                  className="flex-1 py-4 text-sm font-medium text-[#8E8E93] border-r border-[#E5E5EA] active:bg-[#F0F0F2] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() =>
                    executeStatusUpdate(confirmingStatus.id, confirmingStatus.status)
                  }
                  className="flex-1 py-4 text-sm font-semibold text-[#FF6B2C] active:bg-[#F0F0F2] transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
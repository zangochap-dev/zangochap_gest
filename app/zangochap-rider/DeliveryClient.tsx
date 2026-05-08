"use client";

import React, { useState, useTransition, useMemo, useCallback } from "react";
import { Search, Package, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/Toast";

// Components
import RiderGlobalStyles from "./components/RiderGlobalStyles";
import { OrderCard } from "./components/OrderCard";
import { OrderDetailsSheet } from "./components/OrderDetailsSheet";
import { HistoryGroupDetails } from "./components/HistoryGroupDetails";
import { HistoryGroupCard } from "./components/HistoryGroupCard";
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
  const [localOrders, setLocalOrders] = useState<RiderOrder[]>(orders);
  
  // Sync local state when props change
  React.useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const [missionFilter, setMissionFilter] = useState<"pending" | "current" | "history">("pending");
  const [historyFilter, setHistoryFilter] = useState<"all" | "DELIVERED" | "CANCELLED" | "PARTIALLY_DELIVERED">("all");
  const [historyTodayOnly, setHistoryTodayOnly] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RiderOrder | null>(null);
  const [selectedHistoryGroup, setSelectedHistoryGroup] = useState<{ date: string; orders: RiderOrder[] } | null>(null);
  const [partialMode, setPartialMode] = useState(false);
  const [includeDeliveryFee, setIncludeDeliveryFee] = useState(true);
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, number>>({});
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [confirmingStatus, setConfirmingStatus] = useState<{ id: string; status: string } | null>(null);
  const [returnReason, setReturnReason] = useState("");

  const router = useRouter();
  const { showToast } = useToast();

  // ── Derived Data (memoized) ──
  const todayStr = new Date().toDateString();

  const pending = useMemo(
    () => localOrders.filter((o) => {
      const isCompleted = ["DELIVERED", "RETURNED", "CANCELLED"].includes(o.status);
      return !isCompleted;
    }),
    [localOrders]
  );

  const inProgress = useMemo(
    () => localOrders.filter((o) => o.status === "ON_DELIVERY"),
    [localOrders]
  );

  const history = useMemo(
    () => localOrders.filter((o) => {
      const isCompleted = ["DELIVERED", "RETURNED", "CANCELLED"].includes(o.status);
      return isCompleted;
    }),
    [localOrders]
  );

  const displayedOrders = useMemo(() => {
    let base: RiderOrder[];
    if (missionFilter === "pending") {
      base = pending;
    } else if (missionFilter === "current") {
      base = inProgress;
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
  }, [missionFilter, historyFilter, historyTodayOnly, pending, inProgress, history, searchQuery]);

  // Cash Management: Orders delivered but not yet settled
  const ordersToSettle = useMemo(
    () => localOrders.filter(o => ["DELIVERED", "PARTIALLY_DELIVERED"].includes(o.status) && !o.settlementId),
    [localOrders]
  );

  const stats = useMemo<RiderStats>(
    () => ({
      cash: ordersToSettle.reduce((acc, o) => acc + o.total, 0),
      count: pending.length,
      inProgressCount: inProgress.length,
      deliveredToday: history.filter((o) => {
        const d = new Date(o.updatedAt || o.createdAt);
        return d.toDateString() === new Date().toDateString() && o.status === "DELIVERED";
      }).length,
    }),
    [pending, inProgress, history, ordersToSettle]
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
    setReturnReason("");
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
    setReturnReason("");
  }, []);

  const executeStatusUpdate = useCallback(
    (id: string, status: string, reason?: string) => {
      setConfirmingStatus(null);
      
      // Optimistic Update
      setLocalOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any, updatedAt: new Date().toISOString() } : o));
      
      startTransition(async () => {
        try {
          await updateOrderStatus(id, status, reason);
          showToast("Statut mis à jour ✓", "success");
          setSelectedOrder(null);
          router.refresh();
        } catch (e: unknown) {
          // Rollback
          setLocalOrders(orders);
          const msg = e instanceof Error ? e.message : "Erreur inconnue";
          showToast(msg, "error");
        }
      });
    },
    [router, showToast, orders]
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

    // Optimistic Update for partial
    setLocalOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'PARTIALLY_DELIVERED', updatedAt: new Date().toISOString() } : o));

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
        // Rollback
        setLocalOrders(orders);
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        showToast(msg, "error");
      }
    });
  }, [selectedOrder, deliveredQuantities, returnReasons, includeDeliveryFee, router, showToast, orders]);

  const handleLogout = useCallback(async () => {
    await logoutAction();
    router.push("/zangochap-manager");
  }, [router]);

  // ── Render Helpers ──
  const groupedOrders = useMemo(() => {
    return Object.entries(
      displayedOrders.reduce((groups, order) => {
        const date = new Date(order.updatedAt || order.createdAt).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(order);
        return groups;
      }, {} as Record<string, RiderOrder[]>)
    ).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [displayedOrders]);

  const RETURN_REASONS = [
    "Client absent",
    "Mauvaise adresse",
    "Refusé par le client",
    "Article défectueux",
    "Produit non conforme",
    "Pas de budget/monnaie",
  ];

  return (
    <div className="h-[100dvh] overflow-hidden">
      <RiderGlobalStyles />

      <div className="max-w-md mx-auto relative h-full flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="shrink-0 px-4 pt-5 pb-3.5 bg-white border-b border-[#E5E5EA]">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-[#FF6B2C] flex items-center justify-center text-sm font-bold text-white">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-[#1C1C1E] leading-none mb-1">
                  {user?.name?.split(" ")[0]}
                </h1>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-[#34C759]" />
                  <span className="text-[9px] font-medium text-[#8E8E93]">
                    En service
                  </span>
                </div>
              </div>
            </div>

            {activeTab === "missions" && (
              <div className="flex items-center gap-1.5">
                <div className="px-2.5 py-1 bg-[#F0F0F2] border border-[#E5E5EA] rounded-md">
                  <span className="text-[11px] font-bold text-[#FF6B2C] tabular-nums">
                    {new Intl.NumberFormat("fr-FR").format(stats.cash)} F
                  </span>
                </div>
                <div className="px-2.5 py-1 bg-[#F0F0F2] border border-[#E5E5EA] rounded-md">
                  <span className="text-[11px] font-bold text-[#34C759] tabular-nums">
                    {stats.deliveredToday}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs + Search */}
          {activeTab === "missions" && (
            <div className="space-y-2.5">
              <div className="flex bg-[#F0F0F2] p-1 rounded-lg border border-[#E5E5EA]">
                <button
                  onClick={() => { setMissionFilter("pending"); setHistoryFilter("all"); }}
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    missionFilter === "pending"
                      ? "bg-[#FF6B2C] text-white"
                      : "text-[#AEAEB2]"
                  }`}
                >
                  À faire ({stats.count})
                </button>
                <button
                  onClick={() => setMissionFilter("current")}
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    missionFilter === "current"
                      ? "bg-[#FF6B2C] text-white"
                      : "text-[#AEAEB2]"
                  }`}
                >
                  En cours ({stats.inProgressCount})
                </button>
                <button
                  onClick={() => setMissionFilter("history")}
                  className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
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
                <div className="space-y-1.5">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {(["all", "DELIVERED", "CANCELLED", "PARTIALLY_DELIVERED"] as const).map((f) => {
                      const labels: Record<string, string> = { all: "Tous", DELIVERED: "Livrés", CANCELLED: "Annulés", PARTIALLY_DELIVERED: "Partiels" };
                      return (
                        <button
                          key={f}
                          onClick={() => setHistoryFilter(f)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors ${
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
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-colors ${
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
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]"
                />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-[#F0F0F2] border border-[#E5E5EA] rounded-lg pl-9 pr-3 text-xs font-medium text-[#1C1C1E] outline-none focus:border-[#FF6B2C]/40 transition-colors placeholder:text-[#AEAEB2]"
                />
              </div>
            </div>
          )}
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto overscroll-contain px-3.5 pt-2.5 pb-24">
          {activeTab === "missions" && (
            <div className="space-y-6">
              {displayedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#AEAEB2]">
                  <Package size={32} strokeWidth={1.5} className="mb-2 opacity-50" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider">
                    Aucune mission
                  </p>
                </div>
              ) : missionFilter === "pending" ? (
                groupedOrders.map(([date, dateOrders]) => {
                  const isToday = date === new Date().toDateString();
                  const isYesterday = date === new Date(Date.now() - 86400000).toDateString();
                  const label = isToday ? "Aujourd'hui" : isYesterday ? "Hier" : new Date(date).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });

                  return (
                    <div key={date} className="space-y-4">
                      <div className="flex items-center gap-3 px-1">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1C1C1E] whitespace-nowrap">
                          {label}
                        </span>
                        <div className="h-[2px] flex-1 bg-[#E5E5EA] rounded-full" />
                      </div>
                      <div className="space-y-2.5">
                        {dateOrders.map((order, idx) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            index={idx}
                            onClick={() => handleOpenOrder(order)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : missionFilter === "current" ? (
                <div className="space-y-2.5 pt-1">
                  {displayedOrders.map((order, idx) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      index={idx}
                      onClick={() => handleOpenOrder(order)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {groupedOrders.map(([date, dateOrders]) => (
                    <HistoryGroupCard
                      key={date}
                      date={date}
                      orders={dateOrders}
                      onClick={() => setSelectedHistoryGroup({ date, orders: dateOrders })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "wallet" && <WalletView stats={stats} ordersToSettle={ordersToSettle} />}
          {activeTab === "profile" && <ProfileView user={user} logout={handleLogout} />}
        </main>

        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={stats.count + stats.inProgressCount}
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

        <AnimatePresence>
          {selectedHistoryGroup && (
            <HistoryGroupDetails 
              date={selectedHistoryGroup.date}
              orders={selectedHistoryGroup.orders}
              onClose={() => setSelectedHistoryGroup(null)}
              onOpenOrder={(order) => {
                setSelectedHistoryGroup(null);
                handleOpenOrder(order);
              }}
            />
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmingStatus && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setConfirmingStatus(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white w-full max-w-sm rounded-xl shadow-xl border border-[#F2F2F7] overflow-hidden"
              >
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-[#F2F2F7] rounded-full flex items-center justify-center mx-auto mb-3 text-[#FF6B2C]">
                    <Package size={24} />
                  </div>
                  <h3 className="text-[17px] font-black text-[#1C1C1E] mb-1.5 leading-tight">
                    {confirmingStatus.status === "DELIVERED" ? "Confirmer la livraison ?" : "Confirmer le retour ?"}
                  </h3>
                  <p className="text-[13px] font-semibold text-[#AEAEB2] leading-relaxed mb-4">
                    {confirmingStatus.status === "DELIVERED" 
                      ? "Assurez-vous d'avoir bien encaissé le montant total."
                      : "Veuillez préciser le motif du retour ci-dessous."}
                  </p>

                  {confirmingStatus.status !== "DELIVERED" && (
                    <div className="flex flex-wrap gap-1.5 justify-center mb-5">
                      {RETURN_REASONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setReturnReason(r)}
                          className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all border ${
                            returnReason === r
                              ? "bg-[#1C1C1E] text-white border-[#1C1C1E]"
                              : "bg-white text-[#8E8E93] border-[#E5E5EA]"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmingStatus(null)}
                      className="flex-1 h-12 rounded-lg bg-[#F2F2F7] text-[#1C1C1E] font-bold text-[14px] active:scale-95 transition-transform"
                    >
                      Annuler
                    </button>
                    <button
                      disabled={confirmingStatus.status !== "DELIVERED" && !returnReason}
                      onClick={() => executeStatusUpdate(confirmingStatus.id, confirmingStatus.status, returnReason)}
                      className="flex-1 h-12 rounded-lg bg-[#FF6B2C] text-white font-bold text-[14px] active:scale-95 transition-transform disabled:opacity-40"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
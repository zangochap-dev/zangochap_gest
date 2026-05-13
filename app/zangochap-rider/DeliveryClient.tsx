"use client";

import React, { useState, useTransition, useMemo, useCallback, useEffect, useRef } from "react";
import { Search, Package, ChevronRight, WifiOff, Bell } from "lucide-react";
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
  const [isOffline, setIsOffline] = useState(false);
  const prevOrderCount = useRef(orders.length);
  
  const router = useRouter();
  const { showToast } = useToast();

  // ── PWA / Offline / Notifications ──
  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); showToast("Connexion rétablie ! Synchronisation...", "success"); };
    const handleOffline = () => { setIsOffline(true); showToast("Mode hors-ligne activé. 📡", "error"); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  useEffect(() => {
    if (orders.length > prevOrderCount.current && !isOffline) {
      showToast("Nouvelle mission assignée ! 🚛", "success");
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("ZangoChap Rider", { body: "Vous avez une nouvelle livraison à effectuer.", icon: "/logo.png" });
      }
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5; audio.play().catch(() => {});
    }
    prevOrderCount.current = orders.length;
    setLocalOrders(orders);
  }, [orders, showToast, isOffline]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") { Notification.requestPermission(); }
    if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js").catch(() => {}); }
    const interval = setInterval(() => router.refresh(), 45000);
    return () => clearInterval(interval);
  }, [router]);

  const [missionFilter, setMissionFilter] = useState<"pending" | "current" | "history">("pending");
  const [historyFilter, setHistoryFilter] = useState<"all" | "DELIVERED" | "CANCELLED" | "PARTIALLY_DELIVERED">("all");
  const [historyTodayOnly, setHistoryTodayOnly] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RiderOrder | null>(null);
  const [partialMode, setPartialMode] = useState(false);
  const [includeDeliveryFee, setIncludeDeliveryFee] = useState(true);
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, number>>({});
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // ── Derived Data ──
  const pending = useMemo(() => localOrders.filter((o) => !["DELIVERED", "RETURNED", "CANCELLED"].includes(o.status)), [localOrders]);
  const inProgress = useMemo(() => localOrders.filter((o) => o.status === "ON_DELIVERY"), [localOrders]);
  const history = useMemo(() => localOrders.filter((o) => ["DELIVERED", "RETURNED", "CANCELLED"].includes(o.status)), [localOrders]);

  const displayedOrders = useMemo(() => {
    let base: RiderOrder[];
    if (missionFilter === "pending") base = pending;
    else if (missionFilter === "current") base = inProgress;
    else {
      base = history;
      if (historyFilter !== "all") base = base.filter((o) => o.status === historyFilter);
      if (historyTodayOnly) {
        const today = new Date().toDateString();
        base = base.filter((o) => new Date(o.updatedAt || o.createdAt).toDateString() === today);
      }
    }
    if (!searchQuery) return base;
    const q = searchQuery.toLowerCase();
    return base.filter((o) => o.customerName?.toLowerCase().includes(q) || o.ref?.toLowerCase().includes(q) || o.commune?.toLowerCase().includes(q));
  }, [missionFilter, historyFilter, historyTodayOnly, pending, inProgress, history, searchQuery]);

  const ordersToSettle = useMemo(() => localOrders.filter(o => ["DELIVERED", "PARTIALLY_DELIVERED"].includes(o.status) && !o.settlementId), [localOrders]);
  const stats = useMemo<RiderStats>(() => ({
    cash: ordersToSettle.reduce((acc, o) => acc + o.total, 0),
    count: pending.length,
    inProgressCount: inProgress.length,
    deliveredToday: history.filter((o) => new Date(o.updatedAt || o.createdAt).toDateString() === new Date().toDateString() && o.status === "DELIVERED").length,
  }), [pending, inProgress, history, ordersToSettle]);

  const partialSummary = useMemo(() => {
    if (!selectedOrder) return { subtotal: 0, total: 0, fee: 0 };
    return calculatePartialSummary(selectedOrder, deliveredQuantities, includeDeliveryFee);
  }, [selectedOrder, deliveredQuantities, includeDeliveryFee]);

  // Handlers
  const handleOpenOrder = useCallback((order: RiderOrder) => {
    setSelectedOrder(order); setPartialMode(false); setIncludeDeliveryFee(true); setReturnReasons({});
    const initialQty: Record<string, number> = {}; order.items.forEach((i) => (initialQty[i.id] = i.qty)); setDeliveredQuantities(initialQty);
  }, []);

  const handleUpdateItemQty = useCallback((id: string, qty: number) => { setDeliveredQuantities((prev) => ({ ...prev, [id]: qty })); }, []);
  const handleUpdateReturnReason = useCallback((id: string, reason: string) => { setReturnReasons((prev) => ({ ...prev, [id]: reason })); }, []);

  const executeStatusUpdate = useCallback((id: string, status: string, reason?: string) => {
    setLocalOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any, updatedAt: new Date().toISOString() } : o));
    startTransition(async () => {
      try {
        await updateOrderStatus(id, status, reason);
        showToast("Statut mis à jour ✓", "success");
        setSelectedOrder(null);
        router.refresh();
      } catch (e: any) {
        setLocalOrders(orders); showToast(e.message || "Erreur", "error");
      }
    });
  }, [router, showToast, orders]);

  const handlePartialConfirm = useCallback(() => {
    if (!selectedOrder) return;
    const hasItems = Object.values(deliveredQuantities).some((qty) => qty > 0);
    if (!hasItems) return showToast("Sélectionnez au moins un article", "error");

    const noteParts: string[] = [];
    selectedOrder.items.forEach((item) => {
      const dQty = deliveredQuantities[item.id] || 0;
      if (dQty < item.qty) {
        const reason = returnReasons[item.id];
        if (reason) noteParts.push(`${item.name} (${item.qty - dQty}x): ${reason}`);
      }
    });
    const aggregatedNote = noteParts.length > 0 ? "Motifs spécifiques : " + noteParts.join(" | ") : undefined;

    setLocalOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'PARTIALLY_DELIVERED', updatedAt: new Date().toISOString() } : o));
    startTransition(async () => {
      try {
        await markPartialDelivery(selectedOrder.id, deliveredQuantities, aggregatedNote, includeDeliveryFee);
        showToast("Livraison partielle enregistrée", "success");
        setSelectedOrder(null); router.refresh();
      } catch (e: any) {
        setLocalOrders(orders); showToast(e.message || "Erreur", "error");
      }
    });
  }, [selectedOrder, deliveredQuantities, returnReasons, includeDeliveryFee, router, showToast, orders]);

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col">
      <RiderGlobalStyles />
      <div className="max-w-md mx-auto relative h-full flex flex-col w-full overflow-hidden bg-[#F5F5F7]">
        {isOffline && (
          <div className="bg-[#FF3B30] text-white text-[10px] font-bold py-1 px-4 flex items-center justify-center gap-2 uppercase tracking-wider shrink-0">
            <WifiOff size={12} /> Mode hors-ligne
          </div>
        )}

        <header className="shrink-0 px-4 pt-5 pb-3.5 bg-white border-b border-[#E5E5EA]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#FF6B2C] flex items-center justify-center text-sm font-bold text-white">{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <h1 className="text-[15px] font-bold text-[#1C1C1E] leading-none mb-1">{user?.name?.split(" ")[0]}</h1>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-[#FF3B30]' : 'bg-[#34C759]'}`} />
                  <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-tight">{isOffline ? 'Déconnecté' : 'En service'}</span>
                </div>
              </div>
            </div>
            {activeTab === "missions" && (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-[#F2F2F7] rounded-full flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#FF6B2C]">{new Intl.NumberFormat("fr-FR").format(stats.cash)} F</span>
                </div>
              </div>
            )}
          </div>
          {activeTab === "missions" && (
            <div className="space-y-3">
              <div className="flex gap-1.5">
                {[{ id: "pending", label: "À faire", count: stats.count }, { id: "current", label: "En cours", count: stats.inProgressCount }, { id: "history", label: "Terminées" }].map((t) => (
                  <button key={t.id} onClick={() => setMissionFilter(t.id as any)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${missionFilter === t.id ? 'bg-[#1C1C1E] text-white' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}>
                    {t.label} {t.count !== undefined && <span className="ml-1 opacity-60">({t.count})</span>}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
                <input type="text" placeholder="Rechercher une mission..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 bg-[#F2F2F7] border-none rounded-xl pl-9 pr-4 text-[13px] outline-none" />
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <AnimatePresence mode="wait">
            {activeTab === "missions" && (
              <motion.div key="missions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {displayedOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30"><Package size={48} className="mb-2" /><p className="text-sm font-bold">Aucune mission</p></div>
                ) : (
                  <div className="space-y-3">{displayedOrders.map((o) => <OrderCard key={o.id} order={o} onClick={() => handleOpenOrder(o)} />)}</div>
                )}
              </motion.div>
            )}
            {activeTab === "wallet" && <WalletView key="wallet" stats={stats} ordersToSettle={ordersToSettle} />}
            {activeTab === "profile" && <ProfileView key="profile" user={user} logout={() => logoutAction()} />}
          </AnimatePresence>
        </main>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} pendingCount={stats.count} />

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
            onStatusUpdate={executeStatusUpdate}
            onPartialConfirm={handlePartialConfirm}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  );
}
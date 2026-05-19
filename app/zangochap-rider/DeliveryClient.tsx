"use client";

import React, { useState, useTransition, useMemo, useCallback, useEffect, useRef } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Package, Route, Search, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { calculateOrderCollectionTotal, calculatePartialSummary } from "./utils";

// Actions
import { updateOrderStatus, markPartialDelivery } from "@/modules/orders/actions";
import { logoutAction } from "@/modules/auth/actions";

type MissionFilter = "pending" | "current" | "history";
type StatusReasonRequest = {
  orderId: string;
  status: string;
  title: string;
  helper: string;
  reasons: string[];
} | null;

const FAILURE_REASONS = [
  "Client absent",
  "Client injoignable",
  "Adresse introuvable",
  "Client a refusé la commande",
  "Pas de budget / monnaie",
  "Article non conforme",
];

const REPROGRAM_REASONS = [
  "Client demande demain",
  "Client indisponible aujourd'hui",
  "Adresse à confirmer",
  "Pluie / accès difficile",
  "Fin de tournée",
];

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
      audio.volume = 0.5; audio.play().catch(() => { });
    }
    prevOrderCount.current = orders.length;
    setLocalOrders(orders);
  }, [orders, showToast, isOffline]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const [missionFilter, setMissionFilter] = useState<MissionFilter>("pending");
  const [historyFilter] = useState<"all" | "DELIVERED" | "CANCELLED" | "PARTIALLY_DELIVERED" | "REPRO_DISPO">("all");
  const [historyTodayOnly] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RiderOrder | null>(null);
  const [partialMode, setPartialMode] = useState(false);
  const [includeDeliveryFee, setIncludeDeliveryFee] = useState(true);
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, number>>({});
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusReasonRequest, setStatusReasonRequest] = useState<StatusReasonRequest>(null);
  const [isPending, startTransition] = useTransition();

  // ── Derived Data ──
  const completedStatuses = useMemo(() => ["DELIVERED", "PARTIALLY_DELIVERED", "RETURNED", "CANCELLED", "REPRO_DISPO"], []);
  const pending = useMemo(() => localOrders.filter((o) => !completedStatuses.includes(o.status)), [localOrders, completedStatuses]);
  const inProgress = useMemo(() => localOrders.filter((o) => o.status === "ON_DELIVERY"), [localOrders]);
  const history = useMemo(() => localOrders.filter((o) => completedStatuses.includes(o.status)), [localOrders, completedStatuses]);

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
    cash: ordersToSettle.reduce((acc, o) => acc + calculateOrderCollectionTotal(o), 0),
    count: pending.length,
    inProgressCount: inProgress.length,
    deliveredToday: history.filter((o) => new Date(o.updatedAt || o.createdAt).toDateString() === new Date().toDateString() && o.status === "DELIVERED").length,
  }), [pending, inProgress, history, ordersToSettle]);
  const routeStats = useMemo(() => ({
    total: localOrders.length,
    completed: localOrders.filter((o) => ["DELIVERED", "PARTIALLY_DELIVERED"].includes(o.status)).length,
    issues: localOrders.filter((o) => ["RETURNED", "CANCELLED", "REPRO_DISPO"].includes(o.status)).length,
  }), [localOrders]);
  const routeProgress = routeStats.total > 0 ? Math.round((routeStats.completed / routeStats.total) * 100) : 0;
  const nextMission = useMemo(() => pending[0] || inProgress[0] || null, [pending, inProgress]);

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
    const normalizedStatus = status.toUpperCase();
    if (["RETURNED", "CANCELLED", "REPRO_DISPO"].includes(normalizedStatus) && !reason?.trim()) {
      setStatusReasonRequest({
        orderId: id,
        status,
        title: normalizedStatus === "REPRO_DISPO" ? "Motif de reprogrammation" : "Motif d'échec",
        helper: normalizedStatus === "REPRO_DISPO"
          ? "Indiquez pourquoi cette mission doit revenir dans la tournée de demain."
          : "Indiquez pourquoi la livraison n'a pas abouti. Ce motif sera visible au bureau.",
        reasons: normalizedStatus === "REPRO_DISPO" ? REPROGRAM_REASONS : FAILURE_REASONS,
      });
      return;
    }

    setLocalOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as RiderOrder["status"], returnReason: reason || o.returnReason, updatedAt: new Date().toISOString() } : o));
    startTransition(async () => {
      try {
        await updateOrderStatus(id, status, reason);
        showToast("Statut mis à jour ✓", "success");
        setStatusReasonRequest(null);
        setSelectedOrder(null);
        router.refresh();
      } catch (e: unknown) {
        setLocalOrders(orders); showToast(e instanceof Error ? e.message : "Erreur", "error");
      }
    });
  }, [router, showToast, orders]);

  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const handlePartialConfirm = useCallback(() => {
    if (!selectedOrder) return;
    const hasItems = Object.values(deliveredQuantities).some((qty) => qty > 0);
    if (!hasItems) return showToast("Sélectionnez au moins un article", "error");

    const missingReason = selectedOrder.items.some((item) => {
      const dQty = deliveredQuantities[item.id] || 0;
      return dQty < item.qty && !returnReasons[item.id];
    });
    if (missingReason) return showToast("Ajoutez un motif pour chaque article non livré", "error");

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
      } catch (e: unknown) {
        setLocalOrders(orders); showToast(e instanceof Error ? e.message : "Erreur", "error");
      }
    });
  }, [selectedOrder, deliveredQuantities, returnReasons, includeDeliveryFee, router, showToast, orders]);

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col">
      <RiderGlobalStyles />
      <div className="max-w-md mx-auto relative h-full flex flex-col w-full overflow-hidden bg-[#F3F4F6]">
        {isOffline && (
          <div className="bg-[#B91C1C] text-white text-[10px] font-bold py-1 px-4 flex items-center justify-center gap-2 uppercase tracking-wider shrink-0">
            <WifiOff size={12} /> Mode hors-ligne
          </div>
        )}

        <header className="shrink-0 px-4 pt-5 pb-3.5 bg-[#0F172A] text-white border-b border-black/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-md bg-[#1E293B] border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-sm">{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <h1 className="text-[16px] font-black leading-none mb-1">{user?.name?.split(" ")[0]}</h1>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-[#B91C1C]' : 'bg-[#166534]'}`} />
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight">{isOffline ? 'Déconnecté' : 'En tournée'}</span>
                </div>
              </div>
            </div>
            {activeTab === "missions" && (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-white/10 rounded-md flex items-center gap-1.5 border border-white/10">
                  <span className="text-[11px] font-black text-white">{new Intl.NumberFormat("fr-FR").format(stats.cash)} F</span>
                </div>
              </div>
            )}
          </div>
          {activeTab === "missions" && (
            <div className="space-y-3">
              <div className="rounded-md bg-white text-[#111827] p-3.5 shadow-sm border border-[#E5E7EB]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#475569]">
                      <CalendarDays size={12} />
                      {todayLabel}
                    </div>
                    <p className="text-[16px] font-black mt-1">Tournée du jour</p>
                    {nextMission && (
                      <p className="mt-1 text-[11px] font-semibold text-[#64748B] truncate">
                        Prochaine mission: #{nextMission.ref} · {nextMission.commune || "zone non définie"}
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-md bg-[#0F172A] text-white flex items-center justify-center">
                    <Route size={18} />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#64748B] mb-1.5">
                    <span>Progression</span>
                    <span>{routeProgress}%</span>
                  </div>
                  <div className="h-2 bg-[#E5E7EB] rounded-sm overflow-hidden">
                    <div className="h-full bg-[#334155]" style={{ width: `${routeProgress}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <RouteStat label="Assignées" value={routeStats.total} tone="dark" />
                  <RouteStat label="Réussies" value={routeStats.completed} tone="green" />
                  <RouteStat label="À suivre" value={routeStats.issues} tone="orange" />
                </div>
              </div>
              <div className="flex gap-1.5">
                {[{ id: "pending", label: "À traiter", count: stats.count }, { id: "current", label: "En route", count: stats.inProgressCount }, { id: "history", label: "Clôturées" }].map((t) => (
                  <button key={t.id} onClick={() => setMissionFilter(t.id as MissionFilter)} className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${missionFilter === t.id ? 'bg-[#111827] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                    {t.label} {t.count !== undefined && <span className="ml-1 opacity-60">({t.count})</span>}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input type="text" placeholder="Rechercher une mission..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 bg-[#F3F4F6] border-none rounded-md pl-9 pr-4 text-[13px] outline-none" />
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <AnimatePresence mode="wait">
            {activeTab === "missions" && (
              <motion.div key="missions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {displayedOrders.length === 0 ? (
                  <div className="rounded-md border border-[#E5E7EB] bg-white px-5 py-10 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-[#F3F4F6] text-[#475569]">
                      <Package size={22} />
                    </div>
                    <p className="text-sm font-black text-[#111827]">Aucune mission dans cette section</p>
                    <p className="mx-auto mt-1 max-w-[260px] text-[12px] font-semibold leading-relaxed text-[#6B7280]">
                      Les livraisons assignées pour aujourd&apos;hui apparaissent ici.
                    </p>
                  </div>
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
        <StatusReasonModal
          request={statusReasonRequest}
          onClose={() => setStatusReasonRequest(null)}
          onConfirm={(reason) => {
            if (!statusReasonRequest) return;
            executeStatusUpdate(statusReasonRequest.orderId, statusReasonRequest.status, reason);
          }}
          isPending={isPending}
        />
      </div>
    </div>
  );
}

function RouteStat({ label, value, tone }: { label: string; value: number; tone: "dark" | "green" | "orange" }) {
  const toneClass = tone === "green" ? "text-[#16A34A]" : tone === "orange" ? "text-[#334155]" : "text-[#111827]";
  const Icon = tone === "green" ? CheckCircle2 : tone === "orange" ? AlertTriangle : Package;
  return (
    <div className="rounded-md bg-[#F3F4F6] px-3 py-2">
      <div className={`flex items-center gap-1 ${toneClass}`}>
        <Icon size={12} />
        <span className="text-[15px] font-black tabular-nums">{value}</span>
      </div>
      <p className="text-[9px] font-black uppercase tracking-wider text-[#6B7280] mt-0.5">{label}</p>
    </div>
  );
}

function StatusReasonModal({
  request,
  onClose,
  onConfirm,
  isPending,
}: {
  request: StatusReasonRequest;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [selected, setSelected] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    setSelected("");
    setDetails("");
  }, [request?.orderId, request?.status]);

  if (!request) return null;

  const reason = [selected, details.trim()].filter(Boolean).join(" - ");

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center">
      <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="Fermer" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative z-10 w-full max-w-md bg-white rounded-t-md p-5 shadow-md"
      >
        <div className="w-10 h-1 rounded-sm bg-[#E5E7EB] mx-auto mb-4" />
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-md bg-[#334155]/10 text-[#334155] flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-[18px] font-black text-[#111827]">{request.title}</h3>
            <p className="text-[12px] font-semibold text-[#6B7280] leading-relaxed mt-1">{request.helper}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {request.reasons.map((reasonOption) => (
            <button
              key={reasonOption}
              onClick={() => setSelected(reasonOption)}
              className={`min-h-10 px-3 py-2 rounded-md text-[11px] font-black text-left border transition-all ${
                selected === reasonOption ? "bg-[#111827] text-white border-[#111827]" : "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]"
              }`}
            >
              {reasonOption}
            </button>
          ))}
        </div>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Détail utile pour le bureau..."
          className="w-full min-h-20 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-3 text-[13px] font-semibold outline-none resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 h-12 rounded-md bg-[#F3F4F6] text-[#374151] text-[13px] font-black">
            Annuler
          </button>
          <button
            disabled={isPending || !reason}
            onClick={() => onConfirm(reason)}
            className="flex-[1.4] h-12 rounded-md bg-[#334155] text-white text-[13px] font-black disabled:opacity-40"
          >
            Valider le motif
          </button>
        </div>
      </motion.div>
    </div>
  );
}

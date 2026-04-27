"use client";

import React, { useState, useTransition, useMemo, useCallback } from "react";
import { 
  Phone, MessageCircle, Check, MapPin, Clock, Search, Navigation,
  X, ArrowRight, Package, AlertCircle, User, FileText, Tag, 
  ChevronRight, TrendingUp, Banknote, CheckCircle2, AlertTriangle, 
  RotateCcw, History, LayoutDashboard
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/constants";
import { updateOrderStatus } from "@/modules/orders/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT_COLOR = "#F97316"; // Orange Zangochap
const SLATE = {
  50: "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; pulse?: boolean }> = {
  DELIVERED: { label: "Livré", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", dot: "#22C55E" },
  RETURNED: { label: "Retour", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444" },
  CANCELLED: { label: "Annulé", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444" },
  PENDING: { label: "En cours", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B", pulse: true },
  IN_TRANSIT: { label: "En route", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", pulse: true },
};

const PREDEFINED_MESSAGES = [
  "Bonjour, c'est votre livreur Zangochap. Je suis en route avec votre commande.",
  "Je suis arrivé à votre adresse de livraison.",
  "Je n'arrive pas à vous joindre par appel, merci de me recontacter.",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatusBadge = React.memo(({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 20,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.02em", color: cfg.color,
      textTransform: "uppercase"
    }}>
      <motion.span 
        animate={cfg.pulse ? { opacity: [1, 0.4, 1], scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} 
      />
      {cfg.label}
    </div>
  );
});
StatusBadge.displayName = "StatusBadge";

const SectionHeader = React.memo(({ icon, title, accent }: { icon: React.ReactNode; title: string; accent?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: 8,
      background: accent ? "rgba(249,115,22,0.1)" : SLATE[100],
      color: accent ? ACCENT_COLOR : SLATE[500],
    }}>{icon}</div>
    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", color: SLATE[400], textTransform: "uppercase" }}>
      {title}
    </span>
  </div>
));
SectionHeader.displayName = "SectionHeader";

const InfoCard = React.memo(({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: "#FFFFFF", borderRadius: 14, border: `1px solid ${SLATE[100]}`,
    overflow: "hidden", marginBottom: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
  }}>
    {children}
  </div>
));
InfoCard.displayName = "InfoCard";

const InfoRow = React.memo(({ label, value, last, icon }: { label: string; value: React.ReactNode; last?: boolean; icon?: React.ReactNode }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px",
    borderBottom: last ? "none" : `1px solid ${SLATE[50]}`,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {icon && <span style={{ color: SLATE[300] }}>{icon}</span>}
      <span style={{ fontSize: 13, color: SLATE[500], fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: 14, color: SLATE[900], fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>
      {value}
    </div>
  </div>
));
InfoRow.displayName = "InfoRow";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeliveryClient({ orders, user }: { orders: any[]; user: any }) {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  // Memoized Data
  const pendingOrders = useMemo(() => 
    orders.filter(o => !["DELIVERED", "RETURNED", "CANCELLED"].includes(o.status)), [orders]);
  
  const historyOrders = useMemo(() => 
    orders.filter(o => ["DELIVERED", "RETURNED", "CANCELLED"].includes(o.status)), [orders]);

  const currentList = useMemo(() => 
    (activeTab === "pending" ? pendingOrders : historyOrders).filter(o =>
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.ref.toLowerCase().includes(search.toLowerCase()) ||
      o.commune?.toLowerCase().includes(search.toLowerCase())
    ), [activeTab, pendingOrders, historyOrders, search]);

  const stats = useMemo(() => ({
    totalToCollect: pendingOrders.reduce((sum, o) => sum + (o.total + o.deliveryFee - (o.discount || 0)), 0),
    count: pendingOrders.length,
    deliveredToday: historyOrders.filter(o => {
      const d = new Date(o.createdAt);
      const today = new Date();
      return d.getDate() === today.getDate() && o.status === "DELIVERED";
    }).length,
  }), [pendingOrders, historyOrders]);

  // Callbacks
  const handleStatusChange = useCallback((orderId: string, status: string) => {
    const label = status === "DELIVERED" ? "Livraison confirmée" : "Retour enregistré";
    if (!confirm(`Souhaitez-vous marquer cette commande comme ${status === "DELIVERED" ? "LIVRÉE" : "RETOURNÉE"} ?`)) return;
    
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status);
        showToast(label, "success");
        setSelectedOrder(null);
        router.refresh();
      } catch (e: any) {
        showToast(e.message || "Erreur lors de la mise à jour", "error");
      }
    });
  }, [router, showToast]);

  const handleWhatsApp = useCallback((order: any, message: string) => {
    let phone = order.customerPhone.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "225" + phone.substring(1);
    else if (!phone.startsWith("225")) phone = "225" + phone;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  }, []);

  const initials = useMemo(() => 
    user?.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() ?? "L", 
  [user]);

  return (
    <div style={{
      minHeight: "100vh",
      background: SLATE[50],
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
      color: SLATE[900],
      paddingBottom: 40,
    }}>
      {/* ── STICKY HEADER ── */}
      <header style={{
        background: "#FFFFFF",
        borderBottom: `1px solid ${SLATE[100]}`,
        padding: "20px 20px 0",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: SLATE[400], letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Zangochap Rider
              </span>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>
              Salut, {user?.name?.split(" ")[0]}
            </h1>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: `linear-gradient(135deg, ${ACCENT_COLOR}, #EA6C07)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "#FFFFFF",
            boxShadow: `0 4px 10px rgba(249,115,22,0.25)`,
          }}>
            {initials}
          </div>
        </div>

        {/* METRICS TEMPS RÉEL */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{
            background: SLATE[50], borderRadius: 14, padding: "12px 16px",
            border: `1px solid ${SLATE[100]}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: ACCENT_COLOR }}>
              <TrendingUp size={14} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: SLATE[400] }}>
                À ENCAISSER
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
              {formatPrice(stats.totalToCollect)}
            </div>
          </div>
          <div style={{
            background: SLATE[50], borderRadius: 14, padding: "12px 16px",
            border: `1px solid ${SLATE[100]}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "#16A34A" }}>
              <CheckCircle2 size={14} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: SLATE[400] }}>
                LIVRÉES AUJOURD'HUI
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
              {stats.deliveredToday}
            </div>
          </div>
        </div>

        {/* TABS NATIVES */}
        <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${SLATE[50]}` }}>
          {(["pending", "history"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, background: "transparent", border: "none", padding: "16px 0",
                fontSize: 14, fontWeight: 700, color: isActive ? ACCENT_COLOR : SLATE[400],
                position: "relative", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {tab === "pending" ? <LayoutDashboard size={18} /> : <History size={18} />}
                {tab === "pending" ? "Missions" : "Historique"}
                <span style={{
                  padding: "2px 8px", borderRadius: 20,
                  background: isActive ? "rgba(249,115,22,0.12)" : SLATE[100],
                  color: isActive ? ACCENT_COLOR : SLATE[500],
                  fontSize: 11, fontWeight: 800,
                }}>
                  {tab === "pending" ? stats.count : historyOrders.length}
                </span>
                {isActive && (
                  <motion.div layoutId="active-tab" style={{
                    position: "absolute", bottom: 0, left: 24, right: 24,
                    height: 3, background: ACCENT_COLOR, borderRadius: "3px 3px 0 0",
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── BARRE DE RECHERCHE ── */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: SLATE[300] }} />
          <input
            type="text"
            placeholder="Rechercher un nom, réf, ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#FFFFFF", border: `1px solid ${SLATE[200]}`,
              borderRadius: 12, padding: "12px 14px 12px 42px",
              fontSize: 15, color: SLATE[900], fontWeight: 500,
              outline: "none", transition: "all 0.2s",
            }}
          />
        </div>
      </div>

      {/* ── LISTE DES MISSIONS ── */}
      <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {currentList.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{
                width: 72, height: 72, borderRadius: 24, background: "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", color: SLATE[200],
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
              }}>
                <Package size={32} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: SLATE[800], margin: "0 0 8px" }}>Aucune mission</h3>
              <p style={{ fontSize: 14, color: SLATE[400], margin: 0, fontWeight: 500 }}>
                Vos missions apparaîtront ici dès qu'elles vous seront attribuées.
              </p>
            </motion.div>
          ) : currentList.map((order, idx) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              idx={idx} 
              onClick={() => setSelectedOrder(order)} 
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM SHEET (MODAL) ── */}
      <AnimatePresence>
        {selectedOrder && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.1}
              onDragEnd={(e, info) => { if (info.offset.y > 100) setSelectedOrder(null); }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{
                position: "relative", zIndex: 101,
                width: "100%", maxWidth: 540,
                maxHeight: "94vh",
                background: "#FFFFFF",
                borderRadius: "24px 24px 0 0",
                display: "flex", flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 -10px 40px rgba(0,0,0,0.1)"
              }}
            >
              {/* HANDLE */}
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0", flexShrink: 0 }}>
                <div style={{ width: 40, height: 5, borderRadius: 3, background: SLATE[200] }} />
              </div>

              {/* MODAL HEADER WITH CRITICAL INFO */}
              <div style={{
                background: `linear-gradient(135deg, ${ACCENT_COLOR}, #EA6C07)`,
                padding: "20px 24px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexShrink: 0,
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.7)",
                      background: "rgba(255,255,255,0.15)", padding: "2px 8px", borderRadius: 6,
                    }}>
                      #{selectedOrder.ref.split("-").pop()}
                    </span>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFFFFF" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase" }}>
                      {STATUS_CONFIG[selectedOrder.status]?.label ?? "En cours"}
                    </span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                    {formatPrice(selectedOrder.total + selectedOrder.deliveryFee - (selectedOrder.discount || 0))}
                  </h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Client
                  </p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>
                    {selectedOrder.customerName}
                  </p>
                </div>
              </div>

              {/* SCROLLABLE BODY */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: SLATE[50] }}>
                
                {/* ACTIONS GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                  <button
                    onClick={() => { window.location.href = `tel:${selectedOrder.customerPhone}`; }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      padding: "14px", borderRadius: 14, border: "1px solid #DBEAFE",
                      background: "#FFFFFF", color: "#2563EB", fontWeight: 700, fontSize: 14,
                      cursor: "pointer", boxShadow: "0 2px 6px rgba(37,99,235,0.05)"
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: "#EFF6FF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Phone size={16} /></div>
                    Appeler
                  </button>
                  <button
                    onClick={() => handleWhatsApp(selectedOrder, PREDEFINED_MESSAGES[0])}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      padding: "14px", borderRadius: 14, border: "1px solid #DCFCE7",
                      background: "#FFFFFF", color: "#16A34A", fontWeight: 700, fontSize: 14,
                      cursor: "pointer", boxShadow: "0 2px 6px rgba(22,163,74,0.05)"
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, background: "#F0FFF4",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><MessageCircle size={16} /></div>
                    WhatsApp
                  </button>
                </div>

                {/* DESTINATION */}
                <SectionHeader icon={<Navigation size={14} />} title="Destination" accent />
                <InfoCard>
                  <div style={{ padding: "16px" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: SLATE[900], marginBottom: 4 }}>
                      {selectedOrder.commune}
                    </div>
                    <div style={{ fontSize: 14, color: SLATE[500], fontWeight: 500, lineHeight: 1.5 }}>
                      {selectedOrder.customerLocation}
                    </div>
                    {selectedOrder.deliveryNote && (
                      <div style={{
                        display: "flex", gap: 10, padding: "12px",
                        background: "#FFFBEB", border: "1px solid #FDE68A",
                        borderRadius: 12, color: "#92400E",
                        fontSize: 13, fontWeight: 600, marginTop: 14,
                      }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1, color: ACCENT_COLOR }} />
                        <span>{selectedOrder.deliveryNote}</span>
                      </div>
                    )}
                  </div>
                </InfoCard>

                {/* ITEMS */}
                <SectionHeader icon={<Package size={14} />} title={`Contenu (${selectedOrder.items.length})`} />
                <InfoCard>
                  {selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                      borderBottom: i < selectedOrder.items.length - 1 ? `1px solid ${SLATE[50]}` : "none",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: SLATE[100], border: `1px solid ${SLATE[200]}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800, color: SLATE[600],
                      }}>{item.qty}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: SLATE[900] }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: SLATE[400], fontWeight: 600 }}>
                          {[item.size, item.color].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </InfoCard>

                {/* RÉCAPITULATIF FINANCIER */}
                <SectionHeader icon={<Banknote size={14} />} title="Règlement" />
                <InfoCard>
                  <InfoRow label="Sous-total" value={formatPrice(selectedOrder.total)} />
                  <InfoRow label="Livraison" value={formatPrice(selectedOrder.deliveryFee)} />
                  {selectedOrder.discount > 0 && (
                    <InfoRow 
                      label="Remise" 
                      value={<span style={{ color: "#16A34A" }}>−{formatPrice(selectedOrder.discount)}</span>} 
                    />
                  )}
                  <div style={{
                    padding: "16px",
                    background: "linear-gradient(to right, #FFFFFF, #FFF7ED)",
                    borderTop: `1px dashed ${SLATE[200]}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: SLATE[400], textTransform: "uppercase" }}>Total net</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: ACCENT_COLOR, letterSpacing: "-0.02em" }}>
                      {formatPrice(selectedOrder.total + selectedOrder.deliveryFee - (selectedOrder.discount || 0))}
                    </span>
                  </div>
                </InfoCard>

                {/* VENTE INFO */}
                <SectionHeader icon={<User size={14} />} title="Vente" />
                <InfoCard>
                  <InfoRow label="Commercial" value={selectedOrder.commercialName || "—"} icon={<User size={14}/>} />
                  <InfoRow label="Prise en charge" value={formatDate(selectedOrder.createdAt)} icon={<Clock size={14}/>} last />
                </InfoCard>
              </div>

              {/* CTA ACTIONS */}
              {activeTab === "pending" && (
                <div style={{
                  padding: "16px 24px 32px",
                  background: "#FFFFFF",
                  borderTop: `1px solid ${SLATE[100]}`,
                  display: "grid", gridTemplateColumns: "1fr 2.2fr", gap: 12,
                }}>
                  <button
                    disabled={isPending}
                    onClick={() => handleStatusChange(selectedOrder.id, "RETURNED")}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      height: 56, borderRadius: 16, border: "1px solid #FEE2E2",
                      background: "#FFF5F5", color: "#DC2626",
                      fontSize: 14, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <RotateCcw size={18} />
                    Échec
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => handleStatusChange(selectedOrder.id, "DELIVERED")}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      height: 56, borderRadius: 16, border: "none",
                      background: `linear-gradient(135deg, ${ACCENT_COLOR}, #EA6C07)`,
                      color: "#FFFFFF", fontSize: 16, fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: `0 8px 20px rgba(249,115,22,0.3)`,
                      letterSpacing: "0.01em",
                    }}
                  >
                    <CheckCircle2 size={22} strokeWidth={2.5} />
                    CONFIRMER LA LIVRAISON
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── OrderCard Component ─────────────────────────────────────────────────────

const OrderCard = React.memo(({ order, idx, onClick }: { order: any; idx: number; onClick: () => void }) => {
  const amountDue = order.total + order.deliveryFee - (order.discount || 0);
  const isPending = !["DELIVERED", "RETURNED", "CANCELLED"].includes(order.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: idx * 0.04 }}
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        border: `1px solid ${SLATE[100]}`,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${SLATE[50]}` }}>
        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: SLATE[400] }}>
          #{order.ref.split("-").pop()}
        </span>
        <StatusBadge status={order.status} />
      </div>

      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: SLATE[900], marginBottom: 10 }}>
          {order.customerName}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: SLATE[500], fontWeight: 600 }}>
            <MapPin size={14} style={{ color: SLATE[300] }} /> {order.commune}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: SLATE[500], fontWeight: 600 }}>
            <Package size={14} style={{ color: SLATE[300] }} /> {order.items?.length || 0} art.
          </div>
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px",
        background: isPending ? "linear-gradient(to right, #FFFFFF, #FFFBF5)" : SLATE[50],
        borderTop: `1px solid ${SLATE[50]}`,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: SLATE[300], textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {isPending ? "À percevoir" : "Montant"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: isPending ? ACCENT_COLOR : SLATE[600], letterSpacing: "-0.02em" }}>
            {formatPrice(amountDue)}
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: isPending ? "rgba(249,115,22,0.1)" : SLATE[100],
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isPending ? ACCENT_COLOR : SLATE[400],
        }}>
          <ChevronRight size={20} strokeWidth={2.5} />
        </div>
      </div>
    </motion.div>
  );
});
OrderCard.displayName = "OrderCard";
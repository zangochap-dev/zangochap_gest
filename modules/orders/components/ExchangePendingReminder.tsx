"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, ArrowUpRight, Minus, ChevronUp } from "lucide-react";
import "./exchange-reminder.css";

export default function ExchangePendingReminder() {
  const [count, setCount] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const [compact, setCompact] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let disposed = false;
    let active = false;
    const controller = new AbortController();
    const load = async () => {
      if (active || document.hidden) return;
      active = true;
      try {
        const response = await fetch("/api/order-exchange-reminder", { cache: "no-store", signal: controller.signal });
        if (disposed) return;
        if (response.status === 401 || response.status === 403) { setCount(0); setUnavailable(false); return; }
        if (!response.ok) throw new Error("unavailable");
        const data = await response.json();
        if (!Number.isSafeInteger(data.count) || data.count < 0) throw new Error("invalid count");
        if (!disposed) { setCount(data.count); setUnavailable(false); }
      } catch {
        // A failed refresh must not make an unresolved reminder disappear.
        if (!disposed) setUnavailable(true);
      } finally { active = false; }
    };
    const refresh = () => { void load(); };
    refresh();
    const timer = window.setInterval(refresh, 20_000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("order-exchange-requested", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("order-exchange-requested", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [pathname]);

  if (!count && !unavailable) return null;
  if (compact) return <aside className="exchange-pending-reminder compact" aria-label="Suivi des demandes d’échange">
    <button type="button" onClick={() => setCompact(false)} aria-label="Développer le rappel des échanges" aria-expanded={false}>
      <Clock3 size={17} aria-hidden="true" /><span>{count ? `${count} échange${count > 1 ? "s" : ""} en attente` : "Suivi des échanges"}</span><ChevronUp size={15} aria-hidden="true" />
    </button>
  </aside>;
  return <aside className="exchange-pending-reminder" aria-label="Suivi des demandes d’échange">
    <button className="exchange-reminder-minimize" type="button" onClick={() => setCompact(true)} aria-label="Réduire le rappel sans le masquer" aria-expanded={true}><Minus size={16} /></button>
    <Clock3 size={22} aria-hidden="true" />
    <div aria-live="polite" role="status">
      <strong>{count ? `${count} échange${count > 1 ? "s" : ""} en attente` : "Suivi indisponible"}</strong>
      <p>{unavailable ? "Actualisation indisponible. Vérifiez vos demandes." : "En attente de validation par l’admin."}</p>
    </div>
    <Link href="/zangochap-manager/orders/exchanges">Voir mes demandes <ArrowUpRight size={16} aria-hidden="true" /></Link>
  </aside>;
}

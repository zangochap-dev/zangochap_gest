import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import { TableCard } from "@/components/UI";
import { Cpu } from "lucide-react";
import os from "os";

export const dynamic = "force-dynamic";

export default async function DeveloperLogsPage() {
  const session = await getSession();
  if (!session || session.role !== "developer") {
    redirect("/zangochap-manager/dashboard");
  }

  // Fetch recent stock movements
  const stockMovements = await prisma.stockMovement.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      variant: {
        include: {
          product: true
        }
      }
    }
  });

  // Fetch recent orders with history
  const recentOrders = await prisma.order.findMany({
    take: 50,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      ref: true,
      customerName: true,
      status: true,
      history: true,
      updatedAt: true
    }
  });

  // Extract list of history actions as logs
  const orderLogs: any[] = [];
  recentOrders.forEach((order) => {
    if (order.history && Array.isArray(order.history)) {
      order.history.forEach((h: any) => {
        orderLogs.push({
          orderRef: order.ref || "En attente",
          customerName: order.customerName,
          action: h.action,
          by: h.by || "Système",
          at: new Date(h.at || order.updatedAt)
        });
      });
    }
  });

  // Sort order logs by date desc
  orderLogs.sort((a, b) => b.at.getTime() - a.at.getTime());
  const finalOrderLogs = orderLogs.slice(0, 50);

  // System stats
  const memoryUsage = process.memoryUsage();
  const formatMB = (bytes: number) => `${Math.round((bytes / 1024 / 1024) * 100) / 100} MB`;

  const uptimeSeconds = process.uptime();
  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const sysInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().length,
    uptime: formatUptime(uptimeSeconds),
    rss: formatMB(memoryUsage.rss),
    heapTotal: formatMB(memoryUsage.heapTotal),
    heapUsed: formatMB(memoryUsage.heapUsed)
  };

  return (
    <>
      <Topbar title="Logs & Console" subtitle="Développeur Zangochap" />
      <div className="px-5 py-4 flex flex-col gap-6 animate-fade-in">
        {/* System Stats Cards */}
        <div>
          <h3 className="text-xs font-extrabold uppercase text-[var(--brown-soft)] mb-3 tracking-wider flex items-center gap-1.5">
            <Cpu size={14} /> Ressources Système
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[var(--line)] rounded-md p-3.5 flex flex-col">
              <span className="text-[10px] font-bold text-[var(--brown-soft)] uppercase tracking-wider">Uptime Serveur</span>
              <span className="text-lg font-bold text-[var(--ink)] mt-1">{sysInfo.uptime}</span>
            </div>
            <div className="bg-white border border-[var(--line)] rounded-md p-3.5 flex flex-col">
              <span className="text-[10px] font-bold text-[var(--brown-soft)] uppercase tracking-wider">Mémoire Heap (Utilisée/Totale)</span>
              <span className="text-lg font-bold text-[var(--ink)] mt-1">{sysInfo.heapUsed} / {sysInfo.heapTotal}</span>
            </div>
            <div className="bg-white border border-[var(--line)] rounded-md p-3.5 flex flex-col">
              <span className="text-[10px] font-bold text-[var(--brown-soft)] uppercase tracking-wider">Mémoire RSS</span>
              <span className="text-lg font-bold text-[var(--ink)] mt-1">{sysInfo.rss}</span>
            </div>
            <div className="bg-white border border-[var(--line)] rounded-md p-3.5 flex flex-col">
              <span className="text-[10px] font-bold text-[var(--brown-soft)] uppercase tracking-wider">Environnement</span>
              <span className="text-lg font-bold text-[var(--ink)] mt-1">{sysInfo.platform} ({sysInfo.arch}) · Node {sysInfo.nodeVersion}</span>
            </div>
          </div>
        </div>

        {/* Database Stock Movements */}
        <TableCard title="Journal des Mouvements de Stock" meta="50 derniers événements enregistrés">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--cream)] text-[var(--brown-soft)]">
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Produit / Variante</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold" style={{ textAlign: "right" }}>Quantité</th>
                  <th className="p-3 font-semibold">Auteur</th>
                  <th className="p-3 font-semibold">Motif</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.map((m) => (
                  <tr key={m.id} className="border-b border-[var(--line)] hover:bg-[var(--cream)]/30">
                    <td className="p-3 font-mono text-[10px] text-neutral-500">
                      {new Date(m.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[var(--ink)]">
                        {m.variant?.product?.name || "Produit inconnu"}
                      </span>
                      {m.variant && (
                        <span className="text-neutral-500 ml-1">
                          ({m.variant.size} / {m.variant.color})
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded-[3px] font-bold text-[10px] uppercase border ${
                          m.type === "SALE"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : m.type === "RESTOCK"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className={`p-3 font-mono font-bold text-right ${m.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="p-3 font-medium text-neutral-700">{m.byName}</td>
                    <td className="p-3 text-neutral-500">{m.reason || "—"}</td>
                  </tr>
                ))}
                {stockMovements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-neutral-400">
                      Aucun mouvement de stock enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableCard>

        {/* Database Order History Logs */}
        <TableCard title="Logs d'Activité des Commandes" meta="50 dernières actions d'historique des commandes">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--cream)] text-[var(--brown-soft)]">
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Commande Ref</th>
                  <th className="p-3 font-semibold">Client</th>
                  <th className="p-3 font-semibold">Action</th>
                  <th className="p-3 font-semibold">Opérateur</th>
                </tr>
              </thead>
              <tbody>
                {finalOrderLogs.map((log, index) => (
                  <tr key={index} className="border-b border-[var(--line)] hover:bg-[var(--cream)]/30">
                    <td className="p-3 font-mono text-[10px] text-neutral-500">
                      {log.at.toLocaleString("fr-FR")}
                    </td>
                    <td className="p-3 font-mono font-bold text-[var(--orange)]">{log.orderRef}</td>
                    <td className="p-3 text-neutral-700">{log.customerName}</td>
                    <td className="p-3 font-medium text-[var(--ink)]">{log.action}</td>
                    <td className="p-3 text-neutral-500">{log.by}</td>
                  </tr>
                ))}
                {finalOrderLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-neutral-400">
                      Aucune activité de commande enregistrée dans l'historique.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TableCard>
      </div>
    </>
  );
}

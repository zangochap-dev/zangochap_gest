import React from "react";
import { StatCard, TableCard } from "@/components/UI";
import { formatPrice } from "@/lib/constants";
import {
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronRight,
  Package,
  ClipboardList,
  Truck,
  Boxes,
  ArrowRight,
} from "lucide-react";

import Topbar from "@/components/Topbar";
import DashboardRecentOrders from "./DashboardRecentOrders";
import { getDashboardStats } from "@/modules/orders/actions";
import "./dashboard.css";
import Link from "next/link";

export default async function AdminDashboard({ user }: { user: any }) {
  const stats = await getDashboardStats();

  return (
    <div className="dashboard-root">
      <Topbar title="Tableau de" subtitle="bord" />

      <div className="dashboard-content animate-fade-in">
        <div className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="dashboard-kicker">Pilotage du jour</span>
            <h2>Bonjour, {user?.name?.split(" ")[0] || "Admin"}</h2>
            <p>Commandes, stock et files logistiques en un seul coup d'oeil.</p>
          </div>
          <div className="dashboard-hero-actions">
            <div className="dashboard-hero-metric">
              <span>Aujourd'hui</span>
              <strong>{stats.todayOrders}</strong>
              <small>{formatPrice(stats.todayRevenue || 0)}</small>
            </div>
            <Link href="/zangochap-manager/orders/new" className="dashboard-primary-action">
              <ShoppingBag size={16} /> Nouvelle vente
            </Link>
          </div>
        </div>

        <div className="dashboard-stats-grid">
          <StatCard
            label="COMMANDES DU JOUR"
            value={stats.todayOrders}
            icon={<ShoppingBag size={20} />}
            accent
          />
          <StatCard
            label="CHIFFRE D'AFFAIRES"
            value={formatPrice(stats.totalRevenue)}
            icon={<TrendingUp size={20} />}
            color="var(--orange)"
          />
          <StatCard
            label="TAUX DE CONVERSION"
            value={`${stats.conversionRate}%`}
            icon={<CheckCircle2 size={20} />}
            color="var(--green)"
          />
          <StatCard
            label="RUPTURES DE STOCK"
            value={stats.outOfStockCount}
            icon={<AlertTriangle size={20} />}
            color={stats.outOfStockCount > 0 ? "var(--red)" : "var(--green)"}
          />
        </div>

        <div className="dashboard-ops-grid">
          <Link href="/zangochap-manager/orders/to-process" className="dashboard-op-tile">
            <span className="op-icon amber"><ClipboardList size={18} /></span>
            <span className="op-body">
              <strong>{stats.toProcessCount || 0}</strong>
              <small>A traiter</small>
            </span>
            <ArrowRight size={16} />
          </Link>
          <Link href="/zangochap-manager/logistics/collection" className="dashboard-op-tile">
            <span className="op-icon blue"><Truck size={18} /></span>
            <span className="op-body">
              <strong>{stats.collectionQueueCount || 0}</strong>
              <small>A collecter</small>
            </span>
            <ArrowRight size={16} />
          </Link>
          <Link href="/zangochap-manager/logistics/packing" className="dashboard-op-tile">
            <span className="op-icon green"><Boxes size={18} /></span>
            <span className="op-body">
              <strong>{stats.packingQueueCount || 0}</strong>
              <small>A emballer</small>
            </span>
            <ArrowRight size={16} />
          </Link>
          <Link href="/zangochap-manager/products/shortages" className="dashboard-op-tile danger">
            <span className="op-icon red"><AlertTriangle size={18} /></span>
            <span className="op-body">
              <strong>{stats.outOfStockCount}</strong>
              <small>Ruptures</small>
            </span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="dashboard-main-grid">
          <div className="dashboard-left-col">
            <DashboardRecentOrders orders={JSON.parse(JSON.stringify(stats.recentOrders))} />

            <TableCard title="Repartition par commune" meta="Top zones de livraison (CA)">
              <div className="commune-list">
                {stats.topCommunes.map((c, i) => {
                  const max = stats.topCommunes[0].revenue || 1;
                  const pct = Math.round((c.revenue / max) * 100);
                  return (
                    <div key={i} className="commune-item">
                      <div className="commune-info-row">
                        <span className="commune-name">{c.name}</span>
                        <span className="commune-revenue">{formatPrice(c.revenue)}</span>
                      </div>
                      <div className="progress-bg">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {stats.topCommunes.length === 0 && (
                  <div className="cell-muted" style={{ padding: "20px 0", textAlign: "center" }}>
                    Aucune donnee geographique.
                  </div>
                )}
              </div>
            </TableCard>
          </div>

          <div className="dashboard-right-col">
            <TableCard title="Top commerciaux" meta="Base sur les ventes livrees">
              <div className="leaderboard-list">
                {stats.leaderboard.map((l, i) => (
                  <div key={i} className="leaderboard-item">
                    <div className={`leaderboard-rank ${i === 0 ? "top" : "other"}`}>
                      {i === 0 ? <Award size={16} /> : i + 1}
                    </div>
                    <div className="leaderboard-info">
                      <div className="leaderboard-name">{l.name}</div>
                      <div className="leaderboard-meta">{l.count} commandes</div>
                    </div>
                    <div className="leaderboard-val">{formatPrice(l.revenue)}</div>
                  </div>
                ))}
                {stats.leaderboard.length === 0 && (
                  <div className="cell-muted" style={{ padding: "30px 20px", textAlign: "center" }}>
                    Pas encore de ventes.
                  </div>
                )}
              </div>
              <Link href="/zangochap-manager/admin/performance" className="leaderboard-footer">
                Voir les details <ChevronRight size={14} />
              </Link>
            </TableCard>

            <TableCard title="Apercu stock">
              <div className="stock-preview-box">
                <div className="stock-stats-row">
                  <div className="stock-stat-pill normal">
                    <div className="stock-pill-label normal">PRODUITS</div>
                    <div className="stock-pill-val">{stats.productsCount}</div>
                  </div>
                  <div className="stock-stat-pill alert">
                    <div className="stock-pill-label alert">RUPTURES</div>
                    <div className="stock-pill-val alert">{stats.outOfStockCount}</div>
                  </div>
                </div>
                <Link href="/zangochap-manager/products" className="btn-secondary stock-manage-btn">
                  <Package size={14} /> Gerer les stocks
                </Link>
              </div>
            </TableCard>
          </div>
        </div>
      </div>
    </div>
  );
}

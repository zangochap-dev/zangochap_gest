import React from "react";
import { StatCard, TableCard } from "@/components/UI";
import { formatPrice } from "@/lib/constants";
import {
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Users,
  MapPin,
  Award,
  ChevronRight,
  Package
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
        {/* WELCOME HEADER */}
        <div className="dashboard-welcome">
          <div>
            <h2>Bienvenue, {user?.name?.split(' ')[0]}</h2>
            <p>Voici un aperçu de l'activity de Zangochap aujourd'hui.</p>
          </div>
          <div className="dashboard-actions">
            <Link href="/zangochap-manager/orders/new" className="btn-orange" style={{ padding: '10px 20px', textDecoration: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={16} /> Nouvelle Vente
            </Link>
          </div>
        </div>

        {/* STATS OVERVIEW */}
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

        <div className="dashboard-main-grid">
          {/* LEFT COLUMN: ACTIVITY */}
          <div className="dashboard-left-col">
            <DashboardRecentOrders orders={JSON.parse(JSON.stringify(stats.recentOrders))} />

            {/* GEOGRAPHIC BREAKDOWN */}
            <TableCard title="Répartition par Commune" meta="Top zones de livraison (CA)">
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
                {stats.topCommunes.length === 0 && <div className="cell-muted" style={{ padding: '20px 0', textAlign: 'center' }}>Aucune donnée géographique.</div>}
              </div>
            </TableCard>
          </div>

          {/* RIGHT COLUMN: PERFORMANCE & STATS */}
          <div className="dashboard-right-col">
            {/* LEADERBOARD */}
            <TableCard title="Top Commerciaux" meta="Basé sur les ventes livrées">
              <div className="leaderboard-list">
                {stats.leaderboard.map((l, i) => (
                  <div key={i} className="leaderboard-item">
                    <div className={`leaderboard-rank ${i === 0 ? 'top' : 'other'}`}>
                      {i === 0 ? <Award size={16} /> : i + 1}
                    </div>
                    <div className="leaderboard-info">
                      <div className="leaderboard-name">{l.name}</div>
                      <div className="leaderboard-meta">{l.count} commandes</div>
                    </div>
                    <div className="leaderboard-val">{formatPrice(l.revenue)}</div>
                  </div>
                ))}
                {stats.leaderboard.length === 0 && <div className="cell-muted" style={{ padding: '30px 20px', textAlign: 'center' }}>Pas encore de ventes.</div>}
              </div>
              <Link href="/zangochap-manager/admin/performance" className="leaderboard-footer">
                Voir les détails <ChevronRight size={14} />
              </Link>
            </TableCard>

            {/* QUICK ACTIONS / INVENTORY SUMMARY */}
            <TableCard title="Aperçu Stock">
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
                  <Package size={14} /> Gérer les stocks
                </Link>
              </div>
            </TableCard>
          </div>
        </div>
      </div>
    </div>
  );
}

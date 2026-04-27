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
import Link from "next/link";

export default async function AdminDashboard({ user }: { user: any }) {
  const stats = await getDashboardStats();

  return (
    <div style={{ background: '#F8F5F2', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Tableau de" subtitle="bord" />
      
      <div className="content animate-fade-in" style={{ flex: 1, padding: '24px' }}>
        {/* WELCOME HEADER */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>Bienvenue, {user?.name?.split(' ')[0]}</h2>
            <p style={{ color: 'var(--brown-soft)', fontSize: 14 }}>Voici un aperçu de l'activité de Zangochap aujourd'hui.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <Link href="/zangochap-manager/orders/new" className="btn-orange" style={{ padding: '10px 20px', textDecoration: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={16} /> Nouvelle Vente
             </Link>
          </div>
        </div>

        {/* STATS OVERVIEW */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '20px',
          marginBottom: 32 
        }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* LEFT COLUMN: ACTIVITY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            <DashboardRecentOrders orders={JSON.parse(JSON.stringify(stats.recentOrders))} />
            
            {/* GEOGRAPHIC BREAKDOWN */}
            <TableCard title="Répartition par Commune" meta="Top zones de livraison (CA)">
               <div style={{ padding: '10px 20px' }}>
                  {stats.topCommunes.map((c, i) => {
                    const max = stats.topCommunes[0].revenue || 1;
                    const pct = Math.round((c.revenue / max) * 100);
                    return (
                      <div key={i} style={{ marginBottom: 16 }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{c.name}</span>
                            <span style={{ fontWeight: 600 }}>{formatPrice(c.revenue)}</span>
                         </div>
                         <div style={{ height: 8, background: 'var(--cream-2)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--orange)', borderRadius: 4 }} />
                         </div>
                      </div>
                    );
                  })}
                  {stats.topCommunes.length === 0 && <div className="cell-muted" style={{ padding: '20px 0', textAlign: 'center' }}>Aucune donnée géographique.</div>}
               </div>
            </TableCard>
          </div>

          {/* RIGHT COLUMN: PERFORMANCE & STATS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* LEADERBOARD */}
            <TableCard title="Top Commerciaux" meta="Basé sur les ventes livrées">
               <div style={{ padding: '4px 0' }}>
                  {stats.leaderboard.map((l, i) => (
                    <div key={i} style={{ padding: '12px 20px', borderBottom: i < stats.leaderboard.length - 1 ? '1px solid var(--line)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                       <div style={{ width: 32, height: 32, borderRadius: 8, background: i === 0 ? 'var(--orange-soft)' : 'var(--cream-2)', color: i === 0 ? 'var(--orange)' : 'var(--brown-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                          {i === 0 ? <Award size={16} /> : i + 1}
                       </div>
                       <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{l.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--brown-soft)' }}>{l.count} commandes</div>
                       </div>
                       <div style={{ fontWeight: 800, fontSize: 13 }}>{formatPrice(l.revenue)}</div>
                    </div>
                  ))}
                  {stats.leaderboard.length === 0 && <div className="cell-muted" style={{ padding: '30px 20px', textAlign: 'center' }}>Pas encore de ventes.</div>}
               </div>
               <Link href="/zangochap-manager/admin/performance" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, borderTop: '1px solid var(--line)', textDecoration: 'none', color: 'var(--orange)', fontSize: 12, fontWeight: 700, gap: 4 }}>
                  Voir les détails <ChevronRight size={14} />
               </Link>
            </TableCard>

            {/* QUICK ACTIONS / INVENTORY SUMMARY */}
            <TableCard title="Aperçu Stock">
               <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                     <div style={{ flex: 1, background: 'var(--cream-2)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brown-soft)', marginBottom: 4 }}>PRODUITS</div>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.productsCount}</div>
                     </div>
                     <div style={{ flex: 1, background: 'var(--red-soft)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>RUPTURES</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>{stats.outOfStockCount}</div>
                     </div>
                  </div>
                  <Link href="/zangochap-manager/products" className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, fontSize: 12, textDecoration: 'none' }}>
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

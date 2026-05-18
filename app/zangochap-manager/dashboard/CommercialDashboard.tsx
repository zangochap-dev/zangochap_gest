import React from "react";
import prisma from "@/lib/prisma";
import { StatCard, TableCard, StatusBadge, SectionLabel, EmptyState } from "@/components/UI";
import { formatPrice, formatDay, formatDate } from "@/lib/constants";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import "./dashboard.css";

export default async function CommercialDashboard({ user }: { user: any }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstName = user?.name?.split(' ')[0] || '';

  const myOrders = await prisma.order.findMany({
    where: {
      deletedAt: null,
      OR: [
        { commercialId: user.id },
        { commercialName: user.name },
      ],
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 1000 // Limit to avoid performance issues with very active commercial accounts
  });

  const todayOrders = myOrders.filter(o => new Date(o.createdAt) >= today);
  const delivered = myOrders.filter(o => o.status === 'DELIVERED');
  const pending = myOrders.filter(o => o.status === 'PENDING' || o.status === 'TO_PROCESS');
  const confirmed = myOrders.filter(o => o.status === 'CONFIRMED');
  const cancelled = myOrders.filter(o => o.status === 'CANCELLED');
  const nonPacked = myOrders.filter(o => ['CONFIRMED', 'PENDING', 'TO_PROCESS'].includes(o.status));
  const ca = delivered.reduce((s, o) => s + o.total, 0);
  const todayCa = delivered.filter(o => new Date(o.createdAt) >= today).reduce((s, o) => s + o.total, 0);
  const conv = myOrders.length ? Math.round(delivered.length / myOrders.length * 100) : 0;

  return (
    <>
      <Topbar title="Bonjour" subtitle={firstName} />
      <div className="content animate-fade-in">
      <SectionLabel>Mes performances</SectionLabel>
      <div className="stats-grid">
        <StatCard label="Commandes (jour)" value={todayOrders.length} trend={`${myOrders.length} au total`} accent />
        <StatCard label="Mon CA livré" value={formatPrice(Number(ca))} color="var(--orange)" trend={`+${formatPrice(Number(todayCa))} aujourd'hui`} trendDir="up" />
        <StatCard label="Taux conversion" value={`${conv}%`} trend={`${delivered.length} livrées sur ${myOrders.length}`} trendDir="up" />
        <StatCard label="Non emballées" value={nonPacked.length} color="var(--amber)" trend="En attente d'emballage" trendDir="down" />
      </div>

      <SectionLabel spaced>Mon pipeline</SectionLabel>
      <div className="stats-grid">
        <StatCard label="En attente" value={pending.length} color="var(--amber)" />
        <StatCard label="Confirmées" value={confirmed.length} color="var(--blue)" />
        <StatCard label="Livrées" value={delivered.length} color="var(--green)" />
        <StatCard label="Annulées" value={cancelled.length} color="var(--red)" />
      </div>

      {/* Recent orders */}
      <div style={{ marginTop: 16 }}>
        <TableCard
          title="Mes dernières commandes"
          meta={`${todayOrders.length} aujourd'hui`}
          actions={<Link href="/orders" className="btn-primary-sm">Tout voir →</Link>}
        >
          {myOrders.length === 0 ? (
            <EmptyState icon="📦" title="Aucune commande" description="Créez votre première commande." />
          ) : (
            <table>
              <thead>
                <tr><th>Réf.</th><th>Client</th><th>Articles</th><th>Total</th><th>Statut</th><th>Date</th></tr>
              </thead>
              <tbody>
                {myOrders.slice(0, 6).map(order => (
                  <tr key={order.id}>
                    <td><span className="cell-mono">{order.ref}</span></td>
                    <td>
                      <div className="cell-strong">{order.customerName}</div>
                      <div className="cell-muted">{order.customerPhone}</div>
                    </td>
                    <td>
                      {order.items.map((item, i) => (
                        <div key={i} className="order-item-mini">
                          <span>{item.emoji || '📦'}</span>
                          <span>{item.name}</span>
                          <span className="size-dot">{item.size}</span>
                          <strong className="order-item-color">{item.color}</strong>
                          <span>× {item.qty}</span>
                        </div>
                      ))}
                    </td>
                    <td><span className="cell-price">{formatPrice(Number(order.total))}</span></td>
                    <td><StatusBadge status={order.status} /></td>
                    <td><span className="cell-muted">{formatDate(order.createdAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableCard>
      </div>
    </div>
    </>
  );
}

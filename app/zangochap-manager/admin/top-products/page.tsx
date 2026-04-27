import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { TableCard, StatCard } from "@/components/UI";
import { formatPrice, STATUS_LABELS } from "@/lib/constants";
import { getSession } from "@/modules/auth/actions";
import TopProductsFilters from "./TopProductsFilters";

export const dynamic = "force-dynamic";

export default async function TopProductsPage({
  searchParams
}: {
  searchParams: Promise<{
    commercialId?: string,
    type?: string,
    status?: string,
    dateFrom?: string,
    dateTo?: string
  }>
}) {
  const user = await getSession();
  if (user?.role !== 'admin') {
    return <div className="content"><div className="empty"><h4>Accès refusé</h4></div></div>;
  }

  const { commercialId, type, status, dateFrom, dateTo } = await searchParams;

  const where: any = {};
  if (commercialId) where.commercialId = commercialId;
  if (type) where.type = type;
  if (status) where.status = status;
  else where.status = { not: 'CANCELLED' };

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
  });

  const commercials = await prisma.user.findMany({
    where: { role: 'COMMERCIAL' },
    select: { id: true, name: true }
  });

  // Get distinct types and statuses for filters
  const allTypes = ['Standard', 'Echange', 'Vente Directe', 'Stock'];

  // Aggregate product sales
  const salesMap = new Map<string, { name: string; emoji: string; totalQty: number; totalRevenue: number; orderCount: Set<string> }>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.name;
      if (!salesMap.has(key)) {
        salesMap.set(key, { name: item.name, emoji: item.emoji || '📦', totalQty: 0, totalRevenue: 0, orderCount: new Set() });
      }
      const data = salesMap.get(key)!;
      data.totalQty += item.qty;
      data.totalRevenue += item.price * item.qty;
      data.orderCount.add(order.id);
    }
  }

  const sorted = Array.from(salesMap.values())
    .map(d => ({ ...d, orderCount: d.orderCount.size }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = sorted.reduce((s, p) => s + p.totalRevenue, 0);
  const totalQty = sorted.reduce((s, p) => s + p.totalQty, 0);

  return (
    <>
      <Topbar title="Top" subtitle="produits" />
      <div className="content animate-fade-in">
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <StatCard label="Revenu généré" value={formatPrice(totalRevenue)} accent />
          <StatCard label="Articles vendus" value={totalQty} />
          <StatCard label="Produits uniques" value={sorted.length} />
          <StatCard label="Commandes incluses" value={orders.length} />
        </div>

        <TopProductsFilters
          commercials={commercials}
          types={allTypes}
          statuses={Object.entries(STATUS_LABELS)}
          currentFilters={{ commercialId, type, status, dateFrom, dateTo }}
        />

        <TableCard title="Classement des ventes" meta={`${sorted.length} produits trouvés`}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Produit</th>
                <th style={{ textAlign: 'center' }}>Qté</th>
                <th style={{ textAlign: 'right' }}>Revenu</th>
                <th style={{ textAlign: 'center' }}>Commandes</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--brown-soft)' }}>Aucune donnée pour ces filtres</td></tr>
              ) : sorted.slice(0, 50).map((p, i) => {
                const pct = totalRevenue > 0 ? Math.round(p.totalRevenue / totalRevenue * 100) : 0;
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: i < 3 ? 'var(--orange)' : 'var(--cream-2)', color: i < 3 ? 'white' : 'var(--brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>
                        {i + 1}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{p.emoji}</span>
                        <span className="cell-strong">{p.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}><strong>{p.totalQty}</strong></td>
                    <td style={{ textAlign: 'right' }}><span className="cell-price">{formatPrice(p.totalRevenue)}</span></td>
                    <td style={{ textAlign: 'center' }}>{p.orderCount}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--cream-2)', minWidth: 60 }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3, background: 'var(--orange)' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, width: 35 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableCard>
      </div>
    </>
  );
}

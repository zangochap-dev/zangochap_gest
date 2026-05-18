import React from "react";
import prisma from "@/lib/prisma";
import { StatCard, TableCard, StatusBadge, SectionLabel, EmptyState } from "@/components/UI";
import { formatPrice, formatDay } from "@/lib/constants";
import Link from "next/link";

export default async function PackingDashboard({ user }: { user: any }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Orders to pack (confirmed)
  const toPack = await prisma.order.findMany({
    where: { status: 'CONFIRMED' },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  });

  // My packed orders
  const myPacked = await prisma.order.findMany({
    where: { packedByName: user.name, status: { in: ['PACKED', 'PARTIAL', 'DELIVERED'] } },
    include: { items: true },
    orderBy: { packedAt: 'desc' },
  });

  const myPackedToday = myPacked.filter(o => o.packedAt && new Date(o.packedAt) >= today);
  const myPartial = myPacked.filter(o => o.status === 'PARTIAL');

  // Total queue
  const allPacked = await prisma.order.count({ where: { status: { in: ['PACKED', 'PARTIAL'] } } });

  return (
    <div className="content animate-fade-in">
      <SectionLabel>Mes statistiques personnelles</SectionLabel>
      <div className="stats-grid">
        <StatCard label="Emballé (jour)" value={myPackedToday.length} trend={`${myPacked.length} au total`} accent />
        <StatCard label="En file d'attente" value={toPack.length} color="var(--amber)" trend="À emballer" trendDir="down" />
        <StatCard label="Emballage partiel" value={myPartial.length} color="var(--blue)" />
        <StatCard
          label="Mon taux de réussite"
          value={`${myPacked.length ? Math.round((myPacked.length - myPartial.length) / myPacked.length * 100) : 0}%`}
          trend="Complètement emballé"
          trendDir="up"
        />
      </div>

      <SectionLabel spaced>Vue globale du service</SectionLabel>
      <div className="stats-grid">
        <StatCard label="Total emballés" value={allPacked} />
        <StatCard label="En attente" value={toPack.length} color="var(--amber)" />
      </div>

      <TableCard
        title="File d'attente — À emballer"
        meta={`${toPack.length} commande(s)`}
        actions={<Link href="/zangochap-manager/logistics/packing" className="btn-primary-sm">Commencer →</Link>}
      >
        {toPack.length === 0 ? (
          <EmptyState icon="✓" title="Tout est emballé" description="La file est vide." />
        ) : (
          <table>
            <thead>
              <tr><th>Réf.</th><th>Articles</th><th>Commune</th><th>Statut</th><th>Créé le</th></tr>
            </thead>
            <tbody>
              {toPack.slice(0, 6).map(order => (
                <tr key={order.id}>
                  <td>
                    <span className="cell-mono">{order.ref}</span>
                    <div className="cell-muted">{order.customerName}</div>
                  </td>
                  <td>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, margin: '2px 0' }}>
                        <span>{item.emoji || '📦'}</span>
                        <span>{item.name}</span>
                        <span className="size-dot">{item.size}</span>
                        <strong style={{ fontSize: 10 }}>{item.color}</strong>
                        <span>× {item.qty}</span>
                      </div>
                    ))}
                  </td>
                  <td><span className="cell-muted">{order.commune || '—'}</span></td>
                  <td><StatusBadge status={order.status} /></td>
                  <td><span className="cell-muted">{formatDay(order.createdAt)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}

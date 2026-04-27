import React from "react";
import prisma from "@/lib/prisma";
import { StatCard, TableCard, StatusBadge, SectionLabel, EmptyState } from "@/components/UI";
import { formatPrice, formatDay } from "@/lib/constants";

export default async function CollectionDashboard({ user }: { user: any }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Items to collect (products with 0 stock that appear in active orders)
  const orders = await prisma.order.findMany({
    where: { status: { notIn: ['CANCELLED', 'DELIVERED'] } },
    include: { items: true },
  });
  const products = await prisma.product.findMany({ include: { variants: true } });
  const productMap = new Map(products.map(p => [p.id, p]));

  const toCollect: Array<{ order: any; item: any; product: any }> = [];
  for (const order of orders) {
    for (const item of order.items) {
      if (!item.productId) continue;
      const product = productMap.get(item.productId);
      if (product && product.stock === 0) {
        toCollect.push({ order, item, product });
      }
    }
  }

  // Collection records
  const allRecords = await prisma.collectionRecord.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const myRecords = allRecords.filter(r => r.byName === user.name);
  const myToday = myRecords.filter(r => new Date(r.createdAt) >= today);
  const myCollected = myRecords.filter(r => r.status === 'collected');
  const myUnavailable = myRecords.filter(r => r.status === 'unavailable');
  const myAlternative = myRecords.filter(r => r.status === 'alternative');
  const teamCollected = allRecords.filter(r => r.status === 'collected');

  return (
    <div className="content animate-fade-in">
      <SectionLabel>Mes statistiques personnelles</SectionLabel>
      <div className="stats-grid">
        <StatCard label="Mes collectes (jour)" value={myToday.filter(r => r.status === 'collected').length} trend={`${myCollected.length} au total`} accent />
        <StatCard label="Mes alternatives" value={myAlternative.length} color="var(--blue)" trend="Solutions trouvées" />
        <StatCard label="Non collectés" value={myUnavailable.length} color="var(--red)" trend="Indispos fournisseur" trendDir="down" />
        <StatCard
          label="Taux de collecte"
          value={`${myRecords.length ? Math.round(myCollected.length / myRecords.length * 100) : 0}%`}
          trend="Mes performances"
          trendDir="up"
        />
      </div>

      <SectionLabel spaced>Vue globale du service</SectionLabel>
      <div className="stats-grid">
        <StatCard label="À collecter (file)" value={toCollect.length} />
        <StatCard label="Total équipe collecté" value={teamCollected.length} color="var(--green)" />
      </div>

      <TableCard
        title="À collecter chez les fournisseurs"
        actions={<a href="/logistics/collection" className="btn-primary-sm">Tout voir →</a>}
      >
        {toCollect.length === 0 ? (
          <EmptyState icon="✓" title="Tout est en stock" description="Aucune collecte nécessaire." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Produit</th>
                <th>Variation</th>
                <th>Fournisseur</th>
              </tr>
            </thead>
            <tbody>
              {toCollect.slice(0, 6).map(({ order, item, product }, i) => (
                <tr key={i}>
                  <td>
                    <span className="cell-mono">{order.ref}</span>
                    <div className="cell-muted">{order.customerName}</div>
                  </td>
                  <td><span className="cell-strong">{item.name}</span></td>
                  <td>
                    <span className="size-dot">{item.size}</span>{' '}
                    <strong style={{ fontSize: 11 }}>{item.color}</strong> × {item.qty}
                  </td>
                  <td><strong>{product.supplier}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}

import React from "react";
import prisma from "@/lib/prisma";
import { StatCard, TableCard, EmptyState } from "@/components/UI";
import Topbar from "@/components/Topbar";
import { shouldShowInCollectionQueue } from "@/modules/logistics/collection/helpers";
import "./dashboard.css";

export default async function CollectionDashboard({ user }: { user: any }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { deletedAt: null, status: { notIn: ["CANCELLED", "DELIVERED"] } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  const products = await prisma.product.findMany({ include: { variants: true, supplier: true } });
  const productMap = new Map(products.map(p => [p.id, p]));

  const toCollect: Array<{ order: any; item: any; product: any }> = [];
  for (const order of orders) {
    for (const item of order.items) {
      if (!item.productId) {
        toCollect.push({
          order,
          item,
          product: { id: "CUSTOM", name: item.name, supplier: null, variants: [], stock: 0, isCustom: true },
        });
        continue;
      }
      const product = productMap.get(item.productId);
      if (!product) continue;
      if (shouldShowInCollectionQueue(order, item, product)) toCollect.push({ order, item, product });
    }
  }

  const allRecords = await prisma.collectionRecord.findMany({
    orderBy: { createdAt: "desc" },
  });
  const myRecords = allRecords.filter(r => r.byName === user.name);
  const myToday = myRecords.filter(r => new Date(r.createdAt) >= today);
  const myCollected = myRecords.filter(r => r.status === "collected");
  const myUnavailable = myRecords.filter(r => r.status === "unavailable");
  const myAlternative = myRecords.filter(r => r.status === "alternative");
  const teamCollected = allRecords.filter(r => r.status === "collected");

  return (
    <>
      <Topbar title="Bord" subtitle="collecte" />
      <div className="content animate-fade-in">
        <div className="stats-grid">
          <StatCard label="Collectes du jour" value={myToday.filter(r => r.status === "collected").length} trend={`${myCollected.length} au total`} accent />
          <StatCard label="Alternatives" value={myAlternative.length} color="var(--blue)" trend="Solutions trouvees" />
          <StatCard label="Non collectes" value={myUnavailable.length} color="var(--red)" trend="Indispos fournisseur" trendDir="down" />
          <StatCard
            label="Taux de collecte"
            value={`${myRecords.length ? Math.round((myCollected.length / myRecords.length) * 100) : 0}%`}
            trend="Mes performances"
            trendDir="up"
          />
        </div>

        <div className="stats-grid" style={{ marginTop: 16 }}>
          <StatCard label="File collecte" value={toCollect.length} color="var(--amber)" />
          <StatCard label="Equipe collecte" value={teamCollected.length} color="var(--green)" />
        </div>

        <TableCard
          title="A collecter chez les fournisseurs"
          meta={`${toCollect.length} article(s) en manque`}
          actions={<a href="/zangochap-manager/logistics/collection" className="btn-primary-sm">Tout voir</a>}
        >
          {toCollect.length === 0 ? (
            <EmptyState icon="OK" title="Tout est en stock" description="Aucune collecte necessaire." />
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
                      <span className="size-dot">{item.size}</span>{" "}
                      <strong style={{ fontSize: 11 }}>{item.color}</strong> x {item.qty}
                    </td>
                    <td><strong>{product.supplier?.name || "-"}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableCard>
      </div>
    </>
  );
}

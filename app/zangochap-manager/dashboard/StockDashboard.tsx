import React from "react";
import prisma from "@/lib/prisma";
import { StatCard, TableCard, StatusBadge, SectionLabel, EmptyState } from "@/components/UI";
import { formatPrice, formatDay } from "@/lib/constants";
import Topbar from "@/components/Topbar";
import "./dashboard.css";

export default async function StockDashboard({ user }: { user: any }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const products = await prisma.product.findMany({
    include: { createdBy: true, variants: true, supplier: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalProducts = products.length;
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const oos = products.filter(p => p.stock === 0);
  const low = products.filter(p => p.stock > 0 && p.stock < 5);

  // Personal stats
  const myProducts = products.filter(p => p.createdBy.name === user.name);
  const myProductsToday = myProducts.filter(p => new Date(p.createdAt) >= today);

  return (
    <>
      <Topbar title="Bord" subtitle="stock" />
      <div className="content animate-fade-in">
      <SectionLabel>Mes statistiques personnelles</SectionLabel>
      <div className="stats-grid">
        <StatCard label="Produits ajoutés (jour)" value={myProductsToday.length} trend={`${myProducts.length} au total`} accent />
        <StatCard label="Mes unités gérées" value={myProducts.reduce((s, p) => s + p.stock, 0)} />
      </div>

      <SectionLabel spaced>Vue globale du catalogue</SectionLabel>
      <div className="stats-grid">
        <StatCard label="Produits référencés" value={totalProducts} />
        <StatCard label="Unités en stock" value={totalUnits} />
        <StatCard label="Stock faible" value={low.length} color="var(--amber)" trend="Moins de 5 unités" trendDir="down" />
        <StatCard label="En rupture" value={oos.length} color="var(--red)" />
      </div>

      <TableCard
        title="Catalogue produits"
        actions={<a href="/zangochap-manager/products/new" className="btn-orange">+ Ajouter un produit</a>}
      >
        {products.length === 0 ? (
          <EmptyState icon="📦" title="Aucun produit" description="Commencez par ajouter un produit." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix</th>
                <th>Variations</th>
                <th>Fournisseur</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 8).map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-strong">{p.name}</div>
                    <div className="cell-muted">{p.material || '—'}</div>
                  </td>
                  <td><span className="cell-price">{formatPrice(Number(p.price))}</span></td>
                  <td><span className="cell-muted">{p.variants.length} variante(s)</span></td>
                  <td><span className="cell-muted">{p.supplier?.name || '—'}</span></td>
                  <td>
                    <strong style={{
                      color: p.stock === 0 ? 'var(--red)' : p.stock < 5 ? 'var(--amber)' : 'var(--green)'
                    }}>{p.stock}</strong>
                  </td>
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

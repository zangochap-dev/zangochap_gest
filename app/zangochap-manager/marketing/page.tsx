import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { TableCard } from "@/components/UI";
import { Plus, Copy, Eye, Power, Trash2 } from "lucide-react";

import styles from "./marketing.module.css";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { usages: true }
  });

  return (
    <>
      <Topbar 
        title="Codes" 
        subtitle="promo" 
        actions={
          <button className="btn-orange">
            <Plus size={14} />
            Nouveau code
          </button>
        }
      />

      <div className={`${styles.content} animate-fade-in`}>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statCardAccent}`}>
            <div className={styles.statLabel}>Codes actifs</div>
            <div className={styles.statValue}>{promos.filter(p => p.isActive).length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Utilisations totales</div>
            <div className={styles.statValue}>{promos.reduce((acc, p) => acc + p.usages.length, 0)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Codes désactivés</div>
            <div className={styles.statValue}>{promos.filter(p => !p.isActive).length}</div>
          </div>
        </div>

        <TableCard title="Tous les codes" meta={`${promos.length} code(s)`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type de réduction</th>
                <th>Valeur</th>
                <th>Règle d'usage</th>
                <th>Utilisations</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <div className="empty-icon">🏷️</div>
                      <h4>Aucun code promo</h4>
                      <p>Cliquez sur "Nouveau code" pour en créer un.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                promos.map((p) => (
                  <tr key={p.code}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={styles.cellPromoCode}>{p.code}</span>
                        <button className={styles.iconBtnSm} title="Copier">
                          <Copy size={12} />
                        </button>
                      </div>
                      {p.label && <div className={styles.cellMuted} style={{ marginTop: 4 }}>{p.label}</div>}
                    </td>
                    <td>{p.type}</td>
                    <td>
                      <strong style={{ color: 'var(--orange)' }}>
                        {p.type === 'PERCENT' ? `-${p.value}%` : `-${p.value.toLocaleString()} FCFA`}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontSize: 11 }}>{p.rule.replace(/_/g, ' ')}</span>
                    </td>
                    <td>
                      <strong>{p.usages.length}</strong>
                      {p.maxGlobalUses ? ` / ${p.maxGlobalUses}` : ''}
                    </td>
                    <td>
                      <span className={`status ${p.isActive ? 'delivered' : 'cancelled'}`}>
                        {p.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className={styles.actionBtn} title="Détails">
                          <Eye size={14} />
                        </button>
                        <button className={styles.actionBtn} title={p.isActive ? "Désactiver" : "Activer"}>
                          <Power size={14} />
                        </button>
                        <button className={styles.actionBtn} title="Supprimer" style={{ color: 'var(--red)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableCard>
      </div>
    </>
  );
}

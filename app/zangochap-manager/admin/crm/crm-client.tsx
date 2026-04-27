"use client";

import React, { useState, useMemo, useTransition } from "react";
import { TableCard, EmptyState, StatCard } from "@/components/UI";
import { formatPrice, formatDay } from "@/lib/constants";
import { Search, Trash2, User as UserIcon, Phone, MapPin, ShoppingBag } from "lucide-react";
import { deleteCustomer } from "@/modules/crm/admin_actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

export default function CRMClient({ initialCustomers }: { initialCustomers: any[] }) {
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialCustomers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q) || 
      c.commune?.toLowerCase().includes(q)
    );
  }, [initialCustomers, search]);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement le client "${name}" ?`)) return;
    startTransition(async () => {
      try {
        await deleteCustomer(id);
        showToast('Client supprimé', 'success');
        router.refresh();
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  const totalRevenue = initialCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpent = initialCustomers.length ? Math.round(totalRevenue / initialCustomers.length) : 0;

  return (
    <div className="content animate-fade-in">
      {/* STATS */}
      <div className="stats-grid">
        <StatCard label="Total Clients" value={initialCustomers.length} />
        <StatCard label="Chiffre d'Affaires" value={formatPrice(totalRevenue)} color="var(--orange)" />
        <StatCard label="Panier Moyen Client" value={formatPrice(avgSpent)} />
      </div>

      {/* SEARCH */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-soft)' }} />
        <input
          type="text"
          className="field-input"
          placeholder="Rechercher un client par nom, téléphone, commune..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 44, height: 48, borderRadius: 14 }}
        />
      </div>

      <TableCard title="Annuaire Clients" meta={`${filtered.length} client(s) répertorié(s)`}>
        {filtered.length === 0 ? (
          <EmptyState icon="👥" title="Aucun client trouvé" description="Essayez une autre recherche." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Coordonnées</th>
                <th>Commune</th>
                <th>Commandes</th>
                <th>Total Dépensé</th>
                <th>Dernier Achat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
                        <UserIcon size={16} />
                      </div>
                      <div className="cell-strong">{c.name}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <Phone size={12} className="cell-muted" />
                      {c.phone}
                    </div>
                    {c.phone2 && <div className="cell-muted" style={{ fontSize: 11, marginTop: 2 }}>{c.phone2}</div>}
                  </td>
                  <td>
                    {c.commune ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <MapPin size={12} className="cell-muted" />
                        {c.commune}
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShoppingBag size={12} className="cell-muted" />
                      <strong>{c.totalOrders}</strong>
                    </div>
                  </td>
                  <td><span className="cell-price">{formatPrice(c.totalSpent)}</span></td>
                  <td><span className="cell-muted">{formatDay(c.lastOrderAt)}</span></td>
                  <td>
                    <button className="action-btn" onClick={() => handleDelete(c.id, c.name)} title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}

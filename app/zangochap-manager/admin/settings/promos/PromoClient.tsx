"use client";

import React, { useState, useTransition } from "react";
import { StatCard, EmptyState, TableCard } from "@/components/UI";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Tag, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

// Server actions for promos
async function createPromo(data: any) {
  const res = await fetch('/api/promos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Erreur de création');
  return res.json();
}

async function deletePromo(code: string) {
  const res = await fetch(`/api/promos?code=${code}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur de suppression');
}

async function togglePromo(code: string, isActive: boolean) {
  const res = await fetch('/api/promos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, isActive }) });
  if (!res.ok) throw new Error('Erreur');
}

export default function PromoClient({ promos, user }: { promos: any[]; user: any }) {
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewUsage, setViewUsage] = useState<any>(null);
  const { showToast } = useToast();
  const router = useRouter();

  const active = promos.filter(p => p.isActive);
  const totalUses = promos.reduce((s, p) => s + (p.usages?.length || 0), 0);

  return (
    <div className="content animate-fade-in">
      {/* STATS */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Codes actifs" value={active.length} icon={<Tag size={20} />} accent />
        <StatCard label="Total codes" value={promos.length} icon={<Tag size={20} />} />
        <StatCard label="Utilisations" value={totalUses} icon={<Plus size={20} />} color="var(--green)" />
      </div>

      {/* TABLE */}
      <TableCard
        title="Tous les codes promo"
        meta={`${promos.length} code(s)`}
        actions={
          <button className="btn-orange" onClick={() => setShowNew(true)} style={{ fontSize: 13, padding: '6px 14px' }}>
            <Plus size={14} /> Nouveau code
          </button>
        }
      >
        {promos.length === 0 ? (
          <EmptyState icon="🏷️" title="Aucun code promo" description="Créez votre premier code promo." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Règle</th>
                <th>Min.</th>
                <th>Utilisations</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(p => {
                const typeLabels: Record<string, string> = { PERCENT: 'Pourcentage', FIXED: 'Montant fixe', GIFT: 'Cadeau' };
                return (
                  <tr key={p.code}>
                    <td><span className="cell-mono" style={{ color: 'var(--orange)', fontWeight: 700 }}>{p.code}</span></td>
                    <td><span className="cell-muted">{typeLabels[p.type] || p.type}</span></td>
                    <td>
                      <div className="cell-strong">
                        {p.type === 'PERCENT' ? `${p.value}%` : p.type === 'FIXED' ? `${p.value} FCFA` : p.giftProductId ? '🎁 Cadeau' : '—'}
                      </div>
                    </td>
                    <td><span className="cell-muted">{p.rule === 'UNLIMITED' ? 'Illimité' : p.rule === 'ONCE_PER_PHONE' ? '1×/tél' : '1×/client'}</span></td>
                    <td>{p.minAmount > 0 ? `${p.minAmount} F` : '—'}</td>
                    <td>
                      <div className="cell-strong" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.usages?.length || 0}
                        {p.maxGlobalUses && <span className="cell-muted"> / {p.maxGlobalUses}</span>}
                        <button className="action-btn-sm" onClick={() => setViewUsage(p)} title="Voir les utilisations" style={{ padding: '2px 4px' }}>
                          <Eye size={10} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${p.isActive ? 'active' : 'inactive'}`}>
                        {p.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="icon-btn-standard" title="Modifier" onClick={() => setEditing(p)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="icon-btn-standard delete" title="Supprimer" onClick={() => handleDelete(p.code)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      {showNew && <NewPromoModal onClose={() => setShowNew(false)} />}
      {editing && <NewPromoModal promo={editing} onClose={() => setEditing(null)} />}
      {viewUsage && (
        <Modal isOpen={true} onClose={() => setViewUsage(null)} title={`Utilisations · ${viewUsage.code}`} large>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Réf. Commande</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Date d'usage</th>
                </tr>
              </thead>
              <tbody>
                {viewUsage.usages?.length ? viewUsage.usages.map((u: any) => (
                  <tr key={u.id}>
                    <td><span className="cell-mono">{u.orderRef}</span></td>
                    <td>{u.customerName}</td>
                    <td><span className="cell-price">{formatPrice(u.orderTotal)}</span></td>
                    <td><span className="cell-muted">{formatDate(u.createdAt)}</span></td>
                  </tr>
                )) : <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Aucune utilisation enregistrée.</td></tr>}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .status-pill {
          padding: 3px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 700;
        }
        .status-pill.active { background: #ECFDF5; color: #059669; }
        .status-pill.inactive { background: #FEF2F2; color: #EF4444; }

        .icon-btn-standard {
          width: 30px; height: 30px; border-radius: 6px;
          border: 1px solid var(--line); background: var(--cream);
          color: var(--brown-soft); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
        }
        .icon-btn-standard:hover { background: white; color: var(--orange); border-color: var(--orange); }
        .icon-btn-standard.delete:hover { background: #FEF2F2; color: #EF4444; border-color: #FCA5A5; }
      `}</style>
    </div>
  );

  function handleDelete(code: string) {
    if (!confirm(`Supprimer le code ${code} ?`)) return;
    deletePromo(code).then(() => {
      showToast('Code supprimé', 'success');
      router.refresh();
    });
  }

  function NewPromoModal({ promo, onClose }: { promo?: any; onClose: () => void }) {
    const [code, setCode] = useState(promo?.code || '');
    const [type, setType] = useState(promo?.type || 'PERCENT');
    const [value, setValue] = useState(promo?.value || 0);
    const [rule, setRule] = useState(promo?.rule || 'UNLIMITED');
    const [minAmount, setMinAmount] = useState(promo?.minAmount || 0);
    const [maxGlobalUses, setMaxGlobalUses] = useState<number | null>(promo?.maxGlobalUses || null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      startTransition(async () => {
        try {
          if (promo) {
            await fetch('/api/promos', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: promo.code, type, value, rule, minAmount, maxGlobalUses })
            });
            showToast('Code modifié ✓', 'success');
          } else {
            await createPromo({
              code: code.toUpperCase(),
              type,
              value,
              rule,
              minAmount,
              maxGlobalUses,
              creatorId: user.id,
            });
            showToast('Code promo créé ✓', 'success');
          }
          router.refresh();
          onClose();
        } catch (e: any) {
          showToast(e.message || 'Erreur', 'error');
        }
      });
    };

    return (
      <Modal isOpen={true} onClose={onClose} title={promo ? 'Modifier code promo' : 'Nouveau code promo'}
        footer={
          <>
            <button className="btn-secondary" onClick={onClose}>Annuler</button>
            <button className="btn-orange" onClick={() => (document.getElementById('promoForm') as HTMLFormElement)?.requestSubmit()} disabled={isPending}>
              {promo ? 'Enregistrer' : 'Créer le code'}
            </button>
          </>
        }
      >
        <form id="promoForm" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row span-2">
              <label className="field-label">Code *</label>
              <input className="field-input" value={code} onChange={e => setCode(e.target.value)} required placeholder="Ex. BIENVENUE20" style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }} />
            </div>
            <div className="form-row">
              <label className="field-label">Type de réduction</label>
              <select className="field-input" value={type} onChange={e => setType(e.target.value)}>
                <option value="PERCENT">Pourcentage (%)</option>
                <option value="FIXED">Montant fixe (FCFA)</option>
                <option value="GIFT">Cadeau</option>
              </select>
            </div>
            <div className="form-row">
              <label className="field-label">Valeur</label>
              <input className="field-input" type="number" value={value} onChange={e => setValue(parseInt(e.target.value) || 0)} min={0} />
            </div>
            <div className="form-row">
              <label className="field-label">Règle d'utilisation</label>
              <select className="field-input" value={rule} onChange={e => setRule(e.target.value)}>
                <option value="UNLIMITED">Illimité</option>
                <option value="ONCE_PER_PHONE">1 fois par téléphone</option>
                <option value="ONCE_PER_CUSTOMER">1 fois par client</option>
              </select>
            </div>
            <div className="form-row">
              <label className="field-label">Minimum commande (FCFA)</label>
              <input className="field-input" type="number" value={minAmount} onChange={e => setMinAmount(parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-row span-2">
              <label className="field-label">Max utilisations globales</label>
              <input className="field-input" type="number" value={maxGlobalUses ?? ''} onChange={e => setMaxGlobalUses(e.target.value ? parseInt(e.target.value) : null)} placeholder="Illimité" />
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}

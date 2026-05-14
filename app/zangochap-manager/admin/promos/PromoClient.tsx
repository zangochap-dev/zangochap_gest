"use client";

import React, { useState, useTransition } from "react";
import { StatCard, EmptyState } from "@/components/UI";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import "./promo-client.css";

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
  const { showToast } = useToast();
  const router = useRouter();

  const active = promos.filter(p => p.isActive);
  const totalUses = promos.reduce((s, p) => s + (p.usages?.length || 0), 0);

  return (
    <div className="cfg-page animate-fade-in">
      {/* BREADCRUMB */}
      <div className="cfg-breadcrumb">
        <Link href="/zangochap-manager/admin/settings" className="cfg-back">
          <ArrowLeft size={16} /> Configuration
        </Link>
        <span className="cfg-sep">/</span>
        <span className="cfg-current">Codes Promo</span>
      </div>

      {/* STATS */}
      <div className="promo-stats">
        <StatCard label="Codes actifs" value={active.length} accent />
        <StatCard label="Total codes" value={promos.length} />
        <StatCard label="Utilisations" value={totalUses} />
      </div>

      {/* TABLE */}
      <div className="cfg-panel">
        <div className="panel-title">
          Tous les codes promo
          <span className="panel-count">{promos.length}</span>
          <div style={{ flex: 1 }} />
          <button className="btn-orange" onClick={() => setShowNew(true)} style={{ fontSize: 13, padding: '6px 14px' }}>
            <Plus size={14} /> Nouveau code
          </button>
        </div>
        
        {promos.length === 0 ? (
          <EmptyState icon="🏷️" title="Aucun code promo" description="Créez votre premier code promo." />
        ) : (
          <div className="promo-table-wrap">
            <table className="promo-table">
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
                    <tr key={p.code} className="promo-row">
                      <td><span className="code-tag">{p.code}</span></td>
                      <td><span className="cell-muted">{typeLabels[p.type] || p.type}</span></td>
                      <td>
                        {p.type === 'PERCENT' ? `${p.value}%` : p.type === 'FIXED' ? `${p.value} FCFA` : p.giftProductId ? '🎁 Cadeau' : '—'}
                      </td>
                      <td><span className="cell-muted">{p.rule === 'UNLIMITED' ? 'Illimité' : p.rule === 'ONCE_PER_PHONE' ? '1×/tél' : '1×/client'}</span></td>
                      <td>{p.minAmount > 0 ? `${p.minAmount} F` : '—'}</td>
                      <td>
                        <strong>{p.usages?.length || 0}</strong>
                        {p.maxGlobalUses && <span className="cell-muted"> / {p.maxGlobalUses}</span>}
                      </td>
                      <td>
                        <span className={`status-pill ${p.isActive ? 'active' : 'inactive'}`}>
                          {p.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions-promo">
                          <button className="icon-btn" title="Modifier" onClick={() => setEditing(p)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="icon-btn delete" title="Supprimer" onClick={() => handleDelete(p.code)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && <NewPromoModal onClose={() => setShowNew(false)} />}
      {editing && <NewPromoModal promo={editing} onClose={() => setEditing(null)} />}

      
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

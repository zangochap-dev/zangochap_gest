"use client";

import React, { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, Tag, ArrowLeft, Eye, Calendar, ShoppingCart, Percent, DollarSign, Package, Check, ChevronRight } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/constants";
import { EmptyState, StatCard, TableCard } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import "./promo-client.css";

export default function PromoClient({ 
  promos, 
  user, 
  products = [], 
  categories = [] 
}: { 
  promos: any[]; 
  user: any;
  products?: any[];
  categories?: any[];
}) {
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewUsage, setViewUsage] = useState<any>(null);
  const { showToast } = useToast();
  const router = useRouter();

  const active = promos.filter(p => p.isActive);
  const automatic = promos.filter(p => p.isAutomatic);
  const totalUses = promos.reduce((s, p) => s + (p.usages?.length || 0), 0);

  return (
    <div className="content animate-fade-in" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* STATS HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-[#1A1614] mb-1">Promotions & Remises</h1>
          <p className="text-[13px] text-[#888]">Gérez vos codes promos et remises automatiques.</p>
        </div>
        <button className="btn-orange" onClick={() => setShowNew(true)} style={{ gap: 8, height: 44, padding: '0 24px' }}>
          <Plus size={18} /> Créer une remise
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard label="Codes actifs" value={active.length} icon={<Tag size={20} />} accent />
        <StatCard label="Automatiques" value={automatic.length} icon={<Percent size={20} />} color="#6366f1" />
        <StatCard label="Utilisations" value={totalUses} icon={<ShoppingCart size={20} />} color="var(--green)" />
      </div>

      {/* TABLE */}
      <TableCard
        title="Liste des remises"
        meta={`${promos.length} règle(s) au total`}
      >
        {promos.length === 0 ? (
          <EmptyState icon="🏷️" title="Aucune remise" description="Créez votre première remise pour attirer plus de clients." />
        ) : (
          <div className="overflow-x-auto">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Code / Nom</th>
                  <th>Méthode</th>
                  <th>Type</th>
                  <th>Valeur</th>
                  <th>Conditions</th>
                  <th>Usage</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map(p => {
                  const typeLabels: Record<string, string> = { PERCENT: 'Pourcentage', FIXED: 'Fixe', GIFT: 'Cadeau' };
                  const isExpired = p.endDate && new Date(p.endDate) < new Date();

                  return (
                    <tr key={p.code}>
                      <td>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#1A1614]">{p.code}</span>
                          {p.label && p.label !== p.code && <span className="text-[11px] text-[#888]">{p.label}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`method-pill ${p.isAutomatic ? 'auto' : 'manual'}`}>
                          {p.isAutomatic ? 'Automatique' : 'Manuel'}
                        </span>
                      </td>
                      <td><span className="text-[13px] text-[#666]">{typeLabels[p.type] || p.type}</span></td>
                      <td>
                        <span className="text-[14px] font-semibold text-[#1A1614]">
                          {p.type === 'PERCENT' ? `${p.value}%` : p.type === 'FIXED' ? `${p.value} F` : '🎁'}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] text-[#666]">Min: {p.minAmount > 0 ? `${p.minAmount} F` : '0 F'}</span>
                          {p.minQuantity > 0 && <span className="text-[11px] text-[#888]">{p.minQuantity} article(s) min.</span>}
                          {(p.products?.length > 0 || p.categories?.length > 0) && (
                            <span className="text-[11px] text-orange-600 font-medium">Ciblé 🎯</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold">{p.usages?.length || 0}</span>
                          {p.maxGlobalUses && <span className="text-[11px] text-[#bbb]">/ {p.maxGlobalUses}</span>}
                          <button className="action-btn-ghost" onClick={() => setViewUsage(p)}>
                            <Eye size={12} />
                          </button>
                        </div>
                      </td>
                      <td>
                        {isExpired ? (
                          <span className="status-pill-expired">Expiré</span>
                        ) : (
                          <span className={`status-pill ${p.isActive ? 'active' : 'inactive'}`}>
                            {p.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-2 justify-end">
                          <button className="action-btn-standard" onClick={() => setEditing(p)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="action-btn-standard delete" onClick={() => handleDelete(p.code)}>
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
      </TableCard>

      {showNew && <NewPromoModal products={products} categories={categories} user={user} onClose={() => setShowNew(false)} />}
      {editing && <NewPromoModal promo={editing} products={products} categories={categories} user={user} onClose={() => setEditing(null)} />}

      {viewUsage && (
        <Modal isOpen={true} onClose={() => setViewUsage(null)} title={`Utilisations : ${viewUsage.code}`} large>
          <div className="p-2">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {viewUsage.usages?.length ? viewUsage.usages.map((u: any) => (
                  <tr key={u.id}>
                    <td><span className="font-mono text-[13px]">{u.orderRef}</span></td>
                    <td className="text-[13px]">{u.customerName}</td>
                    <td className="font-bold text-[13px]">{formatPrice(u.orderTotal)}</td>
                    <td className="text-[12px] text-[#888]">{formatDate(u.createdAt)}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="text-center py-8 text-[#999]">Aucune utilisation.</td></tr>}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      
    </div>
  );

  function handleDelete(code: string) {
    if (!confirm(`Supprimer la règle "${code}" ?`)) return;
    fetch(`/api/promos?code=${code}`, { method: 'DELETE' })
      .then(() => {
        showToast('Remise supprimée', 'success');
        router.refresh();
      });
  }
}

function NewPromoModal({ promo, products, categories, user, onClose }: { promo?: any; products: any[]; categories: any[]; user: any; onClose: () => void }) {
  const [code, setCode] = useState(promo?.code || '');
  const [label, setLabel] = useState(promo?.label || '');
  const [isAutomatic, setIsAutomatic] = useState(promo?.isAutomatic || false);
  const [type, setType] = useState(promo?.type || 'PERCENT');
  const [value, setValue] = useState(promo?.value || 0);
  const [rule, setRule] = useState(promo?.rule || 'UNLIMITED');
  const [minAmount, setMinAmount] = useState(promo?.minAmount || 0);
  const [minQuantity, setMinQuantity] = useState(promo?.minQuantity || 0);
  const [maxGlobalUses, setMaxGlobalUses] = useState<number | null>(promo?.maxGlobalUses || null);
  const [startDate, setStartDate] = useState(promo?.startDate ? promo.startDate.split('T')[0] : '');
  const [endDate, setEndDate] = useState(promo?.endDate ? promo.endDate.split('T')[0] : '');

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(promo?.products?.map((p: any) => p.id) || []);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(promo?.categories?.map((c: any) => c.id) || []);

  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          code: code.toUpperCase().trim(),
          label,
          isAutomatic,
          type,
          value,
          rule,
          minAmount,
          minQuantity,
          maxGlobalUses,
          startDate: startDate || null,
          endDate: endDate || null,
          productIds: selectedProductIds,
          categoryIds: selectedCategoryIds,
          creatorId: user.id
        };

        const res = await fetch('/api/promos', {
          method: promo ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Erreur lors de l\'enregistrement');

        showToast(promo ? 'Remise modifiée ✓' : 'Remise créée ✓', 'success');
        router.refresh();
        onClose();
      } catch (e: any) {
        showToast(e.message, 'error');
      }
    });
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={promo ? 'Modifier la remise' : 'Créer une nouvelle remise'} large
      footer={
        <div className="flex gap-3 justify-end w-full">
          <button className="btn-secondary" onClick={onClose} style={{ height: 44, padding: '0 24px' }}>Annuler</button>
          <button className="btn-orange" onClick={() => (document.getElementById('promoForm') as HTMLFormElement)?.requestSubmit()} disabled={isPending} style={{ height: 44, padding: '0 32px' }}>
            {isPending ? 'Enregistrement...' : promo ? 'Enregistrer les modifications' : 'Créer la remise'}
          </button>
        </div>
      }
    >
      <form id="promoForm" onSubmit={handleSubmit} className="p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* SECTION 1: CONFIGURATION GÉNÉRALE */}
          <div className="space-y-6">
            <div className="p-6 bg-[#FAFAF9] rounded-xl border border-[#F1F1EF] space-y-5">
              <h3 className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-2 text-[#1A1614]">
                <Tag size={16} /> Configuration Générale
              </h3>

              <div className="flex items-center justify-between p-3 bg-white border border-[#F1F1EF] rounded-lg">
                <div>
                  <p className="text-[13px] font-bold text-[#1A1614]">Appliquer automatiquement</p>
                  <p className="text-[11px] text-[#888]">Aucun code requis à la caisse.</p>
                </div>
                <input type="checkbox" checked={isAutomatic} onChange={e => setIsAutomatic(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--orange)' }} />
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#888] tracking-widest">{isAutomatic ? 'Titre de la remise' : 'Code promo *'}</label>
                  <input
                    className="field-input"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    required
                    placeholder={isAutomatic ? "Ex: Soldes d'été" : "Ex: SOLDES20"}
                    style={{ textTransform: isAutomatic ? 'none' : 'uppercase', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
                  />
                </div>
                {!isAutomatic && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase text-[#888] tracking-widest">Description (optionnel)</label>
                    <input className="field-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Pour votre usage interne" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-[#FAFAF9] rounded-xl border border-[#F1F1EF] space-y-5">
              <h3 className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-2 text-[#1A1614]">
                <DollarSign size={16} /> Valeur de la remise
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#888]">Type</label>
                  <select className="field-input" value={type} onChange={e => setType(e.target.value)}>
                    <option value="PERCENT">Pourcentage (%)</option>
                    <option value="FIXED">Montant fixe (F)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#888]">Valeur</label>
                  <input className="field-input" type="number" value={value} onChange={e => setValue(parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#FAFAF9] rounded-xl border border-[#F1F1EF] space-y-5">
              <h3 className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-2 text-[#1A1614]">
                <Calendar size={16} /> Période de validité
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#888]">Date de début</label>
                  <input className="field-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#888]">Date de fin (optionnel)</label>
                  <input className="field-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CIBLAGE ET CONDITIONS */}
          <div className="space-y-6">
            <div className="p-6 bg-[#FAFAF9] rounded-xl border border-[#F1F1EF] space-y-5">
              <h3 className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-2 text-[#1A1614]">
                <Package size={16} /> Ciblage des produits
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#888] uppercase">Appliquer à des catégories spécifiques</label>
                  <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-2 border border-[#eee] bg-white rounded-lg">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${selectedCategoryIds.includes(cat.id) ? 'bg-[#1A1614] text-white border-[#1A1614]' : 'bg-white text-[#1A1614] border-[#eee]'}`}
                      >
                        {cat.name} {selectedCategoryIds.includes(cat.id) && <Check size={10} style={{ display: 'inline', marginLeft: 4 }} />}
                      </button>
                    ))}
                    {categories.length === 0 && <span className="text-[11px] text-[#ccc]">Aucune catégorie.</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#888] uppercase">Appliquer à des produits spécifiques</label>
                  <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto p-2 border border-[#eee] bg-white rounded-lg">
                    {products.map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => toggleProduct(prod.id)}
                        className={`flex items-center justify-between p-2 rounded text-left transition-all ${selectedProductIds.includes(prod.id) ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50'}`}
                      >
                        <span className="text-[12px]">{prod.emoji} {prod.name}</span>
                        {selectedProductIds.includes(prod.id) && <Check size={14} />}
                      </button>
                    ))}
                    <p className="text-[10px] text-[#aaa] mt-1 italic">Si rien n'est sélectionné, la remise s'applique à tout le catalogue.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#FAFAF9] rounded-xl border border-[#F1F1EF] space-y-5">
              <h3 className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-2 text-[#1A1614]">
                <ShoppingCart size={16} /> Conditions d'utilisation
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#888]">Montant min. (F)</label>
                  <input className="field-input" type="number" value={minAmount} onChange={e => setMinAmount(parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#888]">Quantité min.</label>
                  <input className="field-input" type="number" value={minQuantity} onChange={e => setMinQuantity(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              {!isAutomatic && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase text-[#888]">Règle par utilisateur</label>
                  <select className="field-input" value={rule} onChange={e => setRule(e.target.value)}>
                    <option value="UNLIMITED">Illimité</option>
                    <option value="ONCE_PER_PHONE">Une fois par téléphone</option>
                    <option value="ONCE_PER_CUSTOMER">Une fois par client</option>
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase text-[#888]">Nombre d'utilisations totales max.</label>
                <input className="field-input" type="number" value={maxGlobalUses ?? ''} onChange={e => setMaxGlobalUses(e.target.value ? parseInt(e.target.value) : null)} placeholder="Illimité" />
              </div>
            </div>
          </div>
        </div>
      </form>
      
    </Modal>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import { MapPin, Edit2, Trash2 } from "lucide-react";
import { createCommune, updateCommune, deleteCommune } from "@/modules/settings/actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/constants";

export default function CommunesClient({ communes }: { communes: any[] }) {
  const [isEditing, setIsEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [fee, setFee] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSave = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        if (isEditing) {
          await updateCommune(isEditing.id, name, fee);
          showToast("Commune mise à jour", "success");
        } else {
          await createCommune(name, fee);
          showToast("Commune ajoutée", "success");
        }
        setName("");
        setFee(0);
        setIsEditing(null);
        router.refresh();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
  };

  return (
    <div className="settings-content">
      <div className="sc-header">
        <h2>Communes & Livraison</h2>
        <p>Gérez les zones de livraison et les tarifs par commune.</p>
      </div>

      <div className="sc-layout">
        {/* FORM */}
        <div className="sc-panel">
          <div className="sp-title">{isEditing ? "Modifier la zone" : "Ajouter une zone"}</div>
          <div className="sp-body">
            <div className="form-row">
              <label className="field-label">Nom de la commune</label>
              <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Cocody Angré" />
            </div>
            <div className="form-row" style={{ marginTop: 14 }}>
              <label className="field-label">Frais de livraison (FCFA)</label>
              <input type="number" className="field-input" value={fee} onChange={e => setFee(parseInt(e.target.value) || 0)} />
            </div>
            <div className="sp-actions">
              <button className="btn-orange" onClick={handleSave} disabled={isPending || !name.trim()}>
                {isPending ? "..." : isEditing ? "Sauvegarder" : "Ajouter"}
              </button>
              {isEditing && (
                <button className="btn-secondary" onClick={() => { setIsEditing(null); setName(""); setFee(0); }}>Annuler</button>
              )}
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="sc-panel">
          <div className="sp-title">Zones enregistrées <span className="sp-count">{communes.length}</span></div>
          <div>
            {communes.length === 0 ? (
              <div className="sp-empty">Aucune zone configurée.</div>
            ) : (
              communes.map(c => (
                <div key={c.id} className="sp-row">
                  <div className="sp-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                    <MapPin size={14} />
                  </div>
                  <div className="sp-info">
                    <div className="sp-name">{c.name}</div>
                    <div className="sp-meta">Livraison : <strong>{formatPrice(c.deliveryFee)}</strong></div>
                  </div>
                  <div className="sp-row-actions">
                    <button className="sp-btn" onClick={() => { setIsEditing(c); setName(c.name); setFee(c.deliveryFee); }}>
                      <Edit2 size={13} />
                    </button>
                    <button className="sp-btn del" onClick={() => { if(confirm("Supprimer ?")) deleteCommune(c.id).then(() => router.refresh()); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

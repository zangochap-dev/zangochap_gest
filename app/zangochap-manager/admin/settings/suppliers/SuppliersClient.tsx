"use client";

import React, { useState, useTransition } from "react";
import { Store, Edit2, Trash2 } from "lucide-react";
import { createSupplier, updateSupplier, deleteSupplier } from "@/modules/settings/actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

export default function SuppliersClient({ suppliers }: { suppliers: any[] }) {
  const [isEditing, setIsEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSave = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        if (isEditing) {
          await updateSupplier(isEditing.id, name, contact);
          showToast("Fournisseur mis à jour", "success");
        } else {
          await createSupplier(name, contact);
          showToast("Fournisseur ajouté", "success");
        }
        setName("");
        setContact("");
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
        <h2>Fournisseurs</h2>
        <p>Gérez vos sources d'approvisionnement et leurs contacts.</p>
      </div>

      <div className="sc-layout">
        {/* FORM */}
        <div className="sc-panel">
          <div className="sp-title">{isEditing ? "Modifier" : "Nouveau fournisseur"}</div>
          <div className="sp-body">
            <div className="form-row">
              <label className="field-label">Nom de l'entreprise</label>
              <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Grossiste Paris" />
            </div>
            <div className="form-row" style={{ marginTop: 14 }}>
              <label className="field-label">Contact / Notes</label>
              <input className="field-input" value={contact} onChange={e => setContact(e.target.value)} placeholder="Téléphone, email ou adresse" />
            </div>
            <div className="sp-actions">
              <button className="btn-orange" onClick={handleSave} disabled={isPending || !name.trim()}>
                {isPending ? "..." : isEditing ? "Sauvegarder" : "Enregistrer"}
              </button>
              {isEditing && (
                <button className="btn-secondary" onClick={() => { setIsEditing(null); setName(""); setContact(""); }}>Annuler</button>
              )}
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="sc-panel">
          <div className="sp-title">Fournisseurs actifs <span className="sp-count">{suppliers.length}</span></div>
          <div>
            {suppliers.length === 0 ? (
              <div className="sp-empty">Aucun fournisseur enregistré.</div>
            ) : (
              suppliers.map(s => (
                <div key={s.id} className="sp-row">
                  <div className="sp-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <Store size={14} />
                  </div>
                  <div className="sp-info">
                    <div className="sp-name">{s.name}</div>
                    <div className="sp-meta">{s.contact || "Pas de contact"} · <strong>{s._count.products}</strong> produit(s)</div>
                  </div>
                  <div className="sp-row-actions">
                    <button className="sp-btn" onClick={() => { setIsEditing(s); setName(s.name); setContact(s.contact || ""); }}>
                      <Edit2 size={13} />
                    </button>
                    <button className="sp-btn del" onClick={() => { if(confirm("Supprimer ?")) deleteSupplier(s.id).then(() => router.refresh()); }}>
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

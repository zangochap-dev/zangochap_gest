"use client";

import React, { useState, useTransition } from "react";
import { Edit2, Trash2, Tag } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/modules/settings/actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

export default function CategoriesClient({ categories }: { categories: any[] }) {
  const [isEditing, setIsEditing] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSave = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      try {
        if (isEditing) {
          await updateCategory(isEditing.id, newName);
          showToast("Catégorie mise à jour", "success");
        } else {
          await createCategory(newName);
          showToast("Catégorie créée", "success");
        }
        setNewName("");
        setIsEditing(null);
        router.refresh();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
        showToast("Catégorie supprimée", "success");
        router.refresh();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
  };

  return (
    <div className="settings-content">
      <div className="sc-header">
        <h2>Catégories</h2>
        <p>Organisez votre catalogue par thématiques.</p>
      </div>

      <div className="sc-layout">
        {/* FORM */}
        <div className="sc-panel">
          <div className="sp-title">{isEditing ? "Modifier" : "Ajouter une catégorie"}</div>
          <div className="sp-body">
            <label className="field-label">Nom</label>
            <input
              className="field-input"
              placeholder="Ex: Chaussures, Robes..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <div className="sp-actions">
              <button className="btn-orange" onClick={handleSave} disabled={isPending || !newName.trim()}>
                {isPending ? "..." : isEditing ? "Mettre à jour" : "Ajouter"}
              </button>
              {isEditing && (
                <button className="btn-secondary" onClick={() => { setIsEditing(null); setNewName(""); }}>
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="sc-panel">
          <div className="sp-title">Liste <span className="sp-count">{categories.length}</span></div>
          <div>
            {categories.length === 0 ? (
              <div className="sp-empty">Aucune catégorie définie.</div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="sp-row">
                  <div className="sp-icon"><Tag size={14} /></div>
                  <div className="sp-info">
                    <div className="sp-name">{cat.name}</div>
                    <div className="sp-meta">{cat._count.products} produit(s)</div>
                  </div>
                  <div className="sp-row-actions">
                    <button className="sp-btn" onClick={() => { setIsEditing(cat); setNewName(cat.name); }}>
                      <Edit2 size={13} />
                    </button>
                    <button className="sp-btn del" onClick={() => handleDelete(cat.id)}>
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

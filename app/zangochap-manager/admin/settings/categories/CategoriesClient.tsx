"use client";

import React, { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Edit2, Plus, Trash2 } from "lucide-react";
import { createCategory, updateCategory, deleteCategory, createSubCategory, updateSubCategory, deleteSubCategory } from "@/modules/settings/actions";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

type SubCategoryOption = {
  id: string;
  name: string;
  _count?: { products: number } | null;
};

type CategoryOption = {
  id: string;
  name: string;
  _count?: { products: number } | null;
  subCategories?: SubCategoryOption[];
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur";
}

export default function CategoriesClient({ categories }: { categories: CategoryOption[] }) {
  const [isEditingCat, setIsEditingCat] = useState<CategoryOption | null>(null);
  const [newCatName, setNewCatName] = useState("");

  const [isEditingSubCat, setIsEditingSubCat] = useState<SubCategoryOption | null>(null);
  const [newSubCatName, setNewSubCatName] = useState("");
  const [addingSubCatTo, setAddingSubCatTo] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const toggleCat = (id: string) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveCategory = () => {
    if (!newCatName.trim()) return;
    startTransition(async () => {
      try {
        if (isEditingCat) {
          await updateCategory(isEditingCat.id, newCatName);
          showToast("Catégorie mise à jour", "success");
        } else {
          await createCategory(newCatName);
          showToast("Catégorie créée", "success");
        }
        setNewCatName("");
        setIsEditingCat(null);
        router.refresh();
      } catch (error: unknown) {
        showToast(errorMessage(error), "error");
      }
    });
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm("Supprimer cette catégorie et toutes ses sous-catégories ?")) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
        showToast("Catégorie supprimée", "success");
        router.refresh();
      } catch (error: unknown) {
        showToast(errorMessage(error), "error");
      }
    });
  };

  const handleSaveSubCategory = () => {
    if (!newSubCatName.trim()) return;
    startTransition(async () => {
      try {
        if (isEditingSubCat) {
          await updateSubCategory(isEditingSubCat.id, newSubCatName);
          showToast("Sous-catégorie mise à jour", "success");
        } else if (addingSubCatTo) {
          await createSubCategory(addingSubCatTo, newSubCatName);
          showToast("Sous-catégorie créée", "success");
        }
        setNewSubCatName("");
        setIsEditingSubCat(null);
        setAddingSubCatTo(null);
        router.refresh();
      } catch (error: unknown) {
        showToast(errorMessage(error), "error");
      }
    });
  };

  const handleDeleteSubCategory = (id: string) => {
    if (!confirm("Supprimer cette sous-catégorie ?")) return;
    startTransition(async () => {
      try {
        await deleteSubCategory(id);
        showToast("Sous-catégorie supprimée", "success");
        router.refresh();
      } catch (error: unknown) {
        showToast(errorMessage(error), "error");
      }
    });
  };

  return (
    <div className="settings-content">
      <div className="sc-header">
        <h2>Catégories & Sous-catégories</h2>
        <p>Organisez votre catalogue par thématiques.</p>
      </div>

      <div className="sc-layout settings-categories-layout">
        {/* FORM CATEGORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="sc-panel">
            <div className="sp-title">{isEditingCat ? "Modifier la catégorie" : "Ajouter une catégorie"}</div>
            <div className="sp-body">
              <label className="field-label">Nom</label>
              <input
                className="field-input"
                placeholder="Ex: Chaussures..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveCategory()}
              />
              <div className="sp-actions">
                <button className="btn-orange" onClick={handleSaveCategory} disabled={isPending || !newCatName.trim()}>
                  {isPending ? "..." : isEditingCat ? "Mettre à jour" : "Ajouter"}
                </button>
                {isEditingCat && (
                  <button className="btn-secondary" onClick={() => { setIsEditingCat(null); setNewCatName(""); }}>
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* FORM SUB-CATEGORY */}
          {(addingSubCatTo || isEditingSubCat) && (
            <div className="sc-panel" style={{ borderLeft: '4px solid var(--zangochap)' }}>
              <div className="sp-title">{isEditingSubCat ? "Modifier la sous-catégorie" : "Ajouter une sous-catégorie"}</div>
              <div className="sp-body">
                {!isEditingSubCat && (
                  <div style={{ fontSize: 12, color: 'var(--brown-soft)', marginBottom: 10 }}>
                    Dans la catégorie : <b>{categories.find(c => c.id === addingSubCatTo)?.name}</b>
                  </div>
                )}
                <label className="field-label">Nom</label>
                <input
                  className="field-input"
                  placeholder="Ex: Baskets, Talons..."
                  value={newSubCatName}
                  onChange={e => setNewSubCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveSubCategory()}
                />
                <div className="sp-actions">
                  <button className="btn-orange" onClick={handleSaveSubCategory} disabled={isPending || !newSubCatName.trim()}>
                    {isPending ? "..." : isEditingSubCat ? "Mettre à jour" : "Ajouter"}
                  </button>
                  <button className="btn-secondary" onClick={() => { setIsEditingSubCat(null); setAddingSubCatTo(null); setNewSubCatName(""); }}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LIST */}
        <div className="sc-panel">
          <div className="sp-title">Liste <span className="sp-count">{categories.length}</span></div>
          <div>
            {categories.length === 0 ? (
              <div className="sp-empty">Aucune catégorie définie.</div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} style={{ marginBottom: 10, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <div className="sp-row" style={{ borderBottom: expandedCats[cat.id] ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}>
                    <div className="sp-icon" onClick={() => toggleCat(cat.id)} style={{ cursor: 'pointer' }}>
                      {expandedCats[cat.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    <div className="sp-info" onClick={() => toggleCat(cat.id)} style={{ cursor: 'pointer' }}>
                      <div className="sp-name">{cat.name}</div>
                      <div className="sp-meta">{cat._count?.products || 0} produit(s) • {cat.subCategories?.length || 0} sous-catégorie(s)</div>
                    </div>
                    <div className="sp-row-actions">
                      <button className="sp-btn" title="Ajouter une sous-catégorie" onClick={() => { setAddingSubCatTo(cat.id); setIsEditingSubCat(null); setNewSubCatName(""); if (!expandedCats[cat.id]) toggleCat(cat.id); }}>
                        <Plus size={13} />
                      </button>
                      <button className="sp-btn" onClick={() => { setIsEditingCat(cat); setNewCatName(cat.name); }}>
                        <Edit2 size={13} />
                      </button>
                      <button className="sp-btn del" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {expandedCats[cat.id] && (
                    <div style={{ padding: '10px 20px', background: '#fafafa' }}>
                      {cat.subCategories?.length === 0 ? (
                        <div style={{ fontSize: 13, color: 'var(--brown-soft)', fontStyle: 'italic' }}>Aucune sous-catégorie</div>
                      ) : (
                        cat.subCategories?.map((subCat) => (
                          <div key={subCat.id} className="sp-row" style={{ padding: '8px 12px', marginBottom: 5, background: 'white', borderRadius: 6, border: '1px solid var(--border)' }}>
                            <div className="sp-icon" style={{ opacity: 0.5 }}><ChevronRight size={12} /></div>
                            <div className="sp-info">
                              <div className="sp-name" style={{ fontSize: 13 }}>{subCat.name}</div>
                              <div className="sp-meta">{subCat._count?.products || 0} produit(s)</div>
                            </div>
                            <div className="sp-row-actions">
                              <button className="sp-btn" onClick={() => { setIsEditingSubCat(subCat); setAddingSubCatTo(null); setNewSubCatName(subCat.name); }}>
                                <Edit2 size={13} />
                              </button>
                              <button className="sp-btn del" onClick={() => handleDeleteSubCategory(subCat.id)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useTransition, useRef } from "react";
import { TableCard } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { createProduct } from "@/modules/products/actions";
import { CATEGORIES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { X, RefreshCcw, Save, Sparkles, Warehouse } from "lucide-react";
import Topbar from "@/components/Topbar";

export default function NewProductClient({ warehouses }: { warehouses: any[] }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();
  const imgInputRef = useRef<HTMLInputElement>(null);

  // -- States --
  const [images, setImages] = useState<Array<{ name: string; dataUrl: string }>>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('shoes');
  const [price, setPrice] = useState<number>(0);
  const [oldPrice, setOldPrice] = useState<number | null>(null);
  const [material, setMaterial] = useState('');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('');
  const [supplier, setSupplier] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.id || '');
  
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  
  const [variants, setVariants] = useState<Array<{ size: string; color: string; stock: number; location: string }>>([]);
  const [isUnpublished, setIsUnpublished] = useState(false);

  // -- Handlers --
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setImages(prev => [...prev, { name: file.name, dataUrl: ev.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const setMainImage = (idx: number) => {
    const newImgs = [...images];
    const [img] = newImgs.splice(idx, 1);
    newImgs.unshift(img);
    setImages(newImgs);
  };

  const addSize = () => {
    const v = sizeInput.trim();
    if (!v) return;
    const vals = v.split(',').map(s => s.trim()).filter(Boolean);
    const newSizes = [...sizes];
    vals.forEach(val => { if (!newSizes.includes(val)) newSizes.push(val); });
    setSizes(newSizes);
    setSizeInput('');
  };

  const addColor = () => {
    const v = colorInput.trim();
    if (!v) return;
    const vals = v.split(',').map(c => c.trim()).filter(Boolean);
    const newColors = [...colors];
    vals.forEach(val => { if (!newColors.includes(val)) newColors.push(val); });
    setColors(newColors);
    setColorInput('');
  };

  const generateAllVariants = () => {
    if (!sizes.length || !colors.length) {
      showToast('Ajoute au moins 1 taille et 1 couleur', 'error');
      return;
    }
    const existing = new Set(variants.map(v => `${v.size}|${v.color}`));
    const newVariants = [...variants];
    sizes.forEach(s => {
      colors.forEach(c => {
        if (!existing.has(`${s}|${c}`)) {
          newVariants.push({ size: s, color: c, stock: 0, location: '' });
        }
      });
    });
    setVariants(newVariants);
    showToast(`${newVariants.length} variantes générées`, 'success');
  };

  const updateVariant = (idx: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[idx] = { 
      ...newVariants[idx], 
      [field]: field === 'stock' ? (parseInt(value) || 0) : value 
    };
    setVariants(newVariants);
  };

  const removeVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0) {
      showToast("Nom et prix requis", "error");
      return;
    }

    startTransition(async () => {
      try {
        let finalVariants = [...variants];
        if (finalVariants.length === 0) {
          finalVariants = [{ size: 'Standard', color: 'Standard', stock: 0, location: '' }];
        }

        await createProduct({
          name,
          category,
          price,
          oldPrice,
          description,
          material,
          origin,
          supplier: supplier || 'Non spécifié',
          isPublished: !isUnpublished,
          variants: finalVariants,
          images: images.length > 0 ? images : undefined,
          emoji: "📦",
          warehouseId: selectedWarehouse
        });

        showToast("Produit ajouté avec succès ✓", "success");
        router.push("/zangochap-manager/products");
      } catch (err: any) {
        showToast(err.message || "Erreur lors de l'ajout", "error");
      }
    });
  };

  return (
    <div style={{ background: '#F8F5F2', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar 
        title="Ajouter un" 
        subtitle="produit"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
             <button className="btn-secondary" onClick={() => router.back()}>Annuler</button>
             <button className="btn-orange" onClick={handleSubmit} disabled={isPending}>
                {isPending ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer
             </button>
          </div>
        }
      />

      <div className="content animate-fade-in" style={{ flex: 1, padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* 1. IMAGES */}
          <TableCard title="1. Images du produit" meta="La première image sera l'image principale">
            <div style={{ padding: 20 }}>
              <div 
                onClick={() => imgInputRef.current?.click()}
                style={{ 
                  border: '2px dashed var(--line)', 
                  borderRadius: 16, 
                  padding: '40px 20px', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  background: 'var(--cream)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--orange)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>Cliquer pour ajouter des images</div>
                <div style={{ color: 'var(--brown-soft)', fontSize: 12, marginTop: 6 }}>JPG, PNG, WebP — plusieurs fichiers acceptés</div>
              </div>
              <input 
                type="file" 
                ref={imgInputRef}
                multiple 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageUpload} 
              />

              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginTop: 20 }}>
                  {images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `2px solid ${idx === 0 ? 'var(--orange)' : 'var(--line)'}`, aspectRatio: '1/1' }}>
                      <img src={img.dataUrl} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {idx === 0 ? (
                        <div style={{ position: 'absolute', top: 6, left: 6, background: 'var(--orange)', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                          Principale
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setMainImage(idx)}
                          style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(255,255,255,0.9)', border: 'none', padding: '4px', borderRadius: 6, cursor: 'pointer' }}
                        >
                          <Sparkles size={12} color="var(--orange)" />
                        </button>
                      )}

                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(199,62,29,0.9)', color: 'white', border: 'none', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TableCard>

          {/* 2. INFORMATIONS PRINCIPALES */}
          <TableCard title="2. Informations principales">
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="field-label">Nom du produit *</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Ex. Sneakers cuir blanches"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Catégorie</label>
                  <select className="field-input" value={category} onChange={e => setCategory(e.target.value)}>
                    {Object.entries(CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">Prix standard (FCFA) *</label>
                  <input 
                    type="number" 
                    className="field-input" 
                    value={price || ''} 
                    onChange={e => setPrice(parseInt(e.target.value) || 0)} 
                    placeholder="12000"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Prix promo</label>
                  <input 
                    type="number" 
                    className="field-input" 
                    value={oldPrice || ''} 
                    onChange={e => setOldPrice(parseInt(e.target.value) || null)} 
                    placeholder="Laissé vide si pas de promo"
                  />
                </div>
                <div>
                  <label className="field-label">Matière</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={material} 
                    onChange={e => setMaterial(e.target.value)} 
                    placeholder="Ex. Cuir véritable"
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="field-label">Description</label>
                  <textarea 
                    className="field-input" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Description courte du produit..."
                    style={{ minHeight: 80, padding: '12px' }}
                  />
                </div>
                <div>
                  <label className="field-label">Provenance</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={origin} 
                    onChange={e => setOrigin(e.target.value)} 
                    placeholder="Ex. Adjamé"
                  />
                </div>
                <div>
                  <label className="field-label">Fournisseur</label>
                  <input 
                    type="text" 
                    className="field-input" 
                    value={supplier} 
                    onChange={e => setSupplier(e.target.value)} 
                    placeholder="Ex. Adjamé Mode"
                  />
                </div>
              </div>
            </div>
          </TableCard>

          {/* 3. TAILLES & COULEURS */}
          <TableCard title="3. Tailles & couleurs" meta="Optionnel — pour les produits qui ont des variantes">
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <label className="field-label">Tailles disponibles</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      className="field-input" 
                      value={sizeInput} 
                      onChange={e => setSizeInput(e.target.value)} 
                      placeholder="Ex. 39, 40, M, L..."
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())}
                    />
                    <button type="button" className="btn-secondary" onClick={addSize} style={{ padding: '0 15px' }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {sizes.map(s => (
                      <span key={s} style={{ background: 'var(--ink)', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {s}
                        <X size={12} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => setSizes(sizes.filter(x => x !== s))} />
                      </span>
                    ))}
                    {sizes.length === 0 && <span style={{ color: 'var(--brown-soft)', fontSize: 12 }}>Aucune taille ajoutée</span>}
                  </div>
                </div>
                <div>
                  <label className="field-label">Couleurs disponibles</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      className="field-input" 
                      value={colorInput} 
                      onChange={e => setColorInput(e.target.value)} 
                      placeholder="Ex. Noir, Rouge bordeaux..."
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor())}
                    />
                    <button type="button" className="btn-secondary" onClick={addColor} style={{ padding: '0 15px' }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {colors.map(c => (
                      <span key={c} style={{ background: 'var(--cream)', color: 'var(--ink)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c}
                        <X size={12} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => setColors(colors.filter(x => x !== c))} />
                      </span>
                    ))}
                    {colors.length === 0 && <span style={{ color: 'var(--brown-soft)', fontSize: 12 }}>Aucune couleur ajoutée</span>}
                  </div>
                </div>
              </div>
            </div>
          </TableCard>

          {/* 4. ENTREPÔT DE STOCKAGE */}
          <TableCard title="4. Entrepôt de stockage" meta="Lieu où sera enregistré le stock initial">
             <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--cream)', padding: 16, borderRadius: 12, border: '1.5px solid var(--line)' }}>
                   <div style={{ background: 'var(--orange-soft)', color: 'var(--orange)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Warehouse size={20} />
                   </div>
                   <div style={{ flex: 1 }}>
                      <label className="field-label" style={{ marginBottom: 4 }}>Choisir l'entrepôt</label>
                      <select 
                        className="field-input" 
                        value={selectedWarehouse} 
                        onChange={e => setSelectedWarehouse(e.target.value)}
                        style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 700, fontSize: 15 }}
                      >
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name} {w.location ? `(${w.location})` : ''}</option>
                        ))}
                      </select>
                   </div>
                </div>
             </div>
          </TableCard>

          {/* 5. VARIANTES */}
          <TableCard 
            title="5. Variantes : quantité & emplacement" 
            meta="Pour chaque combinaison taille × couleur, indique le stock et l'emplacement"
            actions={
              <button type="button" className="btn-secondary" onClick={generateAllVariants} style={{ fontSize: 11 }}>
                <RefreshCcw size={14} />
                Générer les combinaisons
              </button>
            }
          >
            {variants.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <h4 style={{ fontWeight: 700, color: 'var(--ink)' }}>Aucune variante</h4>
                <p style={{ color: 'var(--brown-soft)', fontSize: 13, maxWidth: 300, margin: '8px auto' }}>
                  Ajoutez des tailles et couleurs, puis cliquez sur <strong>"Générer les combinaisons"</strong>.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', color: 'var(--brown-soft)' }}>Taille</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', color: 'var(--brown-soft)' }}>Couleur</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, textTransform: 'uppercase', color: 'var(--brown-soft)' }}>Stock</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', color: 'var(--brown-soft)' }}>Emplacement</th>
                      <th style={{ padding: '12px 16px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: 'var(--cream)', color: 'var(--ink)', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 800 }}>{v.size}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{v.color}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input 
                            type="number" 
                            className="field-input" 
                            style={{ width: 80, textAlign: 'center', height: 36, fontSize: 13, fontWeight: 700 }}
                            value={v.stock} 
                            onChange={e => updateVariant(idx, 'stock', e.target.value)} 
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <input 
                            type="text" 
                            className="field-input" 
                            style={{ height: 36, fontSize: 13, fontFamily: 'monospace' }}
                            placeholder="Ex. A1-03"
                            value={v.location} 
                            onChange={e => updateVariant(idx, 'location', e.target.value)} 
                          />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button 
                            type="button" 
                            className="action-btn" 
                            onClick={() => removeVariant(idx)}
                            style={{ background: 'var(--red-soft)', color: 'var(--red)' }}
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--cream)', fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: '14px 16px' }}>TOTAL STOCK</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--orange)', fontSize: 18 }}>
                        {variants.reduce((s, v) => s + v.stock, 0)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </TableCard>

          {/* 6. PUBLICATION */}
          <TableCard title="6. Statut de publication">
            <div style={{ padding: 20 }}>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 12, 
                  cursor: 'pointer', 
                  padding: 16, 
                  background: isUnpublished ? 'var(--amber-soft)' : 'var(--cream)', 
                  border: `2px solid ${isUnpublished ? 'var(--amber)' : 'var(--line)'}`, 
                  borderRadius: 12, 
                  transition: 'all 0.2s' 
                }}
              >
                <input 
                  type="checkbox" 
                  checked={isUnpublished} 
                  onChange={e => setIsUnpublished(e.target.checked)}
                  style={{ marginTop: 4, width: 18, height: 18, accentColor: 'var(--orange)' }} 
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isUnpublished ? '🔒 Brouillon (Non publié)' : '🌍 Publié sur la boutique'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--brown-soft)', marginTop: 4, lineHeight: 1.5 }}>
                    {isUnpublished 
                      ? "Le produit sera enregistré mais pas visible par les clients. Idéal pour préparer un stock avant lancement."
                      : "Le produit sera immédiatement visible et achetable sur le site web par les clients."}
                  </div>
                </div>
              </label>
            </div>
          </TableCard>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 40 }}>
            <button type="button" className="btn-secondary" onClick={() => router.back()} style={{ padding: '12px 30px' }}>
              Annuler
            </button>
            <button type="submit" className="btn-orange" style={{ padding: '12px 40px', fontSize: 15 }} disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Ajouter le produit'}
            </button>
          </div>

        </form>
      </div>

      <style jsx>{`
        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--brown-soft);
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .field-input {
          width: 100%;
          border: 1.5px solid var(--line);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          background: white;
        }
        .field-input:focus {
          outline: none;
          border-color: var(--orange);
          box-shadow: 0 0 0 4px var(--orange-soft);
        }
        .action-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

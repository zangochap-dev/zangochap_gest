"use client";

import React, { useState, useTransition } from "react";
import { 
  Warehouse, 
  MapPin, 
  Plus, 
  Search, 
  ChevronRight, 
  Box, 
  Edit3, 
  Activity, 
  ShieldCheck,
  LayoutGrid
} from "lucide-react";
import { TableCard, DetailCard } from "@/components/UI";
import Modal from "@/components/Modal";
import { createWarehouse, updateWarehouse, deleteWarehouse, getWarehouseStock } from "@/modules/logistics/warehouseActions";
import { formatPrice } from "@/lib/constants";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

export default function WarehouseClient({ initialWarehouses }: { initialWarehouses: any[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [warehouseStock, setWarehouseStock] = useState<any[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [formData, setFormData] = useState({ name: "", location: "", isActive: true });

  const filtered = initialWarehouses.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (e: React.MouseEvent, w?: any) => {
    e.stopPropagation();
    if (w) {
      setSelectedWarehouse(w);
      setFormData({ name: w.name, location: w.location || "", isActive: w.isActive });
    } else {
      setSelectedWarehouse(null);
      setFormData({ name: "", location: "", isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleOpenDetail = async (w: any) => {
    setSelectedWarehouse(w);
    setIsDetailOpen(true);
    setIsLoadingStock(true);
    try {
      const stock = await getWarehouseStock(w.id);
      setWarehouseStock(stock);
    } catch (err) {
      showToast("Erreur lors de la récupération du stock", "error");
    } finally {
      setIsLoadingStock(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer cet entrepôt ?")) return;
    
    startTransition(async () => {
      try {
        await deleteWarehouse(id);
        showToast("Entrepôt supprimé", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Erreur lors de la suppression", "error");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (selectedWarehouse) {
          await updateWarehouse(selectedWarehouse.id, formData);
          showToast("Entrepôt mis à jour", "success");
        } else {
          await createWarehouse(formData);
          showToast("Entrepôt créé", "success");
        }
        setIsModalOpen(false);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Erreur lors de l'enregistrement", "error");
      }
    });
  };

  return (
    <div className="content animate-fade-in">
      {/* HEADER SECTION */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)' }}>Gestion des Entrepôts</h1>
          <p style={{ color: 'var(--brown-soft)', fontSize: 14 }}>Gérez vos sites de stockage et la distribution de votre inventaire.</p>
        </div>
        <button className="btn-orange" onClick={(e) => handleOpenModal(e)}>
          <Plus size={18} /> Nouvel Entrepôt
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card accent">
          <div className="stat-label">Total Entrepôts</div>
          <div className="stat-value">{initialWarehouses.length}</div>
          <div className="stat-icon-bg"><Warehouse size={40} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sites Actifs</div>
          <div className="stat-value">{initialWarehouses.filter(w => w.isActive).length}</div>
          <div className="stat-icon-bg" style={{ color: 'var(--green)' }}><ShieldCheck size={40} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Articles en Stock</div>
          <div className="stat-value">{initialWarehouses.reduce((acc, w) => acc + (w.totalItems || 0), 0)}</div>
          <div className="stat-icon-bg" style={{ color: 'var(--blue)' }}><Box size={40} /></div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-soft)' }} />
        <input 
          type="text" 
          className="field-input" 
          placeholder="Rechercher un entrepôt par nom ou lieu..." 
          style={{ paddingLeft: 40, borderRadius: 12, height: 44 }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* WAREHOUSE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {filtered.map(w => (
          <div key={w.id} className="warehouse-card animate-slide-up" onClick={() => handleOpenDetail(w)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: w.isActive ? 'var(--orange-soft)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: w.isActive ? 'var(--orange)' : 'var(--brown-soft)' }}>
                <Warehouse size={24} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  className="action-btn-sm" 
                  onClick={(e) => handleOpenModal(e, w)}
                  style={{ background: 'var(--cream-2)', color: 'var(--brown)' }}
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  className="action-btn-sm" 
                  onClick={(e) => handleDelete(e, w.id)}
                  style={{ background: '#FEE2E2', color: '#EF4444' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>{w.name}</h3>
              <span className={`status ${w.isActive ? 'confirmed' : 'pending'}`} style={{ textTransform: 'uppercase', fontSize: 8, fontWeight: 900 }}>
                {w.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brown-soft)', fontSize: 12, marginBottom: 16 }}>
              <MapPin size={12} /> {w.location || "Adresse non définie"}
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 9, color: 'var(--brown-soft)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Total</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)' }}>
                  {w.totalItems || 0} <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--brown-soft)' }}>unités</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--brown-soft)', fontWeight: 800, textTransform: 'uppercase' }}>Variantes</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange)' }}>{w._count?.stocks || 0}</div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', background: 'white', borderRadius: 24, border: '2px dashed var(--line)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏢</div>
            <h3 style={{ color: 'var(--ink)', fontWeight: 800 }}>Aucun entrepôt trouvé</h3>
            <p style={{ color: 'var(--brown-soft)' }}>Modifiez votre recherche ou créez un nouveau site.</p>
          </div>
        )}
      </div>

      {/* MODAL EDIT/CREATE */}
      {isModalOpen && (
        <Modal 
          isOpen={true} 
          onClose={() => setIsModalOpen(false)} 
          title={selectedWarehouse ? "Modifier l'entrepôt" : "Créer un entrepôt"}
        >
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Nom de l'entrepôt</label>
              <input 
                className="field-input" 
                required 
                placeholder="ex: Entrepôt Abidjan Sud" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Emplacement / Adresse</label>
              <input 
                className="field-input" 
                placeholder="ex: Marcory, Zone 4" 
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <label className="field-label" style={{ marginBottom: 0 }}>Statut Actif</label>
              <input 
                type="checkbox" 
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: 20, height: 20, accentColor: 'var(--orange)' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: 24 }}>
              <button type="submit" className="btn-orange" style={{ width: '100%', height: 48 }} disabled={isPending}>
                {isPending ? "Enregistrement..." : (selectedWarehouse ? "Mettre à jour" : "Créer l'entrepôt")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* WAREHOUSE DETAIL MODAL */}
      {isDetailOpen && selectedWarehouse && (
        <Modal
          isOpen={true}
          onClose={() => setIsDetailOpen(false)}
          xl
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Warehouse size={20} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedWarehouse.name}</div>
                <div style={{ fontSize: 12, color: 'var(--brown-soft)' }}>Inventaire détaillé du site</div>
              </div>
            </div>
          }
        >
          {isLoadingStock ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: 'var(--orange)' }} />
              <p style={{ marginTop: 12, fontWeight: 600, color: 'var(--brown-soft)' }}>Chargement de l'inventaire...</p>
            </div>
          ) : (
            <div style={{ paddingBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                <div style={{ background: 'var(--cream)', padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brown-soft)', textTransform: 'uppercase', marginBottom: 4 }}>Unités Totales</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>{warehouseStock.reduce((acc, s) => acc + s.quantity, 0)}</div>
                </div>
                <div style={{ background: 'var(--cream)', padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brown-soft)', textTransform: 'uppercase', marginBottom: 4 }}>Variantes Uniques</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--orange)' }}>{warehouseStock.length}</div>
                </div>
                <div style={{ background: 'var(--cream)', padding: 16, borderRadius: 12, border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brown-soft)', textTransform: 'uppercase', marginBottom: 4 }}>Valeur Estimée</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green)' }}>
                    {formatPrice(warehouseStock.reduce((acc, s) => acc + (s.quantity * (s.variant?.product?.price || 0)), 0))}
                  </div>
                </div>
              </div>

              <div className="table-wrap" style={{ border: '1px solid var(--line)', borderRadius: 12 }}>
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}></th>
                      <th>Produit</th>
                      <th>Variante</th>
                      <th style={{ textAlign: 'center' }}>Quantité</th>
                      <th style={{ textAlign: 'right' }}>Prix Unitaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseStock.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--brown-soft)' }}>
                          Cet entrepôt est actuellement vide.
                        </td>
                      </tr>
                    ) : (
                      warehouseStock.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--cream-2)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                              {item.variant?.product?.images?.[0] ? (
                                <img src={item.variant.product.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                  {item.variant?.product?.emoji || '📦'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{item.variant?.product?.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--brown-soft)', fontFamily: 'var(--font-mono)' }}>{item.variant?.product?.ref || 'SANS-REF'}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--cream)', padding: '2px 8px', borderRadius: 4 }}>
                              {item.variant?.size} · {item.variant?.color}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ 
                              fontSize: 16, 
                              fontWeight: 900, 
                              color: item.quantity <= 3 ? 'var(--red)' : 'var(--ink)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6
                            }}>
                              {item.quantity}
                              {item.quantity <= 3 && <AlertTriangle size={14} />}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {formatPrice(item.variant?.product?.price || 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Modal>
      )}

      <style>{`
        .warehouse-card {
          background: white;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid var(--line);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .warehouse-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1);
          border-color: var(--orange-soft);
        }
        .warehouse-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 4px; height: 0;
          background: var(--orange);
          transition: height 0.3s ease;
        }
        .warehouse-card:hover::before {
          height: 100%;
        }
        .action-btn-sm {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn-sm:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slide-up {
          animation: slideUp 0.4s ease-out both;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { TableCard, EmptyState } from "@/components/UI";
import { formatPrice, formatDate } from "@/lib/constants";
import { RefreshCw, Clock, Check, Trash2, Eye, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { deleteOrder, takeToProcessOrder, reassignOrderLead, updateRoundRobinActiveCommercials } from "@/modules/orders/actions";
import { useToast } from "@/components/Toast";
import Modal from "@/components/Modal";
import { getImageUrl } from "@/lib/utils";
import "./to-process-client.css";

interface ToProcessClientProps {
  orders: any[];
  user: any;
  callCenterUsers: any[];
  nextInRotation?: { id: string; name: string } | null;
  activeCommercialIds?: string[];
}

type DatePreset = 'today' | 'yesterday' | 'custom' | 'all';

function toLocalDateInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ToProcessClient({ orders: initialOrders, user, callCenterUsers, nextInRotation, activeCommercialIds }: ToProcessClientProps) {
  const todayStr = toLocalDateInputValue();
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [workingOrderId, setWorkingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const [showRotationModal, setShowRotationModal] = useState(false);
  const [activeIds, setActiveIds] = useState<string[]>(activeCommercialIds || []);

  React.useEffect(() => {
    setActiveIds(activeCommercialIds || []);
  }, [activeCommercialIds]);

  const commercialsList = useMemo(() => {
    return callCenterUsers.filter((u: any) => u.role === 'COMMERCIAL');
  }, [callCenterUsers]);

  const handleToggleCommercialActive = (commercialId: string) => {
    let currentActive = [...activeIds];
    if (currentActive.length === 0) {
      currentActive = commercialsList.map((c: any) => c.id);
    }

    if (currentActive.includes(commercialId)) {
      currentActive = currentActive.filter(id => id !== commercialId);
    } else {
      currentActive.push(commercialId);
    }
    setActiveIds(currentActive);
  };

  const handleSaveRotation = () => {
    startTransition(async () => {
      try {
        await updateRoundRobinActiveCommercials(activeIds);
        showToast("Rotation mise à jour avec succès", "success");
        setShowRotationModal(false);
        await refetch();
      } catch (error: any) {
        showToast(error.message || "Erreur lors de la mise à jour de la rotation", "error");
      }
    });
  };

  const handleReassignLead = (orderId: string, commercialId: string) => {
    setWorkingOrderId(orderId);
    startTransition(async () => {
      try {
        await reassignOrderLead(orderId, commercialId);
        showToast("Lead réattribué avec succès", "success");
        await refetch();
      } catch (error: any) {
        showToast(error.message || "Erreur lors de la réattribution", "error");
      } finally {
        setWorkingOrderId(null);
      }
    });
  };
  // React Query — smooth background polling, no page flash
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['to-process-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders/to-process');
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
    initialData: { orders: initialOrders },
    refetchInterval: 10_000,
    staleTime: 0,
  });

  const orders = data?.orders ?? initialOrders;
  const filteredOrders = useMemo(() => {
    if (!dateFrom && !dateTo) return orders;
    return orders.filter((order: any) => {
      const createdAt = new Date(order.createdAt).getTime();
      if (dateFrom && createdAt < new Date(`${dateFrom}T00:00:00`).getTime()) return false;
      if (dateTo && createdAt > new Date(`${dateTo}T23:59:59.999`).getTime()) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === 'custom') return;
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
      return;
    }

    const date = new Date();
    if (preset === 'yesterday') date.setDate(date.getDate() - 1);
    const value = toLocalDateInputValue(date);
    setDateFrom(value);
    setDateTo(value);
  };

  const handleDateFromChange = (value: string) => {
    setDatePreset('custom');
    setDateFrom(value);
  };

  const handleDateToChange = (value: string) => {
    setDatePreset('custom');
    setDateTo(value);
  };

  const handleTakeOrder = (orderId: string, commercialId?: string) => {
    setWorkingOrderId(orderId);
    startTransition(async () => {
      try {
        const result = await takeToProcessOrder(orderId, commercialId);
        showToast(`Commande ${result.order.ref} confirmee`, "success");
        await refetch();
      } catch (error: any) {
        showToast(error.message || "Erreur lors de la prise en charge", "error");
      } finally {
        setWorkingOrderId(null);
      }
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!confirm("Supprimer cette commande a traiter ?")) return;

    setWorkingOrderId(orderId);
    startTransition(async () => {
      try {
        await deleteOrder(orderId);
        showToast("Commande supprimee", "success");
        await refetch();
      } catch (error: any) {
        showToast(error.message || "Erreur lors de la suppression", "error");
      } finally {
        setWorkingOrderId(null);
      }
    });
  };

  const getItemImage = (item: any) => {
    if (item.image) return item.image;
    if (item.variant?.image) return item.variant.image;
    if (item.product?.images?.[0]?.url) return item.product.images[0].url;
    return null;
  };

  return (
    <div className="content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--cream)', padding: 3, borderRadius: 10, border: '1px solid var(--line)', flexWrap: 'wrap' }}>
          {[
            { label: "Aujourd'hui", val: 'today' },
            { label: 'Hier', val: 'yesterday' },
            { label: 'Perso', val: 'custom' },
            { label: 'Tout', val: 'all' },
          ].map(d => (
            <button key={d.val} className={`shortcut-btn ${datePreset === d.val ? 'active' : ''}`} onClick={() => applyDatePreset(d.val as DatePreset)}>
              {d.label}
            </button>
          ))}
          {datePreset === 'custom' && (
            <>
              <input type="date" className="filter-date" value={dateFrom} onChange={e => handleDateFromChange(e.target.value)} />
              <input type="date" className="filter-date" value={dateTo} onChange={e => handleDateToChange(e.target.value)} />
            </>
          )}
        </div>
        {String(user?.role || "").toLowerCase() === "admin" && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {nextInRotation && (
              <div style={{ fontSize: 11, background: 'var(--cream)', border: '1px solid var(--line)', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                Prochain commercial dans la rotation : <span style={{ color: 'var(--orange)' }}>{nextInRotation.name}</span>
              </div>
            )}
            <button
              className="btn-secondary"
              style={{ fontSize: 11, padding: '6px 12px', height: 'auto', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => setShowRotationModal(true)}
            >
              ⚙️ Gérer la rotation
            </button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
         {isFetching && <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--orange)', opacity: 0.5 }} />}
         <span style={{ fontSize: 11, color: '#8E8E93', fontWeight: 600 }}>Mise à jour auto</span>
        </div>
      </div>

      <TableCard title={`Commandes en attente de traitement`} meta={`${filteredOrders.length} commande(s) provenant du site web`}>
        {filteredOrders.length === 0 ? (
          <EmptyState icon="✨" title="Tout est à jour" description="Aucune nouvelle commande à traiter pour le moment." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Client</th>
                <th>Lead Actuel</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order: any) => (
                <tr key={order.id}>
                  <td>
                    <div className="cell-mono" style={{ color: 'var(--orange)', fontWeight: 700 }}>{order.ref || "En attente"}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                       <Clock size={10} color="var(--brown-soft)" />
                       <span className="cell-muted" style={{ fontSize: 10 }}>{formatDate(order.createdAt)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-strong">{order.customerName}</div>
                    <div className="cell-muted">{order.customerPhone}</div>
                  </td>
                  <td>
                    <div className="cell-strong">{order.commercialName || "Non assigné"}</div>
                    {String(user?.role || "").toLowerCase() === "admin" && (
                      <select
                        className="filter-select"
                        value={order.commercialId || ""}
                        onChange={(e) => handleReassignLead(order.id, e.target.value)}
                        style={{ marginTop: 4, fontSize: 11, padding: '2px 6px', height: 'auto', borderRadius: 6 }}
                        disabled={isPending && workingOrderId === order.id}
                        aria-label="Réattribuer le lead"
                      >
                        <option value="" disabled>Réattribuer...</option>
                        {commercialsList.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {order.items.map((item: any, i: number) => (
                        <div key={i} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              overflow: 'hidden',
                              border: '1px solid var(--line)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'var(--cream-2)',
                              flexShrink: 0,
                              cursor: getItemImage(item) ? 'zoom-in' : 'default',
                            }}
                            onClick={() => {
                              const img = getItemImage(item);
                              if (img) setSelectedImage(img);
                            }}
                          >
                            {getItemImage(item) ? (
                              <img
                                src={getImageUrl(getItemImage(item))}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{ fontSize: 10 }}>{item.emoji || '📦'}</span>
                            )}
                          </div>
                          <span className="cell-strong">{item.name}</span>
                          <span className="cell-muted">({item.size}/{item.color})</span>
                          <span style={{ fontWeight: 700 }}>×{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td><span className="cell-price">{formatPrice(order.total)}</span></td>
                  <td><span className="cell-muted">{formatDate(order.createdAt)}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <button
                        className="btn-secondary"
                        onClick={() => setSelectedOrder(order)}
                        title="Voir la commande"
                        aria-label="Voir la commande"
                      >
                        <Eye size={14} /> Voir
                      </button>
                      <button
                        className="btn-orange"
                        disabled={isPending && workingOrderId === order.id}
                        onClick={() => handleTakeOrder(order.id)}
                        title="Prendre la commande"
                        aria-label="Prendre la commande"
                      >
                        <Check size={14} /> Prendre
                      </button>
                      {String(user?.role || "").toLowerCase() === "admin" && (
                        <button
                          className="btn-secondary"
                          disabled={isPending && workingOrderId === order.id}
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Supprimer la commande"
                          aria-label="Supprimer la commande"
                          style={{ color: '#E53E3E', borderColor: '#FED7D7' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Détails de la commande - ${selectedOrder.ref || "En attente"}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>Fermer</button>
              <button
                className="btn-orange"
                disabled={isPending && workingOrderId === selectedOrder.id}
                onClick={() => {
                  handleTakeOrder(selectedOrder.id);
                  setSelectedOrder(null);
                }}
              >
                <Check size={14} /> Prendre la commande
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Client Info */}
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 11, textTransform: 'uppercase', color: 'var(--orange)', letterSpacing: '0.05em' }}>Informations Client</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#8E8E93', textTransform: 'uppercase' }}>Nom Complet</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{selectedOrder.customerName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#8E8E93', textTransform: 'uppercase' }}>Téléphone(s)</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                    {selectedOrder.customerPhone}
                    {selectedOrder.customerPhone2 ? ` / ${selectedOrder.customerPhone2}` : ''}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 10, color: '#8E8E93', textTransform: 'uppercase' }}>Adresse de livraison</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                    {selectedOrder.customerLocation || 'Non spécifiée'}
                    {selectedOrder.commune ? ` (${selectedOrder.commune})` : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Lead & Assignment History */}
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 11, textTransform: 'uppercase', color: 'var(--orange)', letterSpacing: '0.05em' }}>Attribution du Lead</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#8E8E93', textTransform: 'uppercase' }}>Lead Actuel</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{selectedOrder.commercialName || "Non assigné"}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 10, color: '#8E8E93', textTransform: 'uppercase' }}>Historique d'attribution</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, maxHeight: 100, overflowY: 'auto', background: 'var(--cream)', padding: 8, borderRadius: 6, border: '1px solid var(--line)', fontSize: 11 }}>
                    {Array.isArray(selectedOrder.history) && selectedOrder.history.length > 0 ? (
                      selectedOrder.history
                        .filter((h: any) => String(h.action || "").includes("Attribution") || String(h.action || "").includes("Réattribution") || String(h.action || "").includes("lead") || String(h.action || "").includes("attribuée"))
                        .map((h: any, idx: number) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <span style={{ color: '#555' }}>{h.action}</span>
                            <span style={{ color: '#8E8E93', fontSize: 10 }}>{formatDate(h.at)}</span>
                          </div>
                        ))
                    ) : (
                      <div style={{ color: '#8E8E93' }}>Aucun historique d'attribution</div>
                    )}
                    {Array.isArray(selectedOrder.history) && selectedOrder.history.length > 0 && selectedOrder.history.filter((h: any) => String(h.action || "").includes("Attribution") || String(h.action || "").includes("Réattribution") || String(h.action || "").includes("lead") || String(h.action || "").includes("attribuée")).length === 0 && (
                      <div style={{ color: '#8E8E93' }}>Créé le {formatDate(selectedOrder.createdAt)}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 11, textTransform: 'uppercase', color: 'var(--orange)', letterSpacing: '0.05em' }}>Articles commandés</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--cream)', padding: 12, borderRadius: 8, border: '1px solid var(--line)' }}>
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, paddingBottom: idx < selectedOrder.items.length - 1 ? 8 : 0, borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid var(--line)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '1px solid var(--line)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--cream-2)',
                          flexShrink: 0,
                          cursor: getItemImage(item) ? 'zoom-in' : 'default',
                        }}
                        onClick={() => {
                          const img = getItemImage(item);
                          if (img) setSelectedImage(img);
                        }}
                      >
                        {getItemImage(item) ? (
                          <img
                            src={getImageUrl(getItemImage(item))}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: 16 }}>{item.emoji || '📦'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: '#8E8E93' }}>Taille: {item.size} | Couleur: {item.color}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>{formatPrice(item.price)} × {item.qty}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)' }}>{formatPrice(item.price * item.qty)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recap & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'start' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 11, textTransform: 'uppercase', color: 'var(--orange)', letterSpacing: '0.05em' }}>Notes / Instructions</h4>
                <div style={{ fontSize: 11, background: '#FAFAF8', padding: 10, borderRadius: 6, minHeight: 60, whiteSpace: 'pre-wrap', color: '#555', border: '1px solid var(--line)' }}>
                  {selectedOrder.notes || selectedOrder.deliveryNote || 'Aucune instruction de livraison spécifique.'}
                </div>
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 11, textTransform: 'uppercase', color: 'var(--orange)', letterSpacing: '0.05em' }}>Facturation</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8E8E93' }}>Sous-total :</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8E8E93' }}>Frais de livraison :</span>
                    <span>{formatPrice(selectedOrder.deliveryFee || 0)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C23616', fontWeight: 600 }}>
                      <span>Remise automatique :</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px solid var(--line)', paddingTop: 6, fontSize: 13, marginTop: 4 }}>
                    <span>Total à payer :</span>
                    <span style={{ color: 'var(--orange)' }}>{formatPrice(selectedOrder.total + (selectedOrder.deliveryFee || 0) - (selectedOrder.discount || 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showRotationModal && (
        <Modal
          isOpen={showRotationModal}
          onClose={() => setShowRotationModal(false)}
          title="Gérer les commerciaux dans la rotation"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setShowRotationModal(false)}>Annuler</button>
              <button
                className="btn-orange"
                disabled={isPending}
                onClick={handleSaveRotation}
              >
                Enregistrer
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
              Cochez les commerciaux qui doivent participer à l'attribution automatique en round-robin.
              Si aucun n'est sélectionné, l'attribution se fera sur l'ensemble des commerciaux par défaut.
            </p>
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 8, background: '#FAFAF8', padding: 8 }}>
              {commercialsList.map((c: any) => {
                const isChecked = activeIds.length === 0 || activeIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      borderRadius: 6,
                      fontSize: 13,
                      userSelect: 'none',
                      borderBottom: '1px solid #EDEDEB',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCommercialActive(c.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: isChecked ? 600 : 400 }}>{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox / Immersive zoom for order items */}
      {selectedImage && createPortal(
        <div
          className="lightbox-overlay"
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            cursor: 'zoom-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            <img
              src={getImageUrl(selectedImage)}
              alt="Agrandissement"
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: -48,
                right: 0,
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
              }}
              aria-label="Fermer le zoom"
            >
              <X size={20} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

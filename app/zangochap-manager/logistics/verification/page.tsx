"use client";

import React, { useState, useMemo } from "react";
import Topbar from "@/components/Topbar";
import { EmptyState, StatCard, StatusBadge } from "@/components/UI";
import { formatDay } from "@/lib/constants";
import { Printer, CheckCircle2, Search, X, Loader2, MapPin, Phone } from "lucide-react";
import { toggleItemVerification } from "@/modules/logistics/actions";
import { useToast } from "@/components/Toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order, OrderItem, Product, ProductVariant } from "@prisma/client";

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  images?: { url: string }[];
}

interface OrderItemWithProduct extends OrderItem {
  product?: ProductWithVariants | null;
}

interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
}

interface PreviewItemData {
  url: string;
  name: string;
  size?: string;
  color?: string;
}

export default function VerificationPage() {
  return (
    <>
      <Topbar title="Fiche" subtitle="vérification logistique" />
      <VerificationClient />
    </>
  );
}

function VerificationClient() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [previewItem, setPreviewItem] = useState<PreviewItemData | null>(null);
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all"); // all, checked, unchecked
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: loading } = useQuery<OrderWithItems[]>({
    queryKey: ['delivery-sheet', date],
    queryFn: async () => {
      const res = await fetch(`/api/delivery-sheet?date=${date}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des données");
      return res.json();
    },
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const setToday = () => setDate(new Date().toISOString().split('T')[0]);
  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };
  const setTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleToggleCheck = async (itemId: string, currentStatus: boolean) => {
    // Mise à jour optimiste immédiate — uniquement l'item ciblé
    queryClient.setQueryData(['delivery-sheet', date], (old: OrderWithItems[] | undefined) => {
      if (!old) return old;
      return old.map(o => ({
        ...o,
        items: o.items.map(i => i.id === itemId ? { ...i, isVerified: !currentStatus } : i)
      }));
    });

    try {
      await toggleItemVerification(itemId, !currentStatus);
      queryClient.invalidateQueries({ queryKey: ['delivery-sheet', date] });
      showToast(!currentStatus ? 'Article vérifié ✓' : 'Vérification annulée', 'success');
    } catch (e: any) {
      queryClient.invalidateQueries({ queryKey: ['delivery-sheet', date] });
      showToast(e.message || 'Erreur lors de la vérification', 'error');
    }
  };

  const handleVerifyAllOrderItems = async (order: OrderWithItems, targetStatus: boolean) => {
    const itemsToToggle = order.items.filter(i => !!i.isVerified !== targetStatus);
    if (itemsToToggle.length === 0) return;

    setVerifyingOrderId(order.id);

    // Mise à jour optimiste immédiate — uniquement la commande ciblée
    queryClient.setQueryData(['delivery-sheet', date], (old: OrderWithItems[] | undefined) => {
      if (!old) return old;
      return old.map(o => {
        if (o.id === order.id) {
          return {
            ...o,
            items: o.items.map(i => ({ ...i, isVerified: targetStatus }))
          };
        }
        return o;
      });
    });

    try {
      await Promise.all(itemsToToggle.map(item => toggleItemVerification(item.id, targetStatus)));
      queryClient.invalidateQueries({ queryKey: ['delivery-sheet', date] });
      showToast(`Commande ${order.ref} : tous les articles marqués comme ${targetStatus ? 'vérifiés ✓' : 'non vérifiés'}`, 'success');
    } catch (e: any) {
      queryClient.invalidateQueries({ queryKey: ['delivery-sheet', date] });
      showToast(e.message || 'Erreur lors de la vérification de la commande', 'error');
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderRef = order.ref || '';
      const customerName = order.customerName || '';
      const customerPhone = order.customerPhone || '';
      
      const matchesSearch = orderRef.toLowerCase().includes(search.toLowerCase()) || 
                            customerName.toLowerCase().includes(search.toLowerCase()) ||
                            customerPhone.toLowerCase().includes(search.toLowerCase()) ||
                            order.items?.some(item => (item.name || '').toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;

      const hasUnchecked = order.items?.some(item => !item.isVerified);
      const matchesVerification = verificationFilter === 'all' ||
                                  (verificationFilter === 'checked' && !hasUnchecked) ||
                                  (verificationFilter === 'unchecked' && hasUnchecked);

      return matchesSearch && matchesStatus && matchesVerification;
    });
  }, [orders, search, orderStatusFilter, verificationFilter]);

  const totalOrders = orders.length;
  const totalItems = useMemo(() => orders.reduce((sum, o) => sum + (o.items?.length || 0), 0), [orders]);
  const checkedItemsCount = useMemo(() => orders.reduce((sum, o) => sum + (o.items?.filter(i => i.isVerified).length || 0), 0), [orders]);
  const progress = totalItems > 0 ? (checkedItemsCount / totalItems) * 100 : 0;

  return (
    <div className="w-full p-5 animate-fade-in print:bg-white print:p-0">
      {/* CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 md:p-4 rounded-md mb-6 border border-gray-200 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-md border border-gray-200">
            <button className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${date === new Date().toISOString().split('T')[0] ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`} onClick={setToday}>Auj.</button>
            <button className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${date === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`} onClick={setYesterday}>Hier</button>
            <button className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${date === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`} onClick={setTomorrow}>Dem.</button>
          </div>
          <input type="date" className="px-2.5 py-1 rounded-md border border-orange-200 text-sm font-bold text-gray-800 bg-orange-50/30 focus:border-orange-500 focus:bg-white focus:outline-none transition-colors" value={date} onChange={e => setDate(e.target.value)} />
          {loading && <Loader2 size={16} className="animate-spin text-orange-500" />}
        </div>
        
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher une réf, un client ou un produit..." 
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select 
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-bold text-gray-800 focus:bg-white focus:border-orange-500 focus:outline-none transition-colors"
            value={orderStatusFilter}
            onChange={e => setOrderStatusFilter(e.target.value)}
          >
            <option value="all">Tous les états</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="PACKED">Emballées</option>
            <option value="ON_DELIVERY">En livraison</option>
            <option value="DELIVERED">Livrées</option>
          </select>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-md border border-gray-200">
          <button className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${verificationFilter === 'all' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`} onClick={() => setVerificationFilter('all')}>Tous</button>
          <button className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${verificationFilter === 'unchecked' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`} onClick={() => setVerificationFilter('unchecked')}>À vérifier</button>
          <button className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${verificationFilter === 'checked' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`} onClick={() => setVerificationFilter('checked')}>Vérifiés</button>
        </div>

        {orders.length > 0 && (
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-md text-sm font-bold transition-colors cursor-pointer" onClick={() => window.print()}>
            <Printer size={15} /> Imprimer
          </button>
        )}
      </div>

      {/* STATS */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 print:hidden">
          <StatCard label="Colis du jour" value={totalOrders} accent />
          <StatCard label="Articles totaux" value={totalItems} />
          <div className="bg-white rounded-md p-3 md:p-4 border border-gray-200 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-gray-500">Vérification terminée</span>
              <span className="text-xs font-extrabold text-orange-500">{checkedItemsCount} / {totalItems}</span>
            </div>
            <div className="h-1 bg-gray-100 rounded overflow-hidden">
              <div className="h-full bg-orange-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* PRINT HEADER */}
      <div className="hidden print:block mb-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-black text-black m-0 tracking-tight">ZANGOCHAP</h1>
            <p className="text-sm text-gray-600 mt-1">Logistique & Vérification · Fiche de sortie du {formatDay(date)}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-gray-600">{totalOrders} colis · {totalItems} articles</div>
          </div>
        </div>
        <div className="h-0.5 bg-black w-full mb-6" />
      </div>

      {/* ORDERS LIST */}
      <div className="w-full space-y-4 print:space-y-4">
        {orders.length === 0 ? (
          <EmptyState icon="📋" title={loading ? "Chargement..." : "Aucune donnée"} description={loading ? "Veuillez patienter..." : "Sélectionnez une date et chargez les commandes."} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState icon="🔍" title="Aucun résultat" description="Aucune commande ne correspond à votre recherche ou filtre." />
        ) : (
          filteredOrders.map(order => {
            const orderItems = order.items || [];
            const checkedOrderItems = orderItems.filter(i => i.isVerified).length;
            const isAllChecked = checkedOrderItems === orderItems.length && orderItems.length > 0;

            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-md overflow-hidden print:border-gray-300 print:break-inside-avoid animate-fade-in">
                {/* ORDER HEADER */}
                <div className="bg-[#FCFBF9] p-3 md:px-4 md:py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 print:bg-gray-50 print:p-2.5">
                  <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
                    <span className="font-mono text-xs font-bold bg-gray-200/70 text-gray-800 px-2 py-0.5 rounded border border-gray-300 print:bg-gray-200">{order.ref}</span>
                    <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2 flex-wrap">
                      {order.customerName}
                      <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-gray-200 print:border-none print:bg-transparent print:p-0">
                        <Phone size={11} className="text-gray-400" /> {order.customerPhone}
                      </span>
                    </div>
                    {order.commune && (
                      <div className="text-xs font-bold text-gray-600 flex items-center gap-1 bg-orange-50 text-orange-800 px-2 py-0.5 rounded border border-orange-100 print:border-none print:bg-transparent print:p-0">
                        <MapPin size={12} className="text-orange-500" /> {order.commune}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
                    <StatusBadge status={order.status} />
                    
                    <div className={`text-xs font-bold ${isAllChecked ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {checkedOrderItems} / {orderItems.length} vérifié(s)
                    </div>

                    <button
                      className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 hover:border-emerald-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 rounded text-xs font-bold transition-all cursor-pointer print:hidden"
                      onClick={() => handleVerifyAllOrderItems(order, !isAllChecked)}
                      disabled={verifyingOrderId === order.id}
                    >
                      {verifyingOrderId === order.id ? <Loader2 size={13} className="animate-spin" /> : (isAllChecked ? 'Dé-vérifier tout ✕' : 'Tout vérifier ✓')}
                    </button>
                  </div>
                </div>

                {/* ORDER ITEMS TABLE */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse text-left print:w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-500 print:bg-gray-100">
                        <th className="w-10 py-2 px-3 text-center">✓</th>
                        <th className="py-2 px-3">Article</th>
                        <th className="w-16 py-2 px-3 text-center">Qté</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orderItems.map(item => {
                        const isChecked = !!item.isVerified;
                        const imageUrl = item.image || item.product?.images?.[0]?.url;

                        return (
                          <tr key={item.id} className={`transition-colors ${isChecked ? 'bg-amber-50/60 print:bg-transparent' : 'hover:bg-gray-50/50'}`}>
                            <td className="py-2.5 px-3 text-center align-middle">
                              <button 
                                className={`w-6 h-6 rounded border flex items-center justify-center transition-all cursor-pointer print:w-4 print:h-4 print:rounded-xs print:border ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white print:bg-transparent print:border-black print:text-black' : 'bg-white border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-500 print:border-gray-400'}`}
                                onClick={() => handleToggleCheck(item.id, isChecked)}
                              >
                                {isChecked && <CheckCircle2 size={15} className="print:w-3.5 print:h-3.5" />}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 align-middle">
                              <div className="flex items-center gap-2.5">
                                <div
                                  onClick={() => imageUrl && setPreviewItem({ url: imageUrl, name: item.name, size: item.size || undefined, color: item.color || undefined })}
                                  className={`w-9 h-9 bg-gray-100 rounded flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0 ${imageUrl ? 'cursor-zoom-in hover:opacity-90 transition-opacity' : ''}`}
                                >
                                  {imageUrl ? (
                                    <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-lg">{item.emoji || '📦'}</span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs text-gray-900 truncate">{item.name}</div>
                                  <div className="flex flex-wrap items-center gap-1 mt-1">
                                    <span className="bg-gray-100 text-gray-700 font-extrabold text-[11px] px-1.5 py-0.5 rounded border border-gray-200">{item.size}</span>
                                    <span className="text-[11px] font-bold text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{item.color}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center align-middle">
                              <div className="text-base font-black text-orange-500 print:text-black">{item.qty}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* IMMERSIVE LIGHTBOX */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out p-4 md:p-8"
          onClick={() => setPreviewItem(null)}
        >
          <button
            className="absolute top-4 right-4 md:top-6 md:right-6 z-[10001] bg-white/10 hover:bg-white/20 p-2.5 rounded-full text-white cursor-pointer transition-all border border-white/20"
            onClick={() => setPreviewItem(null)}
          >
            <X size={24} />
          </button>
          
          <div className="relative max-w-full max-h-[85vh] flex flex-col items-center justify-center animate-zoom-in" onClick={e => e.stopPropagation()}>
            <img
              src={previewItem.url}
              alt={previewItem.name}
              className="max-w-full max-h-[75vh] object-contain rounded-md shadow-none"
            />
            <div className="mt-4 text-center bg-black/60 px-4 py-2 rounded-md border border-white/10 backdrop-blur-md max-w-lg">
              <div className="text-white font-bold text-sm truncate">{previewItem.name}</div>
              {(previewItem.size || previewItem.color) && (
                <div className="flex items-center justify-center gap-2 mt-1">
                  {previewItem.size && <span className="bg-white/20 text-white font-extrabold text-[11px] px-2 py-0.5 rounded">{previewItem.size}</span>}
                  {previewItem.color && <span className="text-gray-300 text-[11px] font-medium">{previewItem.color}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

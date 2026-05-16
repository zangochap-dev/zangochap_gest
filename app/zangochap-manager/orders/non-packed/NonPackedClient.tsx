"use client";

import React, { useState, useTransition, useMemo } from "react";
import { TableCard, EmptyState, StatusBadge } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { Search, Package, AlertCircle, Eye, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/lib/hooks";
import { AnimatePresence } from "framer-motion";
import { updateOrderStatus } from "@/modules/orders/actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NonPackedModal from "./_components/NonPackedModal";
import NonPackedItem from "./_components/NonPackedItem";
import "./non-packed-client.css";

interface NonPackedClientProps {
  notPacked: any[];
  withAlternatives: any[];
  user: any;
}

export default function NonPackedClient({ notPacked: initialNotPacked, withAlternatives: initialAlternatives, user }: NonPackedClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // React Query — smooth background polling, no page flash
  const { data, isFetching } = useQuery({
    queryKey: ['non-packed-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders/non-packed');
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
    initialData: { notPacked: initialNotPacked, withAlternatives: initialAlternatives },
    refetchInterval: 10_000,
    staleTime: 0,
  });

  const notPacked = data?.notPacked ?? initialNotPacked;
  const withAlternatives = data?.withAlternatives ?? initialAlternatives;

  const handleStatusChange = (orderId: string, status: string) => {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status);
        showToast('Statut mis à jour ✓', 'success');
        // Instant refetch instead of router.refresh()
        queryClient.invalidateQueries({ queryKey: ['non-packed-orders'] });
        setSelectedOrder(null);
      } catch (e: any) {
        showToast(e.message || 'Erreur', 'error');
      }
    });
  };

  const filteredNotPacked = useMemo(() => {
    if (!search) return notPacked;
    const s = search.toLowerCase();
    return notPacked.filter((o: any) => 
      o.ref.toLowerCase().includes(s) || 
      o.customerName.toLowerCase().includes(s)
    );
  }, [notPacked, search]);

  const filteredAlternatives = useMemo(() => {
    if (!search) return withAlternatives;
    const s = search.toLowerCase();
    return withAlternatives.filter((o: any) => 
      o.ref.toLowerCase().includes(s) || 
      o.customerName.toLowerCase().includes(s)
    );
  }, [withAlternatives, search]);

  const totalCount = filteredNotPacked.length + filteredAlternatives.length;

  const OrderSection = ({ orders, title, meta, showCommercial = false, grouped = false }: { orders: any[], title: string, meta: string, showCommercial?: boolean, grouped?: boolean }) => {
    
    const renderGroupedOrders = () => {
      const byCommercial: Record<string, any[]> = {};
      orders.forEach((o: any) => {
        const c = o.commercialName || 'Inconnu';
        if (!byCommercial[c]) byCommercial[c] = [];
        byCommercial[c].push(o);
      });

      return Object.entries(byCommercial).map(([commName, list]) => (
        <div key={commName} style={{ borderBottom: '1px solid var(--line)', padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 16px' }}>
             <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                {commName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
             </div>
             <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
               {commName} <span style={{ color: '#8E8E93', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>· {list.length} commande(s)</span>
             </h3>
          </div>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {list.map((o: any) => (
              <div 
                key={o.id} 
                onClick={() => setSelectedOrder(o)}
                style={{ 
                  background: 'var(--cream)', 
                  borderRadius: 10, 
                  padding: '10px 14px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  gap: 12,
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'all 0.2s'
                }}
                className="hover-card"
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="cell-mono" style={{ color: 'var(--orange)', fontWeight: 700, fontSize: 13 }}>{o.ref}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{o.customerName}</span>
                  </div>
                  <div style={{ color: '#8E8E93', fontSize: 11, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    → {o.motif}
                  </div>
                </div>
                <StatusBadge status={o.status} size="sm" />
                <button className="action-btn" style={{ background: 'white' }}>
                  <Eye size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ));
    };

    if (isMobile) {
      return (
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12, padding: '0 4px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>{title}</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)' }}>{meta}</span>
          </div>
          {orders.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', background: 'white', borderRadius: 20, border: '1px dashed #E5E5EA' }}>
              <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
              <p style={{ color: '#8E8E93', fontSize: 13 }}>Aucune commande</p>
            </div>
          ) : (
            grouped ? renderGroupedOrders() : 
            orders.map((o: any, i: number) => (
              <NonPackedItem 
                key={o.id} 
                order={o} 
                isMobile={true} 
                idx={i} 
                showCommercial={showCommercial}
                onSelect={setSelectedOrder} 
              />
            ))
          )}
        </div>
      );
    }

    return (
      <TableCard title={title} meta={meta}>
        {orders.length === 0 ? (
          <EmptyState icon="✓" title="Tout est emballé" description="Aucune commande dans cette section." />
        ) : grouped ? (
          <div style={{ padding: '0' }}>{renderGroupedOrders()}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Client</th>
                <th>Articles</th>
                <th style={{ width: 220 }}>Motif / État Logistique</th>
                {showCommercial && <th>Commercial</th>}
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <NonPackedItem 
                  key={order.id} 
                  order={order} 
                  isMobile={false} 
                  showCommercial={showCommercial}
                  onSelect={setSelectedOrder} 
                />
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    );
  };

  return (
    <div className={`content animate-fade-in ${isMobile ? 'mobile-root' : ''}`} style={{ padding: isMobile ? '16px' : '20px' }}>
      
      {/* HEADER / SEARCH */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        gap: 16, 
        marginBottom: 20 
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} color="var(--orange)" />
            <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 900 }}>Suivi des Retards</h1>
            {isFetching && <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--orange)', opacity: 0.5 }} />}
          </div>
          <p style={{ fontSize: 13, color: '#8E8E93', fontWeight: 500, marginTop: 4 }}>
            Commandes nécessitant une intervention commerciale ou logistique.
          </p>
        </div>

        <div style={{ position: 'relative', width: isMobile ? '100%' : 300 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
          <input
            type="text"
            placeholder="Rechercher..."
            className="field-input"
            style={{ 
              paddingLeft: 40, 
              height: 44, 
              borderRadius: 12, 
              background: isMobile ? 'white' : 'var(--cream-2)',
              border: isMobile ? '1px solid #E5E5EA' : 'none'
            }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={`info-banner ${totalCount > 0 ? 'amber' : 'green'}`} style={{ marginBottom: 24, borderRadius: 12 }}>
        {totalCount > 0 
          ? `⚠️ ${totalCount} commande(s) en attente de traitement.` 
          : "✨ Toutes les anomalies ont été traitées !"}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <OrderSection 
          orders={filteredNotPacked.filter((o: any) => o.isToday)} 
          title="Non emballées du jour" 
          meta={`${filteredNotPacked.filter((o: any) => o.isToday).length} à traiter`} 
        />

        {filteredNotPacked.some((o: any) => !o.isToday) && (
          <OrderSection 
            orders={filteredNotPacked.filter((o: any) => !o.isToday)} 
            title="Retards antérieurs" 
            meta={`${filteredNotPacked.filter((o: any) => !o.isToday).length} en attente`} 
          />
        )}

        {filteredAlternatives.length > 0 && (
          <OrderSection 
            orders={filteredAlternatives} 
            title="Commandes avec alternative" 
            meta={`${filteredAlternatives.length} relances`}
            showCommercial={true}
            grouped={user?.role === 'admin'}
          />
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <NonPackedModal
            order={selectedOrder}
            user={user}
            isPending={isPending}
            onClose={() => setSelectedOrder(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>

      
    </div>
  );
}

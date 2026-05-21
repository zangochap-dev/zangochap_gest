"use client";

import React, { useState, useTransition, useMemo } from "react";
import { TableCard, EmptyState, StatusBadge } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { Search, Package, FileText, Eye, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/lib/hooks";
import { STATUS_LABELS } from "@/lib/constants";
import { AnimatePresence } from "framer-motion";
import { updateOrderStatus } from "@/modules/orders/actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NonPackedModal from "./_components/NonPackedModal";
import NonPackedItem from "./_components/NonPackedItem";
import "./non-packed-client.css";

interface NonPackedClientProps {
  withAlternatives: any[];
  user: any;
}

export default function NonPackedClient({ withAlternatives: initialAlternatives, user }: NonPackedClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [commercialFilter, setCommercialFilter] = useState("all");
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
    initialData: { withAlternatives: initialAlternatives },
    refetchInterval: 10_000,
    staleTime: 0,
  });

  const withAlternatives = data?.withAlternatives ?? initialAlternatives;

  const handleStatusChange = (orderId: string, status: string) => {
    // Optimistic Update: Remove from list immediately
    const previousData = queryClient.getQueryData(['non-packed-orders']);
    queryClient.setQueryData(['non-packed-orders'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        withAlternatives: old.withAlternatives.filter((o: any) => o.id !== orderId),
      };
    });

    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status);
        showToast('Statut mis à jour ✓', 'success');
        setSelectedOrder(null);
      } catch (e: any) {
        // Rollback on error
        queryClient.setQueryData(['non-packed-orders'], previousData);
        showToast(e.message || 'Erreur', 'error');
      } finally {
        // Final sync
        queryClient.invalidateQueries({ queryKey: ['non-packed-orders'] });
      }
    });
  };

  const commercialOptions = useMemo<string[]>(() => {
    return Array.from(new Set<string>(
      withAlternatives
        .map((order: any) => order.commercialName)
        .filter((commercial: unknown): commercial is string => typeof commercial === "string" && commercial.length > 0)
    )).sort((a, b) => a.localeCompare(b));
  }, [withAlternatives]);

  const statusOptions = useMemo<string[]>(() => {
    return Array.from(new Set<string>(
      withAlternatives
        .map((order: any) => order.status)
        .filter((status: unknown): status is string => typeof status === "string" && status.length > 0)
    )).sort();
  }, [withAlternatives]);

  const filteredAlternatives = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return withAlternatives.filter((order: any) => {
      const searchableText = [
        order.ref,
        order.customerName,
        order.customerPhone,
        order.commune,
        order.motif,
        order.commercialName,
        ...(order.items || []).map((item: any) => item.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesCommercial = commercialFilter === "all"
        || order.commercialName === commercialFilter;

      return matchesSearch && matchesStatus && matchesCommercial;
    });
  }, [commercialFilter, search, statusFilter, withAlternatives]);

  const totalCount = filteredAlternatives.length;

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
            <FileText size={20} color="var(--orange)" />
            <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 900 }}>Fiche de rappel</h1>
            {isFetching && <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--orange)', opacity: 0.5 }} />}
          </div>
          <p style={{ fontSize: 13, color: '#8E8E93', fontWeight: 500, marginTop: 4 }}>
            Alternatives proposées pour les commandes d&apos;hier.
          </p>
        </div>

        <div style={{ position: 'relative', width: isMobile ? '100%' : 300 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
          <input
            type="text"
            placeholder="Rechercher une commande..."
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : `repeat(${user?.role === 'admin' ? 2 : 1}, minmax(180px, 1fr))`,
          gap: 12,
          marginBottom: 20
        }}
      >
        <select className="field-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tous les statuts</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{STATUS_LABELS[status] || status}</option>
          ))}
        </select>

        {user?.role === 'admin' && (
          <select className="field-input" value={commercialFilter} onChange={(event) => setCommercialFilter(event.target.value)}>
            <option value="all">Tous les call centers</option>
            {commercialOptions.map((commercial) => (
              <option key={commercial} value={commercial}>{commercial}</option>
            ))}
          </select>
        )}
      </div>

      <div className={`info-banner ${totalCount > 0 ? 'amber' : 'green'}`} style={{ marginBottom: 24, borderRadius: 12 }}>
        {totalCount > 0
          ? `${totalCount} rappel(s) pour les commandes d'hier.`
          : "Aucun rappel ne correspond aux filtres."}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <OrderSection
          orders={filteredAlternatives}
          title="Alternatives proposées"
          meta={`${filteredAlternatives.length} rappel(s)`}
          showCommercial={user?.role === 'admin'}
          grouped={user?.role === 'admin' && commercialFilter === 'all'}
        />
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

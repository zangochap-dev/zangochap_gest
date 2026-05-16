"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/Toast";
import { toggleItemVerification } from "@/modules/logistics/actions";
import type { OrderWithItems } from "./types";
import { useState } from "react";

const QUERY_KEY = "delivery-sheet";

export function useVerificationData(date: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [verifyingItemIds, setVerifyingItemIds] = useState<Set<string>>(new Set());

  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: [QUERY_KEY, date],
    queryFn: async () => {
      const res = await fetch(`/api/delivery-sheet?date=${date}&type=created`);
      if (!res.ok) throw new Error("Erreur lors du chargement des données");
      return res.json();
    },
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const toggleItem = async (itemId: string, currentStatus: boolean) => {
    // Optimistic UI update
    queryClient.setQueryData([QUERY_KEY, date], (old: OrderWithItems[] | undefined) => {
      if (!old) return old;
      return old.map(o => ({
        ...o,
        items: o.items.map(i => i.id === itemId ? { ...i, isVerified: !currentStatus } : i),
      }));
    });

    // Tracking saving state
    setVerifyingItemIds(prev => new Set(prev).add(itemId));

    try {
      await toggleItemVerification(itemId, !currentStatus);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, date] });
      showToast(!currentStatus ? "Article vérifié ✓" : "Vérification annulée", "success");
    } catch (e: any) {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, date] });
      showToast(e.message || "Erreur lors de la vérification", "error");
    } finally {
      setVerifyingItemIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const toggleAllOrderItems = async (order: OrderWithItems, targetStatus: boolean) => {
    const itemsToToggle = order.items.filter(i => !!i.isVerified !== targetStatus);
    if (itemsToToggle.length === 0) return;

    setVerifyingOrderId(order.id);
    const ids = itemsToToggle.map(i => i.id);
    setVerifyingItemIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });

    queryClient.setQueryData([QUERY_KEY, date], (old: OrderWithItems[] | undefined) => {
      if (!old) return old;
      return old.map(o => {
        if (o.id === order.id) {
          return { ...o, items: o.items.map(i => ({ ...i, isVerified: targetStatus })) };
        }
        return o;
      });
    });

    try {
      await Promise.all(itemsToToggle.map(item => toggleItemVerification(item.id, targetStatus)));
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, date] });
      showToast(
        `Commande ${order.ref} : tous les articles marqués comme ${targetStatus ? "vérifiés ✓" : "non vérifiés"}`,
        "success"
      );
    } catch (e: any) {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, date] });
      showToast(e.message || "Erreur lors de la vérification de la commande", "error");
    } finally {
      setVerifyingOrderId(null);
      setVerifyingItemIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    }
  };

  return { orders, isLoading, verifyingOrderId, verifyingItemIds, toggleItem, toggleAllOrderItems };
}

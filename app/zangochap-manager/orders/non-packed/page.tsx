import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { TableCard, StatusBadge, EmptyState } from "@/components/UI";
import { formatPrice, formatDate } from "@/lib/constants";
import { getSession } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

import NonPackedClient from "./NonPackedClient";

export default async function NonPackedOrdersPage() {
  const user = await getSession();

  // Non-packed follow-up: orders with issues or explicitly marked partial
  const where: any = { 
    status: { in: ['CONFIRMED', 'PENDING', 'TO_PROCESS', 'PARTIAL'] } 
  };
  
  // Commercials only see their own
  if (user?.role === 'commercial') {
    where.OR = [
      { commercialId: user.id },
      { commercialName: user.name },
    ];
  }

  const allOrders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { items: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ISSUE_KEYWORDS = ['propose', 'alternative', 'indispo', 'manque', 'pas en stock', 'note', 'problème', 'épuisé', 'stock', 'rupture'];
  const ALTERNATIVE_KEYWORDS = ['propose', 'alternative'];

  const notPacked: any[] = [];
  const withAlternatives: any[] = [];

  allOrders.forEach(o => {
    const history = Array.isArray(o.history) ? (o.history as any[]) : [];
    
    // Check if there is an alternative proposed
    const hasAlt = history.some(h => {
      const act = h.action.toLowerCase();
      return ALTERNATIVE_KEYWORDS.some(kw => act.includes(kw));
    });

    // Extract motif: Match the mockup's logic
    const lastIssueEvent = [...history].reverse().find(h => {
      const act = h.action.toLowerCase();
      return ISSUE_KEYWORDS.some(kw => act.includes(kw));
    });

    const isToday = new Date(o.createdAt) >= today;
    
    // An order is "not packed" if it's confirmed/pending but not packed yet
    // The mockup specifically looks for pending/confirmed of today
    // We'll also include PARTIAL which are definitely non-packed
    const isActuallyNonPacked = ['CONFIRMED', 'PENDING', 'PARTIAL', 'TO_PROCESS'].includes(o.status);

    if (!isActuallyNonPacked && !hasAlt) return;

    const orderWithMotif = {
      ...o,
      motif: lastIssueEvent ? lastIssueEvent.action : (o.status === 'PARTIAL' ? 'Emballage partiel' : 'En attente d\'emballage'),
      isToday
    };

    if (hasAlt) {
      withAlternatives.push(orderWithMotif);
    } else {
      notPacked.push(orderWithMotif);
    }
  });

  return (
    <>
      <Topbar title="Suivi" subtitle="des retards" />
      <NonPackedClient 
        notPacked={notPacked} 
        withAlternatives={withAlternatives} 
        user={user} 
      />
    </>
  );
}

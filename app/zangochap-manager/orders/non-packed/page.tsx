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

  const notPacked: any[] = [];
  const withAlternatives: any[] = [];

  allOrders.forEach(o => {
    const history = Array.isArray(o.history) ? (o.history as any[]) : [];
    
    // Check if packers explicitly signaled an issue
    const hasLogIssue = history.some(h => {
      const act = h.action.toLowerCase();
      return act.includes('propose') || 
             act.includes('alternative') || 
             act.includes('indispo') || 
             act.includes('manque') || 
             act.includes('pas en stock') || 
             act.includes('note') || 
             act.includes('problème');
    });

    // Explicitly include PARTIAL orders even without specific logs (though they should have logs)
    if (!hasLogIssue && o.status !== 'PARTIAL') return;

    const hasAlt = history.some(h => 
      h.action.toLowerCase().includes('propose') || 
      h.action.toLowerCase().includes('alternative')
    );
    
    // Extract motif
    const lastLogEvent = [...history].reverse().find(h => {
      const act = h.action.toLowerCase();
      return act.includes('note') || 
             act.includes('indispo') || 
             act.includes('propose') || 
             act.includes('alternative') ||
             act.includes('manque') ||
             act.includes('pas en stock');
    });
    
    const orderWithMotif = {
      ...o,
      motif: lastLogEvent ? lastLogEvent.action : (o.status === 'PARTIAL' ? 'Emballage partiel' : 'Signalement emballeur')
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

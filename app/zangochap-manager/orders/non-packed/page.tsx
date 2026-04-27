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

  // Non-packed = confirmed but not yet packed
  const where: any = { status: { in: ['CONFIRMED', 'PENDING', 'TO_PROCESS'] } };
  
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

  // Split orders: standard vs with alternatives
  const notPacked: any[] = [];
  const withAlternatives: any[] = [];

  allOrders.forEach(o => {
    const history = Array.isArray(o.history) ? (o.history as any[]) : [];
    const hasAlt = history.some(h => 
      h.action.toLowerCase().includes('propose') || 
      h.action.toLowerCase().includes('alternative')
    );
    
    // Extract motif
    const lastLogEvent = [...history].reverse().find(h => 
      h.action.toLowerCase().includes('note') || 
      h.action.toLowerCase().includes('indispo') || 
      h.action.toLowerCase().includes('propose') || 
      h.action.toLowerCase().includes('alternative')
    );
    
    const orderWithMotif = {
      ...o,
      motif: lastLogEvent ? lastLogEvent.action : 'En attente d\'emballage'
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

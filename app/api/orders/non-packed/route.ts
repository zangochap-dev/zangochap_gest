import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

const ISSUE_KEYWORDS = ['propose', 'alternative', 'indispo', 'manque', 'pas en stock', 'épuisé', 'rupture', 'incomplet'];
const ALTERNATIVE_KEYWORDS = ['propose', 'alternative'];

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const where: any = {
      status: { in: ['CONFIRMED', 'PENDING', 'TO_PROCESS', 'PARTIAL'] }
    };

    if (user.role === 'commercial') {
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

    const notPacked: any[] = [];
    const withAlternatives: any[] = [];

    allOrders.forEach(o => {
      const history = Array.isArray(o.history) ? (o.history as any[]) : [];

      const lastIssueEvent = [...history].reverse().find(h => {
        const act = h.action.toLowerCase();
        return ISSUE_KEYWORDS.some(kw => act.includes(kw));
      });

      if (!lastIssueEvent && o.status !== 'PARTIAL') return;

      const hasAlt = history.some(h => {
        const act = h.action.toLowerCase();
        return ALTERNATIVE_KEYWORDS.some(kw => act.includes(kw));
      });

      const isToday = new Date(o.createdAt) >= today;

      const orderWithMotif = {
        ...o,
        motif: lastIssueEvent ? lastIssueEvent.action : (o.status === 'PARTIAL' ? 'Emballage partiel' : 'Problème de stock'),
        isToday
      };

      if (hasAlt) {
        withAlternatives.push(orderWithMotif);
      } else {
        notPacked.push(orderWithMotif);
      }
    });

    return NextResponse.json({
      notPacked: JSON.parse(JSON.stringify(notPacked)),
      withAlternatives: JSON.parse(JSON.stringify(withAlternatives)),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

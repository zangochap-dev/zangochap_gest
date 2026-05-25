import { NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";
import { getNonPackedOrdersData, type NonPackedOrdersPeriod } from "@/modules/orders/actions/queries";

export const dynamic = "force-dynamic";

const PERIODS = new Set<NonPackedOrdersPeriod>(["today", "yesterday", "all"]);

export async function GET(request: Request) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const requestedPeriod = new URL(request.url).searchParams.get("period") || "yesterday";
    const period: NonPackedOrdersPeriod = PERIODS.has(requestedPeriod as NonPackedOrdersPeriod)
      ? requestedPeriod as NonPackedOrdersPeriod
      : "yesterday";

    const { notPacked, withAlternatives } = await getNonPackedOrdersData(user, period);
    return NextResponse.json({
      notPacked: JSON.parse(JSON.stringify(notPacked)),
      withAlternatives: JSON.parse(JSON.stringify(withAlternatives)),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur de chargement" }, { status: 500 });
  }
}

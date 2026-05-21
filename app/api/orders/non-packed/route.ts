import { NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";
import { getNonPackedOrdersData } from "@/modules/orders/actions/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { withAlternatives } = await getNonPackedOrdersData(user);
    return NextResponse.json({
      withAlternatives: JSON.parse(JSON.stringify(withAlternatives)),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur de chargement" }, { status: 500 });
  }
}

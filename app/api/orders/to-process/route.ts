import { NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";
import { getToProcessOrders } from "@/modules/orders/actions/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const orders = await getToProcessOrders();
    return NextResponse.json({ orders: JSON.parse(JSON.stringify(orders)) });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur de chargement" }, { status: 500 });
  }
}

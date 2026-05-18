import { NextResponse } from "next/server";
import { getPackingOrders } from "@/modules/logistics/packing/data";
import { getSession } from "@/modules/auth/actions";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const orders = await getPackingOrders();

    return NextResponse.json({ orders: JSON.parse(JSON.stringify(orders)) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

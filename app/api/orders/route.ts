import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";
import { getOrdersListData } from "@/modules/orders/actions/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const { orders, totalCount } = await getOrdersListData(
      {
        page: sp.get("page"),
        status: sp.get("status"),
        commune: sp.get("commune"),
        q: sp.get("q"),
        from: sp.get("from"),
        to: sp.get("to"),
        dateType: sp.get("dateType"),
        scope: sp.get("scope"),
      },
      user,
    );

    return NextResponse.json({
      orders: JSON.parse(JSON.stringify(orders)),
      totalCount,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur de chargement" }, { status: 500 });
  }
}

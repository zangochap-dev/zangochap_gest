import { NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";
import { emptySidebarCounts, getSidebarCountsForUser } from "@/modules/orders/actions/sidebar-counts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const counts = await getSidebarCountsForUser(user);
    return NextResponse.json(counts);
  } catch {
    return NextResponse.json(emptySidebarCounts);
  }
}

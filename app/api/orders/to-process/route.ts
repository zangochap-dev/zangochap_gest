import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { status: 'TO_PROCESS' },
      orderBy: { createdAt: "asc" },
      include: { items: true },
    });

    return NextResponse.json({
      orders: JSON.parse(JSON.stringify(orders)),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";
import prisma from "@/lib/prisma";
import { EXCHANGE_PREFIX } from "@/modules/orders/types/exchange";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401, headers });
    if (user.role !== "commercial") return NextResponse.json({ error: "Accès refusé" }, { status: 403, headers });
    const count = await prisma.cmsContent.count({ where: {
      key: { startsWith: EXCHANGE_PREFIX },
      AND: [
        { data: { path: ["commercialId"], equals: user.id } },
        { data: { path: ["status"], equals: "PENDING" } },
      ],
    } });
    return NextResponse.json({ count }, { headers });
  } catch {
    return NextResponse.json({ error: "Rappel temporairement indisponible" }, { status: 503, headers });
  }
}

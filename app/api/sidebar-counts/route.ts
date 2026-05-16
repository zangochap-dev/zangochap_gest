import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = req.nextUrl.searchParams.get("userId") || undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ordersCount, packingCount, toProcessCount, deliveriesCount] = await Promise.all([
      prisma.order.count({ where: { status: 'CONFIRMED' as any, createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: 'CONFIRMED' as any } }),
      prisma.order.count({ where: { status: 'TO_PROCESS' as any } }),
      userId
        ? prisma.order.count({ where: { deliverymanId: userId, status: { notIn: ['DELIVERED', 'CANCELLED'] as any } } })
        : Promise.resolve(0),
    ]);

    return NextResponse.json({
      orders: ordersCount,
      packing: packingCount,
      collection: packingCount,
      toProcess: toProcessCount,
      myDeliveries: deliveriesCount,
    });
  } catch {
    return NextResponse.json({ orders: 0, packing: 0, collection: 0, toProcess: 0, myDeliveries: 0 });
  }
}

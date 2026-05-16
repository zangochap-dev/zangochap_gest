import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {}, // Empty where to fetch everything
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[PACKING_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

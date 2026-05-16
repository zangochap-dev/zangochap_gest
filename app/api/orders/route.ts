import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const page = parseInt(sp.get("page") || "1");
    const limit = 50;
    const skip = (page - 1) * limit;
    const scope = sp.get("scope") || (user.role === "commercial" ? "mine" : "all");

    // Build filters (mirrors page.tsx logic)
    const where: any = {};

    const status = sp.get("status");
    if (status && status !== "all") {
      where.status = status.toUpperCase() as OrderStatus;
    } else {
      where.status = { not: OrderStatus.TO_PROCESS };
    }

    const commune = sp.get("commune");
    if (commune && commune !== "all") {
      where.commune = commune;
    }

    const q = sp.get("q");
    if (q) {
      where.OR = [
        { ref: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q } },
        { commercialName: { contains: q, mode: "insensitive" } },
      ];
    }

    const from = sp.get("from");
    const to = sp.get("to");
    const dateType = sp.get("dateType");
    if (from || to) {
      const dateField = dateType === "delivery" ? "deliveryDate" : "createdAt";
      where[dateField] = {};
      if (from) where[dateField].gte = new Date(from + "T00:00:00");
      if (to) where[dateField].lte = new Date(to + "T23:59:59.999");
    }

    // Role-based restrictions — AND to combine with search
    if (user.role === "commercial" && scope === "mine") {
      const scopeFilter = {
        OR: [
          { commercialId: user.id },
          { commercialName: user.name },
          { commercialName: "Site Web" },
        ],
      };
      if (where.OR) {
        const searchOR = where.OR;
        delete where.OR;
        where.AND = [{ OR: searchOR }, scopeFilter];
      } else {
        where.OR = scopeFilter.OR;
      }
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { items: true },
        take: limit,
        skip,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: JSON.parse(JSON.stringify(orders)),
      totalCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const q = req.nextUrl.searchParams.get("q") || "";
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const category = req.nextUrl.searchParams.get("category") || "";

    const where: any = {
      status: { not: 'DRAFT' }
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    const [products, total, categoryList] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          emoji: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
          stock: true,
          status: true,
          images: { select: { url: true }, take: 1 },
          variants: { select: { id: true, size: true, color: true, stock: true } },
        },
        orderBy: { name: 'asc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        where: { products: { some: { status: { not: 'DRAFT' } } } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Map category name onto product for client convenience
    const enrichedProducts = products.map(p => ({
      ...p,
      categoryName: p.category?.name || null,
    }));

    return NextResponse.json({
      products: JSON.parse(JSON.stringify(enrichedProducts)),
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      page,
      categories: categoryList.map(c => ({ id: c.id, name: c.name })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

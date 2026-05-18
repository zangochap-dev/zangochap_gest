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
    const ids = req.nextUrl.searchParams.get("ids") || "";
    const allStatus = req.nextUrl.searchParams.get("allStatus") === "true";

    const where: any = {};
    if (!allStatus) {
      where.status = { not: 'DRAFT' };
    }

    if (ids) {
      where.id = { in: ids.split(",").filter(Boolean) };
    } else {
      if (q) {
        const terms = q.trim().split(/\s+/).filter(Boolean);
        if (terms.length > 0) {
          where.AND = terms.map(term => ({
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { ref: { contains: term, mode: 'insensitive' } },
              { category: { name: { contains: term, mode: 'insensitive' } } },
              { supplier: { name: { contains: term, mode: 'insensitive' } } },
              { variants: { some: { size: { contains: term, mode: 'insensitive' } } } },
              { variants: { some: { color: { contains: term, mode: 'insensitive' } } } }
            ]
          }));
        }
      }

      if (category) {
        where.categoryId = category;
      }
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
        take: ids ? undefined : PAGE_SIZE,
        skip: ids ? undefined : (page - 1) * PAGE_SIZE,
      }),
      ids ? prisma.product.count({ where }) : prisma.product.count({ where }),
      prisma.category.findMany({
        where: allStatus ? undefined : { products: { some: { status: { not: 'DRAFT' } } } },
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
      totalPages: ids ? 1 : Math.ceil(total / PAGE_SIZE),
      page,
      categories: categoryList.map(c => ({ id: c.id, name: c.name })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

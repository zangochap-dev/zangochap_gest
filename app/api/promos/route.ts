import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { productIds, categoryIds, ...rest } = data;
    
    const promo = await prisma.promoCode.create({
      data: {
        code: rest.code,
        label: rest.label || rest.code,
        type: rest.type,
        value: rest.value || 0,
        giftProductId: rest.giftProductId || null,
        rule: rest.rule || 'UNLIMITED',
        minAmount: rest.minAmount || 0,
        minQuantity: rest.minQuantity || 0,
        maxGlobalUses: rest.maxGlobalUses || null,
        startDate: rest.startDate ? new Date(rest.startDate) : null,
        endDate: rest.endDate ? new Date(rest.endDate) : null,
        isActive: true,
        isAutomatic: rest.isAutomatic || false,
        creatorId: rest.creatorId,
        products: productIds?.length ? {
          connect: productIds.map((id: string) => ({ id }))
        } : undefined,
        categories: categoryIds?.length ? {
          connect: categoryIds.map((id: string) => ({ id }))
        } : undefined,
      },
    });
    return NextResponse.json(promo);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { code, productIds, categoryIds, ...rest } = data;
    
    const updateData: any = {
      ...rest,
      startDate: rest.startDate ? new Date(rest.startDate) : rest.startDate === null ? null : undefined,
      endDate: rest.endDate ? new Date(rest.endDate) : rest.endDate === null ? null : undefined,
    };

    if (productIds !== undefined) {
      updateData.products = {
        set: productIds.map((id: string) => ({ id }))
      };
    }
    if (categoryIds !== undefined) {
      updateData.categories = {
        set: categoryIds.map((id: string) => ({ id }))
      };
    }

    await prisma.promoCode.update({
      where: { code },
      data: updateData,
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 });
    await prisma.promoUsage.deleteMany({ where: { promoCode: code } });
    await prisma.promoCode.delete({ where: { code } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

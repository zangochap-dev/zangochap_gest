import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const promo = await prisma.promoCode.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value || 0,
        giftProductId: data.giftProductId || null,
        rule: data.rule || 'UNLIMITED',
        minAmount: data.minAmount || 0,
        maxGlobalUses: data.maxGlobalUses || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: true,
        creatorId: data.creatorId,
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
    const { code, ...rest } = data;
    await prisma.promoCode.update({
      where: { code },
      data: {
        ...rest,
        startDate: rest.startDate ? new Date(rest.startDate) : undefined,
        endDate: rest.endDate ? new Date(rest.endDate) : undefined,
      },
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

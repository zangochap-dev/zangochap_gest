import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeHomeCms } from "@/modules/cms/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await prisma.cmsContent.findUnique({
      where: { key: "home" },
      select: { data: true },
    });

    return NextResponse.json({
      content: normalizeHomeCms(content?.data),
    });
  } catch {
    return NextResponse.json({
      content: normalizeHomeCms(null),
    });
  }
}

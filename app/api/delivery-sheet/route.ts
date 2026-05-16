import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json([]);

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'PENDING', 'TO_PROCESS'] },
      OR: [
        { deliveryDate: { gte: startOfDay, lte: endOfDay } },
        { 
          AND: [
            { deliveryDate: null },
            { createdAt: { gte: startOfDay, lte: endOfDay } }
          ]
        }
      ]
    },
    include: { 
      items: {
        include: {
          product: {
            include: {
              variants: {
                include: {
                  stockLevels: { include: { warehouse: true } }
                }
              }
            }
          }
        }
      } 
    },
    orderBy: { commune: 'asc' },
  });

  return NextResponse.json(orders);
}

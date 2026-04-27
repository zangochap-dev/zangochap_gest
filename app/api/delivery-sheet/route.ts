import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json([]);

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['PACKED', 'CONFIRMED', 'PARTIAL'] },
      createdAt: { gte: startOfDay, lte: endOfDay },
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

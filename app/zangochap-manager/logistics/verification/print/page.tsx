import prisma from "@/lib/prisma";
import { formatDay } from "@/lib/constants";
import React from "react";

import PrintActions from "@/modules/logistics/verification/PrintActions";

export const dynamic = 'force-dynamic';

export default async function VerificationPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; type?: string; autoprint?: string }>;
}) {
  const { date, type = 'created', autoprint } = await searchParams;
  if (!date) return <div className="p-10 text-center">Date manquante</div>;

  // ... (rest of the data fetching remains same)

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let dateFilter: any;
  if (type === 'created') {
    dateFilter = { createdAt: { gte: startOfDay, lte: endOfDay } };
  } else {
    dateFilter = {
      OR: [
        { deliveryDate: { gte: startOfDay, lte: endOfDay } },
        { 
          AND: [
            { deliveryDate: null },
            { createdAt: { gte: startOfDay, lte: endOfDay } }
          ]
        }
      ]
    };
  }

  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'PENDING', 'TO_PROCESS'] },
      deletedAt: null,
      ...dateFilter
    },
    include: { 
      items: true
    },
    orderBy: { commune: 'asc' },
  });

  return (
    <div className="bg-white min-h-screen text-black font-mono p-1">
      {/* PRINT CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body, .app-container, .main-content, .main-scroll-area {
            height: auto !important;
            overflow: visible !important;
            display: block !important;
          }
          .sidebar, .topbar, aside, nav, .no-print { display: none !important; }
          @page { margin: 0.3cm; size: A4; }
          body { font-size: 8px; line-height: 1; }
          
          .orders-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 5px;
          }

          .order-container { 
            page-break-inside: avoid !important; 
            border: 0.1px solid #ddd; 
            margin-bottom: 3px; 
            padding: 2px;
          }
          
          .item-row {
            display: flex;
            border-bottom: 0.1px solid #f0f0f0;
          }
          .item-qty { font-weight: 900; min-width: 12px; text-align: center; border-left: 0.5px solid #eee; }
        }
        .cb { width: 7px; height: 7px; border: 0.5px solid #000; display: inline-block; margin-right: 2px; }
      `}} />

      <PrintActions autoPrint={autoprint === 'true'} />

      {/* DENSE GRID (3 COLUMNS) */}
      <div className="orders-grid">
        {orders.map((order) => (
          <div key={order.id} className="order-container">
            <div className="flex items-center border-b border-black/10 mb-0.5 font-black uppercase text-[14px] tracking-tighter font-sans">
              <div className="cb" />
              {order.ref}
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="item-row">
                <span className="flex-1 truncate">{item.name}</span>
                <span className="item-qty">{item.qty}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

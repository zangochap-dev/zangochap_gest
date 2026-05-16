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

  const totalItems = orders.reduce((sum, o) => sum + o.items.length, 0);

  return (
    <div className="bg-white min-h-screen text-black font-sans p-2">
      {/* PRINT CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* DEBLOQUER LE LAYOUT PARENT POUR AFFICHER TOUTES LES PAGES */
          html, body, .app-container, .main-content, .main-scroll-area {
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
          }
          
          /* CACHER LE SURPLUS DU MANAGER */
          .sidebar, .topbar, aside, nav, .no-print {
            display: none !important;
          }

          @page { margin: 0.5cm; size: A4; }
          body { background: white; margin: 0; padding: 0; font-size: 10px; color: black; line-height: 1.1; }
          
          .order-container { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important; 
            border: 1px solid #000; 
            margin-bottom: 8px; 
            padding: 2px;
            display: block !important;
          }
          
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; }
          tr { page-break-inside: avoid; }
        }
        .checkbox-box { width: 14px; height: 14px; border: 1.2px solid #000; display: inline-block; vertical-align: middle; }
      `}} />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 border-b border-black pb-2 px-2">
        <h1 className="text-xl font-black tracking-tighter uppercase">ZANGOCHAP · Fiche de Vérification</h1>
        <div className="text-right flex gap-4 items-center">
          <span className="text-sm font-black">{formatDay(date)}</span>
          <span className="text-xs border-l border-black pl-4"><b>{orders.length}</b> colis / <b>{totalItems}</b> articles</span>
        </div>
      </div>

      {/* BUTTONS (HIDDEN ON PRINT) */}
      <PrintActions autoPrint={autoprint === 'true'} />

      {/* ORDERS LIST */}
      <div className="space-y-2">
        {orders.length === 0 ? (
          <p className="text-center py-10 text-gray-400">Aucune commande.</p>
        ) : (
          orders.map((order, idx) => (
            <div key={order.id} className="order-container">
              {/* Ultra Compact Header */}
              <div className="flex justify-between items-center mb-1 px-1 border-b border-black/10 pb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-400 text-[10px]">#{idx + 1}</span>
                  <span className="font-mono font-black text-sm">{order.ref}</span>
                </div>
                <div className="text-[10px] font-black uppercase bg-gray-100 px-1 rounded">
                  {order.commune}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full">
                <tbody className="divide-y divide-black">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="w-6 text-center">
                        <div className="checkbox-box" />
                      </td>
                      <td className="py-0.5">
                        <span className="font-bold">{item.name}</span>
                        {(item.size || item.color) && (
                          <span className="ml-2 text-gray-600 text-[9px]">
                             {[item.size, item.color].filter(Boolean).join(" / ")}
                          </span>
                        )}
                      </td>
                      <td className="w-8 text-center font-black text-sm">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes - Only if exists */}
              {(order.notes || order.deliveryNote) && (
                <div className="mt-0.5 px-1 text-[9px] text-gray-600 italic">
                   <b>Note:</b> {order.notes} {order.deliveryNote}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FOOTER PAGE */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-[9pt] text-gray-500 italic no-print">
        Fin de la fiche de vérification logistique · ZANGOCHAP
      </div>
    </div>
  );
}

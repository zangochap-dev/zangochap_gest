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
    <div className="bg-white min-h-screen text-black font-sans p-4 sm:p-8">
      {/* PRINT CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* DEBLOQUER LE LAYOUT PARENT */
          html, body, .app-container, .main-content, .main-scroll-area {
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
          }
          
          /* CACHER LE SURPLUS DU MANAGER */
          .sidebar, .topbar, aside, nav {
            display: none !important;
          }

          @page { margin: 1.5cm 1cm; size: A4; }
          body { background: white; margin: 0; padding: 0; font-size: 11pt; color: black; }
          .no-print { display: none !important; }
          
          .order-container { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important; 
            border-bottom: 1px solid #000; 
            margin-bottom: 15px; 
            display: block !important;
          }
          
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
        .checkbox-box { width: 16px; height: 16px; border: 1.5px solid #000; display: inline-block; vertical-align: middle; }
      `}} />

      {/* HEADER */}
      <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">ZANGOCHAP</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-700">Fiche de Vérification Logistique</p>
          <p className="text-lg font-medium">{formatDay(date)}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black">{orders.length}</div>
          <div className="text-xs font-bold uppercase text-gray-500">Colis à vérifier</div>
          <div className="text-sm font-bold mt-1">{totalItems} articles au total</div>
        </div>
      </div>

      {/* BUTTON TO TRIGGER PRINT (ONLY VISIBLE ON SCREEN) */}
      <PrintActions autoPrint={autoprint === 'true'} />

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-center py-20 text-gray-400 font-bold italic">Aucune commande pour cette date.</p>
        ) : (
          orders.map((order, idx) => (
            <div key={order.id} className="order-container border-b border-black pb-2">
              {/* Order Info Bar - Ultra Compact */}
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-gray-400 text-sm">#{idx + 1}</span>
                  <span className="font-mono bg-black text-white px-2 py-0.5 rounded text-lg font-black">{order.ref}</span>
                  <span className="text-xs font-medium text-gray-500 truncate max-w-[150px]">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-gray-600">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded">{order.commune}</span>
                  <span>{order.customerPhone}</span>
                </div>
              </div>

              {/* Items Table - Simplified */}
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-y border-black/10 text-left text-gray-400 uppercase text-[9px] tracking-wider">
                    <th className="w-8 py-1 px-2 text-center">✓</th>
                    <th className="py-1 px-2">Désignation / Variantes</th>
                    <th className="w-12 py-1 px-2 text-center">Qté</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1.5 px-2 text-center">
                        <div className="checkbox-box scale-90" />
                      </td>
                      <td className="py-1.5 px-2">
                        <span className="font-bold text-sm mr-2">{item.name}</span>
                        {(item.size || item.color) && (
                          <span className="text-gray-600 italic">
                            ({[item.size, item.color].filter(Boolean).join(" / ")})
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-center font-black text-lg">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes - Compact */}
              {(order.notes || order.deliveryNote) && (
                <div className="mt-1 px-2 text-[9px] text-gray-500 leading-tight">
                  <span className="font-bold mr-1">Note:</span>
                  {order.notes} {order.deliveryNote && `| ${order.deliveryNote}`}
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

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/modules/auth/actions";
import { generateUniqueRef } from "@/modules/orders/helpers";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const user = session;

    const type = req.nextUrl.searchParams.get('type');
    const data = await req.json();
    
    if (!Array.isArray(data)) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    let count = 0;

    if (type === 'products') {
      for (const item of data) {
        try {
          await prisma.product.create({
            data: {
              name: item.name || item.nom || 'Sans nom',
              category: item.category || item.categorie || 'accessories',
              price: parseInt(item.price || item.prix || '0'),
              oldPrice: item.oldPrice ? parseInt(item.oldPrice) : null,
              description: item.description || '',
              material: item.material || item.matiere || '',
              origin: item.origin || item.provenance || '',
              stock: parseInt(item.stock || '0'),
              location: item.location || item.emplacement || '',
              supplier: item.supplier || item.fournisseur || '',
              creatorId: user.id,
            },
          });
          count++;
        } catch {
          // Skip individual failures
        }
      }
    } else if (type === 'orders') {
      for (const item of data) {
        try {
          const ref = await generateUniqueRef(item.commune || 'Cocody');

          await prisma.order.create({
            data: {
              ref,
              customerName: item.customerName || item.client || 'Client',
              customerPhone: item.customerPhone || item.telephone || '',
              customerLocation: item.customerLocation || item.adresse || '',
              commune: item.commune || '',
              total: parseInt(item.total || '0'),
              deliveryFee: parseInt(item.deliveryFee || item.fraisLivraison || '0'),
              status: 'PENDING',
              commercialId: user.id,
              commercialName: user.name,
              history: [{
                at: new Date().toISOString(),
                action: `Importé par ${user.name}`,
                by: user.email,
                byName: user.name,
              }],
            },
          });
          count++;
        } catch {
          // Skip individual failures
        }
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

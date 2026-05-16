import prisma from "@/lib/prisma";
import { COMMUNES } from "@/lib/constants";

// ============ ROLE HELPER ============
export function isRole(session: any, ...roles: string[]) {
  if (!session?.role) return false;
  const r = session.role.toLowerCase();
  return roles.some(role => role.toLowerCase() === r);
}

// ============ ACCESS HELPER ============
export function checkOrderAccess(order: any, session: any) {
  if (!session) return false;
  const role = session.role?.toUpperCase();

  if (role === 'ADMIN') return true;

  if (role === 'COMMERCIAL') return true;

  if (role === 'LIVREUR') {
    return order.deliverymanId === session.id;
  }

  if (['PACKING', 'STOCK', 'COLLECTION'].includes(role)) return true;

  return false;
}

// ============ REF GENERATOR ============
export async function generateUniqueRef(commune?: string, typePrefix?: string) {
  const communePrefix = (commune && COMMUNES[commune]) || 'BJ';

  const basePrefix = typePrefix && typePrefix !== 'Standard'
    ? `${typePrefix.toUpperCase().replace(/É/g, 'E')}${communePrefix}`
    : communePrefix;

  // Find the highest existing sequence GLOBALLY to ensure numeric uniqueness across prefixes
  // We look at the most recent orders to find the last used number
  const lastOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { ref: true }
  });

  let maxSequence = 0;
  for (const o of lastOrders) {
    const match = o.ref.match(/(\d{4})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSequence) {
        maxSequence = num;
        break; // We take the most recent one as the base
      }
    }
  }

  let nextSequence = maxSequence + 1;
  if (nextSequence < 1) nextSequence = 1;

  // Try up to 10 times to find a truly unique candidate globally
  for (let attempt = 0; attempt < 10; attempt++) {
    const sequenceStr = (nextSequence + attempt).toString().padStart(4, '0');
    const candidate = `${basePrefix}${sequenceStr}`;
    
    // Check if THIS EXACT candidate exists
    const existing = await prisma.order.findUnique({ where: { ref: candidate }, select: { id: true } });
    
    // ALSO check if ANY reference ends with this sequence (optional but safer for strict uniqueness)
    // For now, checking findUnique is enough to prevent exact duplicates. 
    // If we want to prevent AB0287 if CD0287 exists, we should check with endsWith.
    
    const globalCheck = await prisma.order.findFirst({
      where: { ref: { endsWith: sequenceStr } },
      select: { id: true }
    });

    if (!existing && !globalCheck) return candidate;
    
    // If globalCheck found something, it means this number is already taken by another prefix
    // So we continue the loop with the next number
  }

  // Fallback: Use timestamp if we can't find a sequential one
  return `${basePrefix}${Date.now().toString().slice(-6)}`;
}

// ============ CUSTOMER UPSERT ============
export async function upsertCustomerFromOrder(data: {
  name: string; phone: string; phone2?: string; location?: string; commune?: string; orderAmount: number;
}) {
  const existing = await prisma.customer.findUnique({ where: { phone: data.phone } });
  if (existing) {
    return prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        phone2: data.phone2 || existing.phone2,
        location: data.location || existing.location,
        commune: data.commune || existing.commune,
        totalOrders: { increment: 1 },
        totalSpent: { increment: data.orderAmount },
        lastOrderAt: new Date(),
      },
    });
  }
  return prisma.customer.create({
    data: {
      name: data.name, phone: data.phone, phone2: data.phone2, location: data.location, commune: data.commune,
      totalOrders: 1, totalSpent: data.orderAmount, lastOrderAt: new Date(),
    },
  });
}

// ============ WAREHOUSE HELPER ============
export async function getOrCreateDefaultWarehouse() {
  let warehouse = await prisma.warehouse.findFirst({
    where: { name: "Entrepôt Principal" }
  });

  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: "Entrepôt Principal",
        location: "Siège Zangochap"
      }
    });
  }
  return warehouse;
}

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

  // Find the highest existing sequence for this prefix in a single query
  const lastWithPrefix = await prisma.order.findFirst({
    where: { ref: { startsWith: basePrefix } },
    orderBy: { ref: 'desc' },
    select: { ref: true }
  });

  let nextSequence = 1;
  if (lastWithPrefix) {
    const match = lastWithPrefix.ref.match(/(\d+)$/);
    if (match) {
      nextSequence = parseInt(match[1], 10) + 1;
    }
  }

  // Try up to 5 times in case of near-concurrent inserts, then fallback to timestamp
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${basePrefix}${(nextSequence + attempt).toString().padStart(4, '0')}`;
    const existing = await prisma.order.findUnique({ where: { ref: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }

  // Timestamp fallback — guaranteed unique
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

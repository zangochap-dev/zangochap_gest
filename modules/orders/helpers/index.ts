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
  
  if (role === 'COMMERCIAL') {
    return order.commercialId === session.id;
  }

  if (role === 'LIVREUR') {
    return order.deliverymanId === session.id;
  }

  if (['PACKING', 'STOCK', 'COLLECTION'].includes(role)) return true;

  return false;
}

// ============ REF GENERATOR ============
export async function generateUniqueRef(commune?: string, typePrefix?: string) {
  const communePrefix = (commune && COMMUNES[commune]) || 'BJ';

  // Better normalization: NFD + strip non-alphanumeric
  const normalize = (text: string) => text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();

  const basePrefix = typePrefix && typePrefix !== 'Standard'
    ? `${normalize(typePrefix)}${communePrefix}`
    : communePrefix;

  // Find the highest existing sequence globally so an exchange created from
  // PL0588 becomes ECHANGEPL0589, not ECHANGEPL0588.
  const existingRefs = await prisma.order.findMany({
    select: { ref: true },
  });

  let maxSequence = 0;
  for (const o of existingRefs) {
    const match = o.ref.match(/(\d{4})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSequence) maxSequence = num;
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
  return prisma.customer.upsert({
    where: { phone: data.phone },
    update: {
      name: data.name,
      phone2: data.phone2,
      location: data.location,
      commune: data.commune,
      totalOrders: { increment: 1 },
      totalSpent: { increment: data.orderAmount },
      lastOrderAt: new Date(),
    },
    create: {
      name: data.name,
      phone: data.phone,
      phone2: data.phone2,
      location: data.location,
      commune: data.commune,
      totalOrders: 1,
      totalSpent: data.orderAmount,
      lastOrderAt: new Date(),
    },
  });
}

// ============ WAREHOUSE HELPER ============
export async function getOrCreateDefaultWarehouse() {
  const existing = await prisma.warehouse.findFirst({
    where: {
      OR: [
        { name: "Entrepôt Principal" },
        { name: "Entrepôt  principal" },
        { name: "Entrepot Principal" },
        { name: "Entrepot  principal" },
        { name: "Magasin Principal" },
      ],
    },
  });

  if (existing) return existing;

  return prisma.warehouse.create({
    data: {
      name: "Entrepôt Principal",
      location: "Siège Zangochap"
    }
  });
}

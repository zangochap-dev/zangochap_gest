import { RiderOrder } from "./types";

export function calculateOrderDueTotal(order: RiderOrder): number {
  const subtotal = order.total || 0;
  const fee = order.deliveryFee || 0;
  const discount = order.discount || 0;
  return Math.max(0, subtotal + fee - discount);
}

/**
 * Calculates the total amount a rider collected or should collect.
 */
export function calculateOrderCollectionTotal(order: RiderOrder): number {
  if (order.amountReceived !== null && order.amountReceived !== undefined) {
    return Math.max(0, Number(order.amountReceived) || 0);
  }
  return calculateOrderDueTotal(order);
}

/**
 * Calculates the summary for a partial delivery.
 * Only counts items with deliveredQuantities > 0.
 */
export function calculatePartialSummary(
  order: RiderOrder,
  deliveredQuantities: Record<string, number>,
  includeDeliveryFee: boolean
): { subtotal: number; total: number; fee: number } {
  let subtotal = 0;
  for (const item of order.items) {
    const dQty = deliveredQuantities[item.id] || 0;
    subtotal += (item.price || 0) * dQty;
  }

  const fee = includeDeliveryFee ? (order.deliveryFee || 0) : 0;
  const total = Math.max(0, subtotal + fee - (order.discount || 0));

  return { subtotal, total, fee };
}

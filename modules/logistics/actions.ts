"use server";

import * as collectionActions from "./collection/actions";
import * as verificationActions from "./verification/actions";

// Compatibility facade. Prefer domain-specific imports:
// - "@/modules/logistics/collection/actions"
// - "@/modules/logistics/verification/actions"

export async function getCollectionRecords(filters?: { byName?: string }) {
  return collectionActions.getCollectionRecords(filters);
}

export async function markCollection(
  orderId: string,
  productId: string,
  status: string,
  orderItemId?: string,
  note?: string,
) {
  return collectionActions.markCollection({ orderId, productId, status, orderItemId, note });
}

export async function getItemsToCollect() {
  return collectionActions.getItemsToCollect();
}

export async function toggleItemVerification(orderItemId: string, isVerified: boolean) {
  return verificationActions.toggleItemVerification(orderItemId, isVerified);
}

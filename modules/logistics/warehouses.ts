"use server";

import * as warehouseActions from "./warehouseActions";

export async function getWarehouses() {
  return warehouseActions.getWarehouses();
}

export async function getWarehouseStock(warehouseId: string) {
  return warehouseActions.getWarehouseStock(warehouseId);
}

export async function deleteWarehouse(id: string) {
  return warehouseActions.deleteWarehouse(id);
}

export async function createWarehouse(data: { name: string; location?: string }) {
  return warehouseActions.createWarehouse(data);
}

export async function updateWarehouse(id: string, data: { name: string; location?: string; isActive?: boolean }) {
  return warehouseActions.updateWarehouse(id, data);
}

export async function getVariantStockDetails(variantId: string) {
  return warehouseActions.getVariantStockDetails(variantId);
}

export async function transferStock(data: Parameters<typeof warehouseActions.transferStock>[0]) {
  return warehouseActions.transferStock(data);
}

export async function adjustStock(data: Parameters<typeof warehouseActions.adjustStock>[0]) {
  return warehouseActions.adjustStock(data);
}

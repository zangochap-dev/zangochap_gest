"use server";

import * as actions from "./actions";

export async function getProducts(filters?: Parameters<typeof actions.getProducts>[0]) {
    return actions.getProducts(filters);
}

export async function getProductById(id: string) {
    return actions.getProductById(id);
}

export async function createProduct(data: Parameters<typeof actions.createProduct>[0]) {
    return actions.createProduct(data);
}

export async function updateProductVariants(
    productId: string,
    variants: Parameters<typeof actions.updateProductVariants>[1],
) {
    return actions.updateProductVariants(productId, variants);
}

export async function updateProduct(id: string, data: Parameters<typeof actions.updateProduct>[1]) {
    return actions.updateProduct(id, data);
}

export async function deleteProduct(id: string) {
    return actions.deleteProduct(id);
}

export async function markProductSent(productId: string) {
    return actions.markProductSent(productId);
}

export async function fixAllProductStocks() {
    return actions.fixAllProductStocks();
}

export async function getStockMovements(productId?: string) {
    return actions.getStockMovements(productId);
}

export async function getAutomaticDiscountAction(
    cart: Parameters<typeof actions.getAutomaticDiscountAction>[0],
    customerPhone?: string,
    customerId?: string
) {
    return actions.getAutomaticDiscountAction(cart, customerPhone, customerId);
}

export async function validatePromoCodeAction(
    code: string,
    cart: Parameters<typeof actions.validatePromoCodeAction>[1],
    customerPhone?: string,
    customerId?: string
) {
    return actions.validatePromoCodeAction(code, cart, customerPhone, customerId);
}


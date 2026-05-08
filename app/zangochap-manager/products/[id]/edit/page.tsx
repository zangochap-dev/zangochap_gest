import React from "react";
import { getProductById } from "@/modules/products/actions";
import { getWarehouses } from "@/modules/logistics/warehouseActions";
import { getCategories, getSuppliers } from "@/modules/settings/actions";
import EditProductClient from "./EditProductClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  
  if (!product) {
    return notFound();
  }

  const warehouses = await getWarehouses();
  const categories = await getCategories();
  const suppliers = await getSuppliers();
  
  return (
    <EditProductClient 
      product={JSON.parse(JSON.stringify(product))}
      warehouses={JSON.parse(JSON.stringify(warehouses))} 
      categories={JSON.parse(JSON.stringify(categories))} 
      suppliers={JSON.parse(JSON.stringify(suppliers))}
    />
  );
}

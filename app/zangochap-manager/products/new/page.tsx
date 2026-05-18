import React from "react";
import { getWarehouses } from "@/modules/logistics/warehouses";
import { getCategories, getSuppliers } from "@/modules/settings/actions";
import NewProductClient from "@/modules/products/components/NewProductClient";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const warehouses = await getWarehouses();
  const categories = await getCategories();
  const suppliers = await getSuppliers();
  
  return (
    <NewProductClient 
      warehouses={JSON.parse(JSON.stringify(warehouses))} 
      categories={JSON.parse(JSON.stringify(categories))} 
      suppliers={JSON.parse(JSON.stringify(suppliers))}
    />
  );
}

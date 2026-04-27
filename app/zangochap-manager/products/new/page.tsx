import React from "react";
import { getWarehouses } from "@/modules/logistics/warehouseActions";
import NewProductClient from "./NewProductClient";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const warehouses = await getWarehouses();
  
  return (
    <NewProductClient warehouses={JSON.parse(JSON.stringify(warehouses))} />
  );
}

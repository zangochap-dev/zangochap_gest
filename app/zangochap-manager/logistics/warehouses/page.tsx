import { getWarehouses } from "@/modules/logistics/warehouseActions";
import WarehouseClient from "./WarehouseClient";

export default async function WarehousesPage() {
  const warehouses = await getWarehouses();

  return <WarehouseClient initialWarehouses={warehouses} />;
}

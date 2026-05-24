import { getWarehouses } from "@/modules/logistics/warehouses";
import WarehouseClient from "./WarehouseClient";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const warehouses = await getWarehouses();

  return <WarehouseClient initialWarehouses={warehouses} />;
}

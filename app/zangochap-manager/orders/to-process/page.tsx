import React from "react";
import Topbar from "@/components/Topbar";
import ToProcessClient from "@/modules/orders/components/ToProcessClient";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import { getToProcessOrders } from "@/modules/orders/actions/queries";

export const dynamic = "force-dynamic";

export default async function ToProcessOrdersPage() {
  const user = await getSession();
  if (!user) redirect("/zangochap-manager");

  const orders = await getToProcessOrders();

  return (
    <>
      <Topbar title="Commandes" subtitle="à traiter (site web)" />
      <ToProcessClient orders={JSON.parse(JSON.stringify(orders))} />
    </>
  );
}

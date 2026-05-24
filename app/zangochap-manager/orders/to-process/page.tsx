import React from "react";
import Topbar from "@/components/Topbar";
import ToProcessClient from "@/modules/orders/components/ToProcessClient";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import { getOrdersStaffData, getToProcessOrders, getNextRoundRobinCommercial, getRoundRobinState } from "@/modules/orders/actions/queries";

export const dynamic = "force-dynamic";

export default async function ToProcessOrdersPage() {
  const user = await getSession();
  if (!user) redirect("/zangochap-manager");

  const [orders, { staffUsers }, nextInRotation, rrState] = await Promise.all([
    getToProcessOrders(user),
    getOrdersStaffData(),
    getNextRoundRobinCommercial(),
    getRoundRobinState(),
  ]);
  const callCenterUsers = staffUsers.filter((staff) => ['ADMIN', 'COMMERCIAL'].includes(staff.role));

  return (
    <>
      <Topbar title="Commandes" subtitle="à traiter (site web)" />
      <ToProcessClient
        orders={JSON.parse(JSON.stringify(orders))}
        user={JSON.parse(JSON.stringify(user))}
        callCenterUsers={JSON.parse(JSON.stringify(callCenterUsers))}
        nextInRotation={JSON.parse(JSON.stringify(nextInRotation))}
        activeCommercialIds={JSON.parse(JSON.stringify(rrState.activeCommercialIds))}
      />
    </>
  );
}

import React from "react";
import { getTodayLabels } from "@/modules/logistics/labels/actions";
import LabelsClient from "@/modules/logistics/labels/LabelsClient";
import { getSession } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

export default async function LabelsPage() {
  const session = await getSession();
  const orders = await getTodayLabels();

  const currentUser = {
    name: session?.name || "Utilisateur",
    role: session?.role || "admin",
  };

  return <LabelsClient initialOrders={orders.map((order) => ({
    ...order,
    ref: order.ref || "Sans reference",
  }))} currentUser={currentUser} />;
}

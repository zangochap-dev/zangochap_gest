import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import ToProcessClient from "./ToProcessClient";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ToProcessOrdersPage() {
  const user = await getSession();
  if (!user) redirect("/zangochap-manager");

  const orders = await prisma.order.findMany({
    where: { status: 'TO_PROCESS' },
    orderBy: { createdAt: "asc" },
    include: { items: true },
  });

  return (
    <>
      <Topbar title="Commandes" subtitle="à traiter (site web)" />
      <ToProcessClient orders={JSON.parse(JSON.stringify(orders))} />
    </>
  );
}

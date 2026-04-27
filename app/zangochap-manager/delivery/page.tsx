import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import DeliveryClient from "./DeliveryClient";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const user = await getSession();
  if (!user) redirect("/zangochap-manager");

  const orders = await prisma.order.findMany({
    where: {
      deliverymanId: user.id,
    },
    orderBy: { updatedAt: "desc" },
    include: { items: true },
    take: 50, // Fetch recent 50 to cover pending + history
  });

  return (
    <>
      <Topbar title="Mes" subtitle="livraisons" />
      <DeliveryClient orders={JSON.parse(JSON.stringify(orders))} user={user} />
    </>
  );
}

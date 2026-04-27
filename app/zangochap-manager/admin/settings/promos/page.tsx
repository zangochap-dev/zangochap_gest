import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/modules/auth/actions";
import PromoClient from "./PromoClient";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function SettingsPromosPage() {
  const user = await getSession();
  if (user?.role !== 'admin') {
    return <div className="content"><div className="empty"><h4>Accès refusé</h4></div></div>;
  }

  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { usages: true },
  });

  return (
    <>
      <Topbar title="Configuration" subtitle="codes promos" />
      <PromoClient promos={JSON.parse(JSON.stringify(promos))} user={user} />
    </>
  );
}

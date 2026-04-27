import React from "react";
import prisma from "@/lib/prisma";
import CRMClient from "./crm-client";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function CRMPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { lastOrderAt: 'desc' },
  });

  return (
    <>
      <Topbar title="Gestion" subtitle="Clients (CRM)" />
      <CRMClient initialCustomers={JSON.parse(JSON.stringify(customers))} />
    </>
  );
}

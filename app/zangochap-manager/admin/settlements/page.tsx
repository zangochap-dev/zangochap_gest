import React from "react";
import { getAccounts, getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import SettlementsClient from "./SettlementsClient";
import { getSettlementStats } from "@/modules/orders/actions";

export const dynamic = "force-dynamic";

type SettlementsPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    commercialId?: string;
    method?: string;
  }>;
};

export default async function SettlementsPage({ searchParams }: SettlementsPageProps) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "developer")) redirect("/zangochap-manager");

  const resolvedParams = await searchParams;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const from = resolvedParams.from || today;
  const to = resolvedParams.to || today;
  const commercialId = resolvedParams.commercialId;
  const method = resolvedParams.method;
  const stats = await getSettlementStats(from, to, commercialId, method);
  const allUsers = await getAccounts();
  const commercials = allUsers.filter((user) => user.role === "COMMERCIAL");

  return (
    <div className="admin-page">
      <SettlementsClient
        initialStats={{
          ...stats,
          orders: stats.orders.map((order) => ({
            ...order,
            ref: order.ref || "Sans reference",
          })),
        }}
        initialFrom={from}
        initialTo={to}
        commercials={commercials}
        initialCommercialId={commercialId}
        initialMethod={method}
      />
    </div>
  );
}

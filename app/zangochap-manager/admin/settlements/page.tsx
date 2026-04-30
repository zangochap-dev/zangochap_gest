import React from "react";
import { getSession } from "@/modules/auth/actions";
import { redirect } from "next/navigation";
import SettlementsClient from "./SettlementsClient";
import { getSettlementStats } from "@/modules/orders/actions";
import { getAccounts } from "@/modules/auth/actions";

export default async function SettlementsPage({ searchParams }: { searchParams: any }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect("/zangochap-manager");

  const { from, to, commercialId, method } = await searchParams || {};
  
  const stats: any = await getSettlementStats(from, to, commercialId, method);
  const allUsers = await getAccounts();
  const commercials = allUsers.filter(u => u.role === 'COMMERCIAL');

  return (
    <div className="admin-page">
      <SettlementsClient 
        initialStats={stats} 
        initialRiderStats={{ riders: [], orders: [] }}
        initialFrom={from} 
        initialTo={to} 
        commercials={commercials}
        riders={[]}
        initialCommercialId={commercialId}
        initialMethod={method}
        initialTab={"accounts"}
      />
    </div>
  );
}

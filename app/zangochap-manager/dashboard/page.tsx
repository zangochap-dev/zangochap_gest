import React from "react";
import Topbar from "@/components/Topbar";
import AdminDashboard from "./AdminDashboard";
import CommercialDashboard from "./CommercialDashboard";
import PackingDashboard from "./PackingDashboard";
import CollectionDashboard from "./CollectionDashboard";
import StockDashboard from "./StockDashboard";
import { getSession } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

const GREETINGS: Record<string, string> = {
  commercial: "bord commercial",
  packing: "bord emballage",
  collection: "bord collecte",
  stock: "bord stock",
  admin: "bord admin",
};

export default async function DashboardPage() {
  const user = await getSession();
  const firstName = user?.name?.split(' ')[0] || '';
  const subtitle = GREETINGS[user?.role] || 'bord';

  const dashboards: Record<string, any> = {
    admin: AdminDashboard,
    commercial: CommercialDashboard,
    packing: PackingDashboard,
    collection: CollectionDashboard,
    stock: StockDashboard,
  };

  const DashboardView = dashboards[user?.role] || AdminDashboard;

  return (
    <DashboardView user={user} />
  );
}

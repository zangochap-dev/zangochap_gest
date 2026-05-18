import React from "react";
import Topbar from "@/components/Topbar";
import PackingClient from "@/modules/logistics/packing/PackingClient";
import { getPackingPageData } from "@/modules/logistics/packing/data";

export const dynamic = "force-dynamic";

export default async function PackingPage() {
  const data = await getPackingPageData();

  return (
    <React.Suspense fallback={<div className="p-8 text-center opacity-50">Chargement du service emballage...</div>}>
      <Topbar title="Service" subtitle="emballage" />
      <PackingClient
        initialOrders={data.orders}
        products={data.products}
        user={data.user}
      />
    </React.Suspense>
  );
}

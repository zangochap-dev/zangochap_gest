import React from "react"; // Refresh v1
import Topbar from "@/components/Topbar";
import CollectionClient from "./CollectionClient";
import { getCollectionPageData } from "@/modules/logistics/collection/data";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const data = await getCollectionPageData();

  return (
    <React.Suspense fallback={<div className="p-8 text-center opacity-50">Chargement de la collecte...</div>}>
      <Topbar title="Logistique" subtitle="Collecte" />
      <CollectionClient 
        toCollect={data.toCollect} 
        user={data.user} 
        categories={data.categories} 
        warehouses={data.warehouses}
      />
    </React.Suspense>
  );
}

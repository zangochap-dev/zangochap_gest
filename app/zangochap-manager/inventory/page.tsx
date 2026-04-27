import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    include: { variants: true, category: true, supplier: true },
    orderBy: { stock: 'asc' }
  });

  return (
    <>
      <Topbar title="Stock" subtitle="& inventaire" />
      <InventoryClient initialProducts={JSON.parse(JSON.stringify(products))} />
    </>
  );
}

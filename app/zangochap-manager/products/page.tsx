import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await getSession();
  
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: true, images: true, createdBy: true },
  });

  return (
    <>
      <Topbar title="Catalogue" subtitle="produits" />
      <ProductsClient 
        initialProducts={JSON.parse(JSON.stringify(products))} 
        user={user}
      />
    </>
  );
}

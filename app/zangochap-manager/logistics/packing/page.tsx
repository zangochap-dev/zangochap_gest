import React from "react";
import prisma from "@/lib/prisma";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import PackingClient from "./PackingClient";

export const dynamic = "force-dynamic";

export default async function PackingPage() {
  const user = await getSession();

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const products = await prisma.product.findMany({
    include: { 
      variants: {
        include: {
          stockLevels: {
            include: { warehouse: true }
          }
        }
      },
      category: true,
      supplier: true
    },
  });

  return (
    <>
      <Topbar title="Service" subtitle="emballage" />
      <PackingClient
        initialOrders={JSON.parse(JSON.stringify(orders))}
        products={JSON.parse(JSON.stringify(products))}
        user={user}
      />
    </>
  );
}

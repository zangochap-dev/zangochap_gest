import React from "react";
import Topbar from "@/components/Topbar";
import { getSession } from "@/modules/auth/actions";
import OrdersClient from "@/modules/orders/components/OrdersClient";
import { getOrdersListData, getOrdersStaffData } from "@/modules/orders/actions/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    commune?: string;
    q?: string;
    from?: string;
    to?: string;
    dateType?: string;
    scope?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const user = await getSession();
  const params = await searchParams;

  const [{ orders, totalCount, page, pageSize }, { staffUsers, deliverymen }] = await Promise.all([
    getOrdersListData(params, user),
    getOrdersStaffData(),
  ]);

  const data = JSON.parse(JSON.stringify({
    orders,
    deliverymen,
    staffUsers,
    user,
  }));

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      <Topbar title="Gestion des" subtitle="commandes" />
      <OrdersClient
        initialOrders={data.orders}
        totalCount={totalCount}
        products={[]}
        deliverymen={data.deliverymen}
        staffUsers={data.staffUsers}
        user={data.user}
        currentPage={page}
        pageSize={pageSize}
        todayStr={todayStr}
      />
    </>
  );
}

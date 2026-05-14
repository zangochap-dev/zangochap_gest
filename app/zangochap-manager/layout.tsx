import Sidebar from "@/components/Sidebar";
import "./manager-layout.css";
import { getSession } from "@/modules/auth/actions";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { OrderStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Zangochap Manager",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    return <>{children}</>;
  }

  let counts = {
    orders: 0,
    packing: 0,
    collection: 0,
    toProcess: 0,
    myDeliveries: 0
  };

  try {
    // Fetch counts for Sidebar badges
    const [ordersCount, packingCount, toProcessCount, deliveriesCount, collectionCount] = await Promise.all([
      prisma.order.count({ where: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.TO_PROCESS] } } }),
      prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      prisma.order.count({ where: { status: OrderStatus.TO_PROCESS } }),
      prisma.order.count({ where: { deliverymanId: user.id, status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] } } }),
      prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }) // Simplifié pour le badge collecte temporairement
    ]);

    counts = {
      orders: ordersCount,
      packing: packingCount,
      collection: collectionCount,
      toProcess: toProcessCount,
      myDeliveries: deliveriesCount
    };
  } catch (error) {
    console.error("Database connection error in layout:", error);
    // counts remain at 0, app continues to run
  }

  return (
    <div className="app-container">
      <Sidebar user={JSON.parse(JSON.stringify(user))} counts={counts} />
      <main className="main-content">
        <div className="main-scroll-area">
          {children}
        </div>
      </main>

    </div>
  );
}

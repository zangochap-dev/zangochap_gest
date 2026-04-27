import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
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
    const [ordersCount, packingCount, toProcessCount, deliveriesCount, ordersWithItems] = await Promise.all([
      prisma.order.count({ where: { status: { not: OrderStatus.CANCELLED } } }),
      prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      prisma.order.count({ where: { status: OrderStatus.TO_PROCESS } }),
      prisma.order.count({ where: { deliverymanId: user.id, status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] } } }),
      prisma.order.findMany({
        where: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.DELIVERED] } },
        include: { items: true }
      })
    ]);

    // Calculate collection count (orders with at least one item out of stock)
    const productIds = Array.from(new Set(ordersWithItems.flatMap(o => o.items.map(i => i.productId))));
    const oosProducts = await prisma.product.findMany({
      where: { 
        id: { in: productIds as string[] },
        variants: {
          none: {
            stock: { gt: 0 }
          }
        }
      },
      select: { id: true }
    });
    const oosIds = new Set(oosProducts.map(p => p.id));
    
    let collectionCount = 0;
    ordersWithItems.forEach(o => {
      if (o.items.some(i => i.productId && oosIds.has(i.productId))) {
        collectionCount++;
      }
    });

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
      <Sidebar user={user} counts={counts} />
      <main className="main-content">
        <div className="main-scroll-area">
          {children}
        </div>
      </main>
      <MobileNav user={user} />

      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: var(--cream);
        }
        .main-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .main-scroll-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}

import prisma from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

type OrdersQueryParams = {
  page?: string | number | null;
  status?: string | null;
  commune?: string | null;
  q?: string | null;
  from?: string | null;
  to?: string | null;
  dateType?: string | null;
  scope?: string | null;
};

type SessionUser = {
  id: string;
  name: string;
  role: string;
};

type OrderHistoryEntry = {
  action?: string;
};

export const ORDERS_PAGE_SIZE = 50;

const WEB_TO_PROCESS_WHERE = {
  deletedAt: null,
  status: OrderStatus.TO_PROCESS,
  commercialId: null,
  commercialName: "Site Web",
};

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

export function buildOrdersWhere(params: OrdersQueryParams, user: SessionUser | null | undefined) {
  const from = params.from ?? todayIso();
  const to = params.to ?? todayIso();

  const where: Record<string, unknown> = { deletedAt: null };

  if (params.status?.toUpperCase() === OrderStatus.TO_PROCESS) {
    where.id = "__to_process_orders_are_only_visible_on_the_to_process_page__";
  } else if (params.status && params.status !== "all") {
    where.status = params.status.toUpperCase() as OrderStatus;
  } else {
    where.status = { not: OrderStatus.TO_PROCESS };
  }

  if (params.commune && params.commune !== "all") {
    where.commune = params.commune;
  }

  if (params.q) {
    where.OR = [
      { ref: { contains: params.q, mode: "insensitive" } },
      { customerName: { contains: params.q, mode: "insensitive" } },
      { customerPhone: { contains: params.q } },
      { commercialName: { contains: params.q, mode: "insensitive" } },
    ];
  }

  if (from || to) {
    const dateField = params.dateType === "delivery" ? "deliveryDate" : "createdAt";
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dateFilter.gte = new Date(`${from}T00:00:00`);
    if (to) dateFilter.lte = new Date(`${to}T23:59:59.999`);
    where[dateField] = dateFilter;
  }

  if (user?.role === "commercial") {
    const scopeFilter = { commercialId: user.id };

    if (where.OR) {
      const searchOR = where.OR;
      delete where.OR;
      where.AND = [{ OR: searchOR }, scopeFilter];
    } else {
      where.commercialId = user.id;
    }
  }

  return where;
}

export async function getOrdersListData(params: OrdersQueryParams, user: SessionUser | null | undefined) {
  const page = Math.max(1, parseInt(String(params.page || "1"), 10) || 1);
  const skip = (page - 1) * ORDERS_PAGE_SIZE;
  const where = buildOrdersWhere(params, user);

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true, commercial: true },
      take: ORDERS_PAGE_SIZE,
      skip,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, totalCount, page, pageSize: ORDERS_PAGE_SIZE };
}

export async function getOrdersStaffData() {
  const staffUsers = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, email: true, role: true },
  });

  return {
    staffUsers,
    deliverymen: staffUsers.filter((user) => user.phone),
  };
}

export async function getToProcessOrders() {
  return prisma.order.findMany({
    where: WEB_TO_PROCESS_WHERE,
    orderBy: { createdAt: "asc" },
    include: { items: true },
  });
}

const ISSUE_KEYWORDS = ["propose", "alternative", "indispo", "manque", "pas en stock", "épuisé", "rupture", "incomplet"];
const ALTERNATIVE_KEYWORDS = ["propose", "alternative"];

function getReminderMotifs(history: OrderHistoryEntry[]) {
  return Array.from(new Set(
    history
      .map((entry) => String(entry.action || "").trim())
      .filter((action) => /^note\s*:/i.test(action) || /motif/i.test(action))
      .map((action) => action.replace(/^note\s*:\s*/i, "").trim())
      .filter(Boolean),
  ));
}

export async function getNonPackedOrdersData(user: SessionUser | null | undefined) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const where: Record<string, unknown> = {
    deletedAt: null,
    status: { in: ["CONFIRMED", "PENDING", "PARTIAL", "UNAVAILABLE", "ALTERNATIVE"] },
    createdAt: { gte: yesterday, lt: today },
  };

  if (user?.role?.toLowerCase() === "commercial") {
    where.commercialId = user.id;
  }

  const allOrders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { items: true },
  });

  const notPacked: unknown[] = [];
  const withAlternatives: unknown[] = [];

  allOrders.forEach((order) => {
    const history = Array.isArray(order.history) ? (order.history as OrderHistoryEntry[]) : [];
    const lastIssueEvent = [...history].reverse().find((entry) => {
      const action = String(entry.action || "").toLowerCase();
      return ISSUE_KEYWORDS.some((keyword) => action.includes(keyword));
    });

    if (!lastIssueEvent && order.status !== "PARTIAL" && order.status !== "UNAVAILABLE") return;

    const hasAlt = history.some((entry) => {
      const action = String(entry.action || "").toLowerCase();
      return ALTERNATIVE_KEYWORDS.some((keyword) => action.includes(keyword));
    });

    const orderWithMotif = {
      ...order,
      motif: lastIssueEvent?.action || (order.status === "PARTIAL" ? "Emballage partiel" : "Problème de stock"),
      motifs: getReminderMotifs(history),
    };

    if (hasAlt) {
      withAlternatives.push(orderWithMotif);
    } else {
      notPacked.push(orderWithMotif);
    }
  });

  return { notPacked, withAlternatives };
}

export async function getNewOrderPageData(userId?: string) {
  const [salesStats, products, categories] = await Promise.all([
    userId
      ? prisma.orderItem.groupBy({
          by: ["productId"],
          where: {
            productId: { not: null },
            order: { status: { not: "CANCELLED" } },
          },
          _sum: { qty: true },
        })
      : Promise.resolve([]),
    prisma.product.findMany({
      include: { variants: true, supplier: true, category: true, images: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const salesMap = new Map(salesStats.map((stat) => [stat.productId, stat._sum.qty || 0]));
  const sortedProducts = products.sort((a, b) => {
    const countA = salesMap.get(a.id) || 0;
    const countB = salesMap.get(b.id) || 0;
    if (countB !== countA) return countB - countA;
    return a.name.localeCompare(b.name);
  });

  return { products: sortedProducts, categories };
}

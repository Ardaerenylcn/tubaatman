import type { Pool } from "pg";

import { getPayloadClient } from "@/lib/payload";

/**
 * Sipariş listesi ve özet sorguları.
 *
 * Şemada tek bir `status` alanı var; ekranda bu alan iki ayrı rozete
 * çözülür: ödeme durumu ve karşılanma (kargo) durumu. Böylece Tuba
 * "parası geldi mi" ile "gönderildi mi" sorularını tek bakışta ayırır.
 */
async function pool(): Promise<Pool> {
  const payload = await getPayloadClient();
  return (payload.db as unknown as { pool: Pool }).pool;
}

export type OrderStatus =
  | "pending" | "paid" | "preparing" | "shipped"
  | "delivered" | "cancelled" | "refunded" | "failed";

export type OrderRow = {
  id: number;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  itemSummary: string[];
};

export type OrdersStats = {
  sales: number;
  orders: number;
  avgOrderValue: number;
  salesChange: number | null;
  ordersChange: number | null;
  avgChange: number | null;
};

/** Ödeme parası alınmış sayılan durumlar. Ciro yalnızca bunlardan hesaplanır. */
const PAID_STATUSES = ["paid", "preparing", "shipped", "delivered"];

const pct = (now: number, before: number): number | null => {
  if (before === 0) return now === 0 ? 0 : null;
  return Math.round(((now - before) / before) * 100);
};

export async function getOrdersStats(days: number): Promise<OrdersStats> {
  const p = await pool();
  const q = async (from: string, to: string) => {
    const { rows } = await p.query(
      `select coalesce(sum(total), 0)::bigint as sales,
              count(*)::int                   as orders
         from orders
        where status = any($3)
          and created_at >= now() - $1::interval
          and created_at <  now() - $2::interval`,
      [from, to, PAID_STATUSES],
    );
    const sales = Number(rows[0]?.sales ?? 0);
    const orders = rows[0]?.orders ?? 0;
    return { sales, orders, avg: orders > 0 ? Math.round(sales / orders) : 0 };
  };

  const now = await q(`${days} days`, "0 days");
  const before = await q(`${days * 2} days`, `${days} days`);

  return {
    sales: now.sales,
    orders: now.orders,
    avgOrderValue: now.avg,
    salesChange: pct(now.sales, before.sales),
    ordersChange: pct(now.orders, before.orders),
    avgChange: pct(now.avg, before.avg),
  };
}

export type OrdersQuery = {
  page: number;
  perPage: number;
  search?: string;
  status?: OrderStatus | "all";
  sort?: "date-desc" | "date-asc" | "total-desc" | "total-asc";
};

export async function getOrders(q: OrdersQuery): Promise<{
  rows: OrderRow[];
  total: number;
}> {
  const p = await pool();
  const where: string[] = [];
  const params: unknown[] = [];

  if (q.search?.trim()) {
    params.push(`%${q.search.trim()}%`);
    const i = params.length;
    where.push(
      `(o.order_number ilike $${i}
        or o.customer_first_name ilike $${i}
        or o.customer_last_name ilike $${i}
        or o.customer_email ilike $${i})`,
    );
  }
  if (q.status && q.status !== "all") {
    params.push(q.status);
    where.push(`o.status = $${params.length}`);
  }

  const whereSql = where.length ? `where ${where.join(" and ")}` : "";

  // Sıralama sabit listeden seçilir; kullanıcı girdisi SQL'e gömülmez
  const ORDER_BY: Record<NonNullable<OrdersQuery["sort"]>, string> = {
    "date-desc": "o.created_at desc",
    "date-asc": "o.created_at asc",
    "total-desc": "o.total desc",
    "total-asc": "o.total asc",
  };
  const orderBy = ORDER_BY[q.sort ?? "date-desc"];

  const { rows: countRows } = await p.query(
    `select count(*)::int as n from orders o ${whereSql}`,
    params,
  );
  const total = countRows[0]?.n ?? 0;

  params.push(q.perPage, (q.page - 1) * q.perPage);
  const { rows } = await p.query(
    `select o.id,
            o.order_number,
            o.created_at,
            o.status,
            o.total,
            trim(coalesce(o.customer_first_name,'') || ' ' || coalesce(o.customer_last_name,'')) as customer_name,
            coalesce((select count(*) from orders_items i where i._parent_id = o.id), 0)::int   as item_count,
            coalesce((select array_agg(i.title_snapshot order by i._order)
                        from orders_items i where i._parent_id = o.id), '{}') as item_titles
       from orders o
       ${whereSql}
      order by ${orderBy}
      limit $${params.length - 1} offset $${params.length}`,
    params,
  );

  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      createdAt: r.created_at,
      customerName: r.customer_name || "—",
      status: r.status,
      total: Number(r.total),
      itemCount: r.item_count,
      itemSummary: r.item_titles ?? [],
    })),
  };
}

/** Durum sayıları — "Tüm ögeler (13)" ve filtre menüsü için. */
export async function getStatusCounts(): Promise<Record<string, number>> {
  const p = await pool();
  const { rows } = await p.query(
    `select status, count(*)::int as n from orders group by status`,
  );
  const out: Record<string, number> = { all: 0 };
  for (const r of rows) {
    out[r.status] = r.n;
    out.all += r.n;
  }
  return out;
}

/** Tek `status` alanını ödeme ve karşılanma rozetlerine çözer. */
export function splitStatus(status: OrderStatus): {
  payment: { label: string; tone: "good" | "warning" | "critical" | "neutral" };
  fulfillment: { label: string; tone: "good" | "warning" | "critical" | "neutral" };
} {
  switch (status) {
    case "pending":
      return {
        payment: { label: "Bekliyor", tone: "warning" },
        fulfillment: { label: "Karşılanmadı", tone: "neutral" },
      };
    case "failed":
      return {
        payment: { label: "Başarısız", tone: "critical" },
        fulfillment: { label: "Karşılanmadı", tone: "neutral" },
      };
    case "paid":
      return {
        payment: { label: "Ödendi", tone: "good" },
        fulfillment: { label: "Karşılanmadı", tone: "warning" },
      };
    case "preparing":
      return {
        payment: { label: "Ödendi", tone: "good" },
        fulfillment: { label: "Hazırlanıyor", tone: "warning" },
      };
    case "shipped":
      return {
        payment: { label: "Ödendi", tone: "good" },
        fulfillment: { label: "Kargoda", tone: "good" },
      };
    case "delivered":
      return {
        payment: { label: "Ödendi", tone: "good" },
        fulfillment: { label: "Karşılandı", tone: "good" },
      };
    case "cancelled":
      return {
        payment: { label: "İptal", tone: "neutral" },
        fulfillment: { label: "İptal", tone: "neutral" },
      };
    case "refunded":
      return {
        payment: { label: "İade edildi", tone: "critical" },
        fulfillment: { label: "İade", tone: "neutral" },
      };
  }
}

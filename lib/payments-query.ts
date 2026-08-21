import type { Pool } from "pg";

import { getPayloadClient } from "@/lib/payload";

async function pool(): Promise<Pool> {
  const payload = await getPayloadClient();
  return (payload.db as unknown as { pool: Pool }).pool;
}

export type PaymentStatus =
  | "success" | "declined" | "pending" | "refunded" | "cancelled";

export type PaymentRow = {
  id: number;
  createdAt: string;
  processedAt: string | null;
  customerName: string;
  itemSummary: string;
  channel: string | null;
  cardFamily: string | null;
  cardLastFour: string | null;
  installment: number | null;
  status: PaymentStatus;
  amount: number;
  failureMessage: string | null;
  orderId: number | null;
};

export type PaymentsOverview = {
  /** Brüt satış hacmi: yalnızca başarılı işlemlerin toplamı (kuruş). */
  grossVolume: number;
  successCount: number;
  declinedCount: number;
  /** Başarılı / toplam deneme. Reddedilme sorunu varsa burada görünür. */
  successRate: number | null;
};

const CHANNEL_LABEL: Record<string, string> = {
  card: "Bankamatik ve Kredi Kartı — iyzico",
  transfer: "Havale / EFT",
  cod: "Kapıda ödeme",
};

export function channelLabel(channel: string | null): string {
  return CHANNEL_LABEL[channel ?? "card"] ?? "—";
}

export const STATUS_META: Record<
  PaymentStatus,
  { label: string; tone: "good" | "warning" | "critical" | "neutral" }
> = {
  success: { label: "Başarılı", tone: "good" },
  declined: { label: "Reddedildi", tone: "neutral" },
  pending: { label: "Bekliyor", tone: "warning" },
  refunded: { label: "İade edildi", tone: "critical" },
  cancelled: { label: "İptal edildi", tone: "neutral" },
};

/** Belirtilen aralık için genel bakış. days=0 → bugün. */
export async function getPaymentsOverview(days: number): Promise<PaymentsOverview> {
  const p = await pool();
  const interval = days === 0 ? null : `${days} days`;
  const { rows } = await p.query(
    interval
      ? `select
           coalesce(sum(amount) filter (where status = 'success'), 0)::bigint as gross,
           count(*) filter (where status = 'success')::int  as ok,
           count(*) filter (where status = 'declined')::int as bad
         from payments
        where created_at >= now() - $1::interval`
      : `select
           coalesce(sum(amount) filter (where status = 'success'), 0)::bigint as gross,
           count(*) filter (where status = 'success')::int  as ok,
           count(*) filter (where status = 'declined')::int as bad
         from payments
        where created_at::date = now()::date`,
    interval ? [interval] : [],
  );
  const r = rows[0] ?? {};
  const ok = r.ok ?? 0;
  const bad = r.bad ?? 0;
  const attempts = ok + bad;
  return {
    grossVolume: Number(r.gross ?? 0),
    successCount: ok,
    declinedCount: bad,
    successRate: attempts > 0 ? Math.round((ok / attempts) * 100) : null,
  };
}

export type PaymentsQuery = {
  page: number;
  perPage: number;
  search?: string;
  status?: PaymentStatus | "all";
};

export async function getPayments(q: PaymentsQuery): Promise<{
  rows: PaymentRow[];
  total: number;
}> {
  const p = await pool();
  const where: string[] = [];
  const params: unknown[] = [];

  if (q.search?.trim()) {
    params.push(`%${q.search.trim()}%`);
    const i = params.length;
    where.push(
      `(p.customer_name ilike $${i}
        or p.customer_email ilike $${i}
        or p.payment_id ilike $${i}
        or p.item_summary ilike $${i})`,
    );
  }
  if (q.status && q.status !== "all") {
    params.push(q.status);
    where.push(`p.status = $${params.length}`);
  }
  const whereSql = where.length ? `where ${where.join(" and ")}` : "";

  const { rows: countRows } = await p.query(
    `select count(*)::int as n from payments p ${whereSql}`,
    params,
  );

  params.push(q.perPage, (q.page - 1) * q.perPage);
  const { rows } = await p.query(
    `select p.id, p.created_at, p.processed_at, p.customer_name, p.item_summary,
            p.method_channel, p.method_card_family, p.method_card_last_four,
            p.method_installment, p.status, p.amount, p.failure_message, p.order_id
       from payments p
       ${whereSql}
      order by p.created_at desc
      limit $${params.length - 1} offset $${params.length}`,
    params,
  );

  return {
    total: countRows[0]?.n ?? 0,
    rows: rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      processedAt: r.processed_at,
      customerName: r.customer_name ?? "—",
      itemSummary: r.item_summary ?? "—",
      channel: r.method_channel,
      cardFamily: r.method_card_family,
      cardLastFour: r.method_card_last_four,
      installment: r.method_installment,
      status: r.status,
      amount: Number(r.amount),
      failureMessage: r.failure_message,
      orderId: r.order_id,
    })),
  };
}

export async function getPaymentStatusCounts(): Promise<Record<string, number>> {
  const p = await pool();
  const { rows } = await p.query(
    `select status, count(*)::int as n from payments group by status`,
  );
  const out: Record<string, number> = { all: 0 };
  for (const r of rows) {
    out[r.status] = r.n;
    out.all += r.n;
  }
  return out;
}

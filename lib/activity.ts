import type { Pool } from "pg";

import { getPayloadClient } from "@/lib/payload";

/**
 * Hareket akışı: mağazada gerçekten olan şeyler.
 *
 * Buradaki her madde veritabanındaki bir kayda dayanır — uydurma veya
 * yer tutucu yoktur. Google arama performansı ayrı bir karttır çünkü
 * verisi bizde değil, Search Console'da bulunur.
 */
export type ActivityKind =
  | "order"
  | "message"
  | "out-of-stock"
  | "low-stock"
  | "traffic"
  | "product";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  /** 1 = en acil. Sıralama "Öncelik" seçildiğinde kullanılır. */
  priority: number;
  title: string;
  detail: string;
  at: string;
  href?: string;
  actionLabel?: string;
};

async function pool(): Promise<Pool> {
  const payload = await getPayloadClient();
  return (payload.db as unknown as { pool: Pool }).pool;
}

const LOW_STOCK_THRESHOLD = 2;

export async function getActivity(): Promise<ActivityItem[]> {
  const payload = await getPayloadClient();
  const p = await pool();
  const items: ActivityItem[] = [];

  // --- Ödemesi alınmış, henüz hazırlanmamış siparişler ---
  const orders = await payload.find({
    collection: "orders",
    where: { status: { equals: "paid" } },
    sort: "-createdAt",
    limit: 5,
  });
  for (const o of orders.docs) {
    items.push({
      id: `order-${o.id}`,
      kind: "order",
      priority: 1,
      title: "Yeni sipariş",
      detail: `${o.orderNumber} · ${o.customer?.firstName ?? ""} ${o.customer?.lastName ?? ""}`.trim(),
      at: o.createdAt,
      href: `/admin/collections/orders/${o.id}`,
      actionLabel: "Siparişi aç",
    });
  }

  // --- Tükenmiş ve azalmış ürünler ---
  const { rows: stock } = await p.query(
    `select p.id, p.title,
            case when p.has_variants
                 then coalesce((select sum(v.stock) from products_variants v where v._parent_id = p.id), 0)
                 else coalesce(p.stock, 0)
            end as total_stock
       from products p
      where p.is_active = true
      order by total_stock asc
      limit 20`,
  );
  for (const r of stock) {
    const n = Number(r.total_stock);
    if (n === 0) {
      items.push({
        id: `oos-${r.id}`,
        kind: "out-of-stock",
        priority: 0,
        title: "Ürün tükendi",
        detail: r.title,
        at: new Date().toISOString(),
        href: `/admin/collections/products/${r.id}`,
        actionLabel: "Stok gir",
      });
    } else if (n <= LOW_STOCK_THRESHOLD) {
      items.push({
        id: `low-${r.id}`,
        kind: "low-stock",
        priority: 2,
        title: "Stok azaldı",
        detail: `${r.title} · ${n} adet kaldı`,
        at: new Date().toISOString(),
        href: `/admin/collections/products/${r.id}`,
        actionLabel: "Stok gir",
      });
    }
  }

  // --- Yanıtlanmamış mesajlar ---
  const messages = await payload.find({
    collection: "messages",
    where: { status: { equals: "new" } },
    sort: "-createdAt",
    limit: 5,
  });
  for (const m of messages.docs) {
    const SUBJECTS: Record<string, string> = {
      general: "Genel soru",
      custom: "Özel tasarım",
      appointment: "Randevu talebi",
      order: "Sipariş hakkında",
    };
    items.push({
      id: `msg-${m.id}`,
      kind: "message",
      priority: m.subject === "appointment" || m.subject === "custom" ? 2 : 3,
      title: "Yanıt bekleyen mesaj",
      detail: `${m.name} · ${SUBJECTS[m.subject ?? "general"] ?? "Mesaj"}`,
      at: m.createdAt,
      href: `/admin/collections/messages/${m.id}`,
      actionLabel: "Mesajı aç",
    });
  }

  // --- Trafik değişimi (son 7 gün / önceki 7 gün) ---
  const { rows: traffic } = await p.query(
    `select
       count(distinct case when created_at >= now() - interval '7 days'
                           then session_id end)::int as now7,
       count(distinct case when created_at >= now() - interval '14 days'
                            and created_at <  now() - interval '7 days'
                           then session_id end)::int as prev7
       from analytics_events`,
  );
  const now7 = traffic[0]?.now7 ?? 0;
  const prev7 = traffic[0]?.prev7 ?? 0;
  if (now7 > 0 || prev7 > 0) {
    const pct = prev7 === 0 ? null : Math.round(((now7 - prev7) / prev7) * 100);
    items.push({
      id: "traffic-7d",
      kind: "traffic",
      priority: 4,
      title: "Haftalık trafik",
      detail:
        pct === null
          ? `Son 7 günde ${now7} oturum`
          : `Son 7 günde ${now7} oturum · geçen haftaya göre ${pct >= 0 ? "+" : ""}%${pct}`,
      at: new Date().toISOString(),
    });
  }

  // --- Son eklenen ürünler ---
  const recent = await payload.find({
    collection: "products",
    sort: "-createdAt",
    limit: 3,
  });
  for (const pr of recent.docs) {
    items.push({
      id: `product-${pr.id}`,
      kind: "product",
      priority: 5,
      title: pr.isActive ? "Ürün yayında" : "Ürün taslakta",
      detail: pr.title,
      at: pr.createdAt,
      href: `/admin/collections/products/${pr.id}`,
      actionLabel: "Ürünü aç",
    });
  }

  return items;
}

export function sortActivity(
  items: ActivityItem[],
  by: "oncelik" | "tarih",
): ActivityItem[] {
  const copy = [...items];
  if (by === "tarih") {
    return copy.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }
  return copy.sort(
    (a, b) =>
      a.priority - b.priority ||
      new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

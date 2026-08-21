import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import type { AdminViewServerProps } from "payload";

import { formatKurus } from "@/lib/format";
import {
  getOrders,
  getOrdersStats,
  getStatusCounts,
  splitStatus,
  type OrdersQuery,
} from "@/lib/orders-query";

import { OrdersToolbar } from "./OrdersToolbar";
import { RangeSelect } from "./RangeSelect";
import "./orders.css";

const PER_PAGE = 25;
const ALLOWED_DAYS = [7, 30, 90, 365];
const ALLOWED_SORT = ["date-desc", "date-asc", "total-desc", "total-asc"];

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="taord__delta">yeni</span>;
  if (value === 0) return <span className="taord__delta">%0</span>;
  return (
    <span className={`taord__delta taord__delta--${value > 0 ? "up" : "down"}`}>
      {value > 0 ? "▲" : "▼"} %{Math.abs(value)}
    </span>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "warning" | "critical" | "neutral";
}) {
  return <span className={`taord__badge taord__badge--${tone}`}>{label}</span>;
}

export default async function OrdersList(props: AdminViewServerProps) {
  const sp = props.searchParams as Record<string, string | undefined> | undefined;

  const rawDays = Number(sp?.gun);
  const days = ALLOWED_DAYS.includes(rawDays) ? rawDays : 30;
  const page = Math.max(1, Number(sp?.sayfa) || 1);
  const search = sp?.ara ?? "";
  const status = (sp?.durum ?? "all") as OrdersQuery["status"];
  const sort = (ALLOWED_SORT.includes(sp?.sirala ?? "")
    ? sp!.sirala
    : "date-desc") as OrdersQuery["sort"];

  const [stats, counts, list] = await Promise.all([
    getOrdersStats(days),
    getStatusCounts(),
    getOrders({ page, perPage: PER_PAGE, search, status, sort }),
  ]);

  const pageCount = Math.max(1, Math.ceil(list.total / PER_PAGE));

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (search) p.set("ara", search);
    if (status && status !== "all") p.set("durum", status);
    if (sort !== "date-desc") p.set("sirala", sort!);
    if (days !== 30) p.set("gun", String(days));
    p.set("sayfa", String(n));
    return `?${p.toString()}`;
  };

  return (
    <Gutter className="taord">
      <header className="taord__head">
        <h1 className="taord__title">Siparişler</h1>
        <Link href="/admin/collections/orders/create" className="taord__primary">
          <span aria-hidden>+</span> Yeni Sipariş Ekle
        </Link>
      </header>

      <section className="taord__stats">
        <div className="taord__stat">
          <span className="taord__stat-label">Satışlar</span>
          <strong className="taord__stat-value">{formatKurus(stats.sales)}</strong>
          <Change value={stats.salesChange} />
        </div>
        <div className="taord__stat">
          <span className="taord__stat-label">Siparişler</span>
          <strong className="taord__stat-value">{stats.orders}</strong>
          <Change value={stats.ordersChange} />
        </div>
        <div className="taord__stat">
          <span className="taord__stat-label">Ort. sipariş değeri</span>
          <strong className="taord__stat-value">
            {formatKurus(stats.avgOrderValue)}
          </strong>
          <Change value={stats.avgChange} />
        </div>

        <div className="taord__stats-right">
          <RangeSelect current={days} />
          <span className="taord__sep" aria-hidden />
          <Link href="/admin" className="taord__link">
            Analizlere Git
          </Link>
        </div>
      </section>

      <section className="taord__panel">
        <OrdersToolbar counts={counts} status={status ?? "all"} search={search} />

        {list.rows.length === 0 ? (
          <p className="taord__empty">
            {search || status !== "all"
              ? "Bu süzgeçlere uyan sipariş yok."
              : "Henüz sipariş yok. İlk sipariş geldiğinde burada görünecek."}
          </p>
        ) : (
          <div className="taord__tablewrap">
            <table className="taord__table">
              <thead>
                <tr>
                  <th scope="col">Sipariş</th>
                  <th scope="col">Oluşturulma tarihi</th>
                  <th scope="col">Müşteri</th>
                  <th scope="col">Ödeme</th>
                  <th scope="col">Karşılanma durumu</th>
                  <th scope="col" className="taord__num">Toplam</th>
                  <th scope="col" className="taord__num">Ögeler</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((o) => {
                  const s = splitStatus(o.status);
                  return (
                    <tr key={o.id}>
                      <td>
                        <Link
                          href={`/admin/collections/orders/${o.id}`}
                          className="taord__no"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="taord__date">
                        {dateFmt.format(new Date(o.createdAt))}
                      </td>
                      <td>{o.customerName}</td>
                      <td><Badge {...s.payment} /></td>
                      <td><Badge {...s.fulfillment} /></td>
                      <td className="taord__num taord__total">
                        {formatKurus(o.total)}
                      </td>
                      <td className="taord__num">
                        <span
                          className="taord__items"
                          title={o.itemSummary.join("\n")}
                        >
                          {o.itemCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 ? (
          <nav className="taord__pager" aria-label="Sayfalar">
            <Link
              href={pageHref(Math.max(1, page - 1))}
              aria-disabled={page === 1}
              className={`taord__pagebtn${page === 1 ? " taord__pagebtn--off" : ""}`}
            >
              Önceki
            </Link>
            <span className="taord__pageinfo">
              {page} / {pageCount} · toplam {list.total} sipariş
            </span>
            <Link
              href={pageHref(Math.min(pageCount, page + 1))}
              aria-disabled={page === pageCount}
              className={`taord__pagebtn${page === pageCount ? " taord__pagebtn--off" : ""}`}
            >
              Sonraki
            </Link>
          </nav>
        ) : null}
      </section>
    </Gutter>
  );
}

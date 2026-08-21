import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import type { AdminViewServerProps } from "payload";

import { formatKurus } from "@/lib/format";
import {
  channelLabel,
  getPayments,
  getPaymentStatusCounts,
  getPaymentsOverview,
  STATUS_META,
  type PaymentsQuery,
} from "@/lib/payments-query";

import { OverviewSelect } from "./OverviewSelect";
import { PaymentsToolbar } from "./PaymentsToolbar";
import "./payments.css";

const PER_PAGE = 25;
const ALLOWED_DAYS = [0, 7, 30, 90];

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Bilgi baloncuğu — sütun başlıklarındaki (i) işareti. */
function Info({ text }: { text: string }) {
  return (
    <span className="tapay__info" title={text} aria-label={text}>
      i
    </span>
  );
}

export default async function PaymentsList(props: AdminViewServerProps) {
  const sp = props.searchParams as Record<string, string | undefined> | undefined;

  const rawDays = Number(sp?.gun);
  const days = ALLOWED_DAYS.includes(rawDays) ? rawDays : 0;
  const page = Math.max(1, Number(sp?.sayfa) || 1);
  const search = sp?.ara ?? "";
  const status = (sp?.durum ?? "all") as PaymentsQuery["status"];

  const [overview, counts, list] = await Promise.all([
    getPaymentsOverview(days),
    getPaymentStatusCounts(),
    getPayments({ page, perPage: PER_PAGE, search, status }),
  ]);

  const pageCount = Math.max(1, Math.ceil(list.total / PER_PAGE));
  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (search) p.set("ara", search);
    if (status && status !== "all") p.set("durum", status);
    if (days !== 0) p.set("gun", String(days));
    p.set("sayfa", String(n));
    return `?${p.toString()}`;
  };

  return (
    <Gutter className="tapay">
      <header className="tapay__head">
        <h1 className="tapay__title">Ödemeler</h1>
        <p className="tapay__sub">Müşterilerinizden gelen ödemeleri takip edin.</p>
      </header>

      <section className="tapay__overview">
        <div className="tapay__overview-head">
          <OverviewSelect current={days} />
        </div>
        <div className="tapay__overview-grid">
          <div className="tapay__metric">
            <span className="tapay__metric-label">
              Brüt Satış Hacmi
              <Info text="Seçili dönemde başarılı olan işlemlerin toplam tutarı. Reddedilen denemeler dahil değildir." />
            </span>
            <strong className="tapay__metric-value">
              {overview.successCount === 0 ? "—" : formatKurus(overview.grossVolume)}
            </strong>
          </div>
          <div className="tapay__metric">
            <span className="tapay__metric-label">
              Başarılı Ödemeler
              <Info text="Seçili dönemde bankanın onayladığı işlem sayısı." />
            </span>
            <strong className="tapay__metric-value">{overview.successCount}</strong>
            {overview.declinedCount > 0 ? (
              <span className="tapay__metric-note">
                {overview.declinedCount} deneme reddedildi
                {overview.successRate !== null
                  ? ` · başarı oranı %${overview.successRate}`
                  : ""}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="tapay__panel">
        <PaymentsToolbar counts={counts} status={status ?? "all"} search={search} />

        {list.rows.length === 0 ? (
          <p className="tapay__empty">
            {search || status !== "all"
              ? "Bu süzgeçlere uyan ödeme yok."
              : "Henüz ödeme kaydı yok. iyzico entegrasyonu devreye girdiğinde her deneme — başarılı ya da reddedilen — burada listelenecek."}
          </p>
        ) : (
          <div className="tapay__tablewrap">
            <table className="tapay__table">
              <thead>
                <tr>
                  <th scope="col">
                    Ödeme tarihi
                    <Info text="Müşterinin ödemeyi başlattığı an." />
                  </th>
                  <th scope="col">Müşteri</th>
                  <th scope="col">Ürün / Hizmet</th>
                  <th scope="col">Ödeme yöntemi</th>
                  <th scope="col">İşlem durumu</th>
                  <th scope="col">
                    İşlem tarihi
                    <Info text="Bankanın işlemi sonuçlandırdığı an. Ödeme tarihinden farklı olabilir." />
                  </th>
                  <th scope="col" className="tapay__num">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((p) => {
                  const meta = STATUS_META[p.status];
                  return (
                    <tr key={p.id}>
                      <td className="tapay__date">
                        {dateFmt.format(new Date(p.createdAt))}
                      </td>
                      <td>{p.customerName}</td>
                      <td>
                        <span className="tapay__item" title={p.itemSummary}>
                          {p.itemSummary}
                        </span>
                      </td>
                      <td className="tapay__method">
                        {channelLabel(p.channel)}
                        {p.cardLastFour ? (
                          <span className="tapay__card">
                            {p.cardFamily ? `${p.cardFamily} ` : ""}•••• {p.cardLastFour}
                            {p.installment && p.installment > 1
                              ? ` · ${p.installment} taksit`
                              : ""}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className={`tapay__badge tapay__badge--${meta.tone}`}
                          title={p.failureMessage ?? undefined}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="tapay__date">
                        {p.processedAt
                          ? dateFmt.format(new Date(p.processedAt))
                          : "—"}
                      </td>
                      <td className="tapay__num tapay__amount">
                        {formatKurus(p.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 ? (
          <nav className="tapay__pager" aria-label="Sayfalar">
            <Link
              href={pageHref(Math.max(1, page - 1))}
              aria-disabled={page === 1}
              className={`tapay__pagebtn${page === 1 ? " tapay__pagebtn--off" : ""}`}
            >
              Önceki
            </Link>
            <span className="tapay__pageinfo">
              {page} / {pageCount} · toplam {list.total} işlem
            </span>
            <Link
              href={pageHref(Math.min(pageCount, page + 1))}
              aria-disabled={page === pageCount}
              className={`tapay__pagebtn${page === pageCount ? " tapay__pagebtn--off" : ""}`}
            >
              Sonraki
            </Link>
          </nav>
        ) : null}
      </section>
    </Gutter>
  );
}

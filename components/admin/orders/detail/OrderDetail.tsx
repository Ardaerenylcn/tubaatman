import { Gutter } from "@payloadcms/ui";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { DocumentViewServerProps } from "payload";

import { formatKurus } from "@/lib/format";
import { getPayloadClient } from "@/lib/payload";
import { splitStatus, type OrderStatus } from "@/lib/orders-query";
import type { Media, Order, Product } from "@/payload-types";

import {
  CopyButton,
  NoteBox,
  StatusMenu,
  TagEditor,
  TrackingButton,
} from "./OrderActions";
import "./order-detail.css";

const dateLong = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});
const dateOnly = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric", month: "short", year: "numeric",
});
const timeOnly = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit", minute: "2-digit",
});

function Badge({ label, tone }: { label: string; tone: string }) {
  return <span className={`taod__badge taod__badge--${tone}`}>{label}</span>;
}

/** Zaman çizelgesini güne göre grupla — ekranda tarih başlıkları çıkar. */
function groupByDay(entries: NonNullable<Order["timeline"]>) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  const groups: { day: string; items: typeof sorted }[] = [];
  for (const e of sorted) {
    const day = dateOnly.format(new Date(e.at));
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(e);
    else groups.push({ day, items: [e] });
  }
  return groups;
}

export default async function OrderDetail(props: DocumentViewServerProps) {
  // Kök belge görünümü kimliği doğrudan prop olarak verir; routeSegments
  // yedek yoldur (.../collections/orders/<id>)
  const id = Number(
    props.id ?? props.routeSegments?.[props.routeSegments.length - 1],
  );
  if (!Number.isInteger(id)) notFound();

  const payload = await getPayloadClient();
  let order: Order;
  try {
    order = (await payload.findByID({
      collection: "orders",
      id,
      depth: 2,
    })) as Order;
  } catch {
    notFound();
  }

  const s = splitStatus(order.status as OrderStatus);
  const items = order.items ?? [];
  const tags = (order.tags ?? []).map((t) => t.label).filter(Boolean) as string[];
  const addr = order.shippingAddress;

  const addressText = [
    `${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim(),
    addr?.line1,
    [addr?.district, addr?.city, addr?.postalCode].filter(Boolean).join(", "),
    "Türkiye",
    order.customer?.phone,
  ]
    .filter(Boolean)
    .join("\n");

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [addr?.line1, addr?.district, addr?.city].filter(Boolean).join(" "),
  )}`;

  const initial = (order.customer?.firstName ?? "?").charAt(0).toUpperCase();

  return (
    <Gutter className="taod">
      <nav className="taod__crumbs" aria-label="Konum">
        <Link href="/admin/collections/orders">Siparişler</Link>
        <span aria-hidden>›</span>
        <span aria-current="page">Sipariş {order.orderNumber}</span>
      </nav>

      <header className="taod__head">
        <div>
          <h1 className="taod__title">
            Sipariş {order.orderNumber}
            <Badge label={s.payment.label.toUpperCase()} tone={s.payment.tone} />
            <Badge label={s.fulfillment.label.toUpperCase()} tone={s.fulfillment.tone} />
          </h1>
          <p className="taod__created">
            {dateLong.format(new Date(order.createdAt))} tarihinde oluşturuldu
          </p>
        </div>
        <StatusMenu orderId={id} current={order.status ?? "pending"} />
      </header>

      <div className="taod__grid">
        <div className="taod__col">
          {/* --- Ögeler --- */}
          <section className="taod__card">
            <h2 className="taod__card-title">Ögeler ({items.length})</h2>
            <div className="taod__shipbar">
              <span>Gönderilecek Ürünler</span>
              <TrackingButton
                orderId={id}
                carrier={order.shipping?.carrier ?? null}
                trackingNumber={order.shipping?.trackingNumber ?? null}
              />
            </div>
            <ul className="taod__items">
              {items.map((it, i) => {
                const prod =
                  typeof it.product === "object" && it.product !== null
                    ? (it.product as Product)
                    : null;
                const img = (prod?.images ?? []).find(
                  (m): m is Media => typeof m === "object" && m !== null,
                );
                return (
                  <li key={it.id ?? i} className="taod__item">
                    <div className="taod__thumb">
                      {img?.url ? (
                        <Image
                          src={img.url}
                          alt={img.alt ?? it.titleSnapshot}
                          fill
                          sizes="64px"
                          className="taod__thumb-img"
                        />
                      ) : null}
                    </div>
                    <span className="taod__item-name">
                      {it.titleSnapshot}
                      {it.variantLabel ? (
                        <em className="taod__item-variant">{it.variantLabel}</em>
                      ) : null}
                    </span>
                    <span className="taod__item-unit">{formatKurus(it.unitPrice)}</span>
                    <span className="taod__item-qty">× {it.quantity}</span>
                    <span className="taod__item-total">{formatKurus(it.lineTotal)}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* --- Ödeme Bilgileri --- */}
          <section className="taod__card">
            <h2 className="taod__card-title">
              Ödeme Bilgileri
              <Badge label={s.payment.label.toUpperCase()} tone={s.payment.tone} />
            </h2>
            <dl className="taod__totals">
              <div>
                <dt>Ögeler</dt>
                <dd>{formatKurus(order.subtotal)}</dd>
              </div>
              <div>
                <dt>Gönderim</dt>
                <dd>
                  {order.shippingCost === 0
                    ? formatKurus(0)
                    : formatKurus(order.shippingCost)}
                </dd>
              </div>
              <div className="taod__totals-row">
                <dt>Toplam</dt>
                <dd>{formatKurus(order.total)}</dd>
              </div>
            </dl>
            <div className="taod__paid">
              <span>Müşterinin ödediği tutar</span>
              <strong>
                {order.payment?.paidAt ? formatKurus(order.total) : formatKurus(0)}
              </strong>
            </div>
            {order.payment?.installment && order.payment.installment > 1 ? (
              <p className="taod__paid-note">
                {order.payment.installment} taksit
              </p>
            ) : null}
          </section>

          {/* --- Sipariş Hareketleri --- */}
          <section className="taod__card">
            <h2 className="taod__card-title">Sipariş Hareketleri</h2>
            <div className="taod__timeline">
              <NoteBox orderId={id} />
              {(order.timeline ?? []).length === 0 ? (
                <p className="taod__muted">Henüz hareket kaydı yok.</p>
              ) : (
                groupByDay(order.timeline!).map((g) => (
                  <div key={g.day} className="taod__tl-group">
                    <p className="taod__tl-day">{g.day}</p>
                    <ul>
                      {g.items.map((e, i) => (
                        <li key={`${e.at}-${i}`} className={`taod__tl-item taod__tl-item--${e.kind}`}>
                          <span className="taod__tl-msg">{e.message}</span>
                          <span className="taod__tl-time">
                            {timeOnly.format(new Date(e.at))}
                          </span>
                          {e.author ? (
                            <span className="taod__tl-author">{e.author}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* --- Sağ sütun --- */}
        <aside className="taod__col taod__col--side">
          <section className="taod__card">
            <h2 className="taod__card-title">Sipariş Bilgileri</h2>

            <h3 className="taod__sub">İletişim Bilgileri</h3>
            <div className="taod__customer">
              <span className="taod__avatar" aria-hidden>{initial}</span>
              <span className="taod__customer-name">
                {order.customer?.firstName} {order.customer?.lastName}
              </span>
            </div>
            <p className="taod__contact">
              <a href={`mailto:${order.customer?.email}`}>{order.customer?.email}</a>
              <a href={`tel:${order.customer?.phone?.replace(/\s/g, "")}`}>
                {order.customer?.phone}
              </a>
            </p>

            <h3 className="taod__sub">Teslimat yöntemi</h3>
            <p className="taod__plain">
              {order.shippingCost === 0
                ? "Ücretsiz Gönderim"
                : (order.shipping?.method ?? "Standart Gönderim")}
            </p>

            <h3 className="taod__sub">
              Gönderim adresi
              <CopyButton text={addressText} label="Adresi kopyala" />
            </h3>
            <p className="taod__plain taod__address">{addressText}</p>
            <a
              className="taod__link"
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Haritayı Görüntüle
            </a>

            <h3 className="taod__sub">Fatura adresi</h3>
            <p className="taod__plain">
              {order.billingSameAsShipping
                ? "Gönderim adresiyle aynı"
                : [
                    order.billingAddress?.line1,
                    [order.billingAddress?.district, order.billingAddress?.city]
                      .filter(Boolean)
                      .join(", "),
                  ]
                    .filter(Boolean)
                    .join("\n") || "—"}
            </p>
          </section>

          <section className="taod__card">
            <h2 className="taod__card-title">Ek bilgi</h2>
            <h3 className="taod__sub">Özel Alanlarınız</h3>
            <dl className="taod__extra">
              <dt>TC Kimlik No</dt>
              <dd>{order.customer?.tcKimlik || "—"}</dd>
              {order.shipping?.trackingNumber ? (
                <>
                  <dt>Takip numarası</dt>
                  <dd>{order.shipping.trackingNumber}</dd>
                </>
              ) : null}
              {order.contractAcceptedAt ? (
                <>
                  <dt>Sözleşme onayı</dt>
                  <dd>{dateLong.format(new Date(order.contractAcceptedAt))}</dd>
                </>
              ) : null}
            </dl>
          </section>

          <section className="taod__card">
            <h2 className="taod__card-title">Etiketler</h2>
            <TagEditor orderId={id} tags={tags} />
          </section>
        </aside>
      </div>
    </Gutter>
  );
}

import Link from "next/link";

import type { ActivityItem, ActivityKind } from "@/lib/activity";
import type { SearchPerformance } from "@/lib/search-console";

import { SearchPerformanceCard } from "./SearchPerformanceCard";
import { SortToggle } from "./SortToggle";
import { relativeTime } from "./format";

/**
 * Her maddenin durumu metinle de belirtilir; renk tek başına anlam taşımaz.
 */
const KIND: Record<ActivityKind, { dot: string; label: string }> = {
  "out-of-stock": { dot: "critical", label: "Acil" },
  order: { dot: "good", label: "Sipariş" },
  "low-stock": { dot: "warning", label: "Uyarı" },
  message: { dot: "info", label: "Mesaj" },
  traffic: { dot: "neutral", label: "Trafik" },
  product: { dot: "neutral", label: "Katalog" },
};

export function ActivityFeed({
  items,
  sort,
  search,
}: {
  items: ActivityItem[];
  sort: "oncelik" | "tarih";
  search: SearchPerformance;
}) {
  return (
    <section className="tafeed">
      <header className="tafeed__head">
        <div>
          <h2 className="tafeed__title">Hareket Akışı</h2>
          <p className="tafeed__sub">En son güncellemeleriniz.</p>
        </div>
        <SortToggle current={sort} />
      </header>

      <div className="tafeed__divider">
        <span>Performans Güncellemeleri</span>
      </div>

      <SearchPerformanceCard data={search} />

      <div className="tafeed__divider">
        <span>Mağaza</span>
      </div>

      {items.length === 0 ? (
        <p className="tapanel__empty">
          Şu an bekleyen bir iş yok. Yeni sipariş, mesaj ya da stok uyarısı
          çıktığında burada görünür.
        </p>
      ) : (
        <ul className="tafeed__list">
          {items.map((item) => {
            const k = KIND[item.kind];
            return (
              <li key={item.id} className="tafeed__item">
                <span className={`tafeed__dot tafeed__dot--${k.dot}`} aria-hidden />
                <div className="tafeed__body">
                  <p className="tafeed__item-title">
                    {item.title}
                    <span className="tafeed__kind">{k.label}</span>
                  </p>
                  <p className="tafeed__detail">{item.detail}</p>
                </div>
                <div className="tafeed__meta">
                  <span className="tafeed__time">{relativeTime(item.at)}</span>
                  {item.href ? (
                    <Link href={item.href} className="tafeed__action">
                      {item.actionLabel ?? "Aç"}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

import type { SearchPerformance, SearchRow } from "@/lib/search-console";

const fmt = new Intl.NumberFormat("tr-TR");

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <span className="taquery__metric" title={label}>
      <span className="taquery__icon" aria-hidden>
        {icon}
      </span>
      <span className="taquery__num">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

const EyeIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ClickIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="m9 9 10 3-4 2-2 4-4-9Z" />
    <path d="M5 3v3M3 5h3M5 15v2M3.5 16h3" strokeLinecap="round" />
  </svg>
);
const RankIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M7 9h6M7 13h4" strokeLinecap="round" />
  </svg>
);

function QueryCard({ row, dimension }: { row: SearchRow; dimension: "query" | "page" }) {
  const label = row.keys[0] ?? "—";
  const display =
    dimension === "page"
      ? (() => {
          try {
            return new URL(label).pathname;
          } catch {
            return label;
          }
        })()
      : label;

  return (
    <li className="taquery">
      <p className="taquery__label" title={label}>
        {display}
      </p>
      <div className="taquery__metrics">
        <Metric icon={EyeIcon} value={fmt.format(row.impressions)} label="Gösterim" />
        <Metric icon={ClickIcon} value={fmt.format(row.clicks)} label="Tıklama" />
        <Metric
          icon={RankIcon}
          value={row.position.toFixed(1)}
          label="Ortalama sıra"
        />
      </div>
    </li>
  );
}

export function SearchPerformanceCard({ data }: { data: SearchPerformance }) {
  return (
    <article className="tafeed__card tafeed__card--google">
      <header className="tafeed__card-head">
        <span className="tafeed__avatar" aria-hidden>
          G
        </span>
        <div className="tafeed__card-title">
          <h4>Google&apos;da Arama Performansı</h4>
          <p className="tafeed__card-sub">
            {data.connected
              ? "Google'da en çok aranan sorgularınız."
              : "Henüz bağlı değil."}
          </p>
        </div>
      </header>

      {!data.connected ? (
        <div className="tafeed__notice">
          <p>{data.reason}</p>
          <p className="tafeed__notice-hint">
            Bağlamak için Google Cloud&apos;da bir servis hesabı oluşturup Search
            Console&apos;da mülke okuma yetkisi vermek gerekiyor. Anahtarlar
            hazır olduğunda üç ortam değişkeni yeterli:{" "}
            <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code>,{" "}
            <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code>,{" "}
            <code>GOOGLE_SEARCH_CONSOLE_SITE</code>.
          </p>
        </div>
      ) : (
        <>
          <ul className="taquery__list">
            {data.queries.length === 0 ? (
              <li className="tafeed__notice">
                <p>Bu dönem için sorgu verisi yok.</p>
              </li>
            ) : (
              data.queries.map((r) => (
                <QueryCard key={r.keys.join("|")} row={r} dimension="query" />
              ))
            )}
          </ul>
          <p className="tafeed__card-foot">
            {data.from} – {data.to} istatistikleri
          </p>
        </>
      )}
    </article>
  );
}

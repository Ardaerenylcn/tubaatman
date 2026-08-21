import type { AdminViewServerProps } from "payload";

import { getActivity, sortActivity } from "@/lib/activity";
import { getSearchPerformance } from "@/lib/search-console";
import {
  getBreakdown,
  getJourneys,
  getOnlineNow,
  getSeries,
  getSummary,
  getTopPages,
} from "@/lib/analytics-query";

import { ActivityFeed } from "./ActivityFeed";
import { BreakdownBars } from "./BreakdownBars";
import { RangePicker } from "./RangePicker";
import { Sparkline } from "./Sparkline";
import { countryLabel, formatDuration, formatNumber, relativeTime } from "./format";
import "./dashboard.css";

const ALLOWED_DAYS = [1, 7, 30, 90];

function Change({ now, before }: { now: number; before: number }) {
  if (before === 0) {
    return <span className="tastat__change tastat__change--flat">yeni</span>;
  }
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) {
    return <span className="tastat__change tastat__change--flat">değişim yok</span>;
  }
  const up = pct > 0;
  return (
    <span className={`tastat__change tastat__change--${up ? "up" : "down"}`}>
      {up ? "▲" : "▼"} %{Math.abs(pct)}
    </span>
  );
}

function StatCard({
  label,
  value,
  now,
  before,
  series,
  labels,
  hint,
}: {
  label: string;
  value: string;
  now: number;
  before: number;
  series: number[];
  labels: string[];
  hint?: string;
}) {
  return (
    <article className="tastat">
      <h3 className="tastat__label">{label}</h3>
      <div className="tastat__row">
        <div>
          <p className="tastat__value">{value}</p>
          <Change now={now} before={before} />
        </div>
        <Sparkline values={series} labels={labels} />
      </div>
      {hint ? <p className="tastat__hint">{hint}</p> : null}
    </article>
  );
}

export default async function Dashboard(props: AdminViewServerProps) {
  const sp = props.searchParams as Record<string, string | undefined> | undefined;
  const raw = Number(sp?.gun);
  const days = ALLOWED_DAYS.includes(raw) ? raw : 30;
  const sort: "oncelik" | "tarih" = sp?.sira === "tarih" ? "tarih" : "oncelik";

  const [summary, series, online, topPages, sources, countries, cities, devices, journeys] =
    await Promise.all([
      getSummary(days),
      getSeries(days),
      getOnlineNow(),
      getTopPages(days, 10),
      getBreakdown("source", days),
      getBreakdown("country", days),
      getBreakdown("city", days),
      getBreakdown("device", days),
      getJourneys(10),
    ]);

  const [activity, search] = await Promise.all([
    getActivity(),
    getSearchPerformance(),
  ]);

  const dayLabels = series.map((s) =>
    new Date(s.day).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
  );
  const sessionSeries = series.map((s) => s.sessions);
  const viewSeries = series.map((s) => s.pageviews);

  const hasData = summary.pageviews > 0;

  return (
    <div className="tadash">
      <header className="tadash__head">
        <div>
          <h1 className="tadash__title">
            Analizler
            <span className={`tadash__live${online > 0 ? " tadash__live--on" : ""}`}>
              {online > 0 ? `Online ${online} ziyaretçi` : "Şu an kimse yok"}
            </span>
          </h1>
          <p className="tadash__sub">
            Ziyaretçilerin siteyi nasıl kullandığı. IP adresi saklanmaz; konum
            yalnızca ülke ve şehir düzeyinde tutulur.
          </p>
        </div>
        <RangePicker current={days} />
      </header>

      {!hasData ? (
        <section className="tapanel tadash__empty">
          <h3 className="tapanel__title">Henüz ziyaret kaydı yok</h3>
          <p className="tapanel__empty">
            Siteyi bir tarayıcıda gezin; kayıtlar birkaç saniye içinde burada
            görünür. Yerel geliştirmede konum bilgisi boş kalır — coğrafya
            verisi Vercel'in istek başlıklarından geldiği için yalnızca yayında
            dolar.
          </p>
        </section>
      ) : null}

      <ActivityFeed items={sortActivity(activity, sort)} sort={sort} search={search} />

      <section className="tadash__stats">
        <StatCard
          label="Site oturumları"
          value={formatNumber(summary.sessions)}
          now={summary.sessions}
          before={summary.prev.sessions}
          series={sessionSeries}
          labels={dayLabels}
        />
        <StatCard
          label="Tekil ziyaretçiler"
          value={formatNumber(summary.visitors)}
          now={summary.visitors}
          before={summary.prev.visitors}
          series={sessionSeries}
          labels={dayLabels}
          hint="Günlük değişen tuzla hesaplanır; kalıcı takip yapılmaz."
        />
        <StatCard
          label="Sayfa görüntüleme"
          value={formatNumber(summary.pageviews)}
          now={summary.pageviews}
          before={summary.prev.pageviews}
          series={viewSeries}
          labels={dayLabels}
        />
        <StatCard
          label="Sayfada ortalama süre"
          value={formatDuration(summary.avgDurationSec)}
          now={summary.avgDurationSec}
          before={summary.prev.avgDurationSec}
          series={viewSeries}
          labels={dayLabels}
          hint="Sekme arka plandayken geçen süre sayılmaz."
        />
      </section>

      <div className="tadash__grid">
        <section className="tapanel tapanel--wide">
          <h3 className="tapanel__title">En çok görüntülenen sayfalar</h3>
          {topPages.length === 0 ? (
            <p className="tapanel__empty">Henüz veri yok.</p>
          ) : (
            <table className="tatable">
              <thead>
                <tr>
                  <th scope="col">Sayfa</th>
                  <th scope="col" className="tatable__num">Görüntüleme</th>
                  <th scope="col" className="tatable__num">Ort. süre</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p) => (
                  <tr key={p.path}>
                    <td>
                      <span className="tatable__path">{p.path}</span>
                      {p.title ? <span className="tatable__title">{p.title}</span> : null}
                    </td>
                    <td className="tatable__num">{formatNumber(p.views)}</td>
                    <td className="tatable__num">{formatDuration(p.avgSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <BreakdownBars title="Nereden geldiler" rows={sources} />
        <BreakdownBars
          title="Ülke"
          rows={countries.map((c) => ({ ...c, label: countryLabel(c.label) }))}
          emptyText="Konum verisi yalnızca yayındaki sitede toplanır."
        />
        <BreakdownBars
          title="Şehir"
          rows={cities}
          emptyText="Konum verisi yalnızca yayındaki sitede toplanır."
        />
        <BreakdownBars
          title="Cihaz"
          rows={devices.map((d) => ({
            ...d,
            label:
              d.label === "mobile"
                ? "Mobil"
                : d.label === "tablet"
                  ? "Tablet"
                  : d.label === "desktop"
                    ? "Masaüstü"
                    : d.label,
          }))}
        />

        <section className="tapanel tapanel--wide">
          <h3 className="tapanel__title">Son ziyaretçiler</h3>
          {journeys.length === 0 ? (
            <p className="tapanel__empty">Henüz ziyaret yok.</p>
          ) : (
            <ul className="tajourney">
              {journeys.map((j) => (
                <li key={j.sessionId} className="tajourney__item">
                  <div className="tajourney__meta">
                    <span className="tajourney__where">
                      {[j.city, j.country ? countryLabel(j.country) : null]
                        .filter(Boolean)
                        .join(", ") || "Konum bilinmiyor"}
                    </span>
                    <span className="tajourney__dot">·</span>
                    <span>
                      {j.device === "mobile"
                        ? "Mobil"
                        : j.device === "tablet"
                          ? "Tablet"
                          : "Masaüstü"}
                    </span>
                    <span className="tajourney__dot">·</span>
                    <span>{j.source ?? "doğrudan"}</span>
                    <span className="tajourney__dot">·</span>
                    <span>{relativeTime(j.startedAt)}</span>
                    <span className="tajourney__total">
                      {j.steps.length} sayfa · {formatDuration(j.totalSec)}
                    </span>
                  </div>
                  <ol className="tajourney__steps">
                    {j.steps.map((s, i) => (
                      <li key={`${s.path}-${i}`} className="tajourney__step">
                        <span className="tajourney__path">{s.path}</span>
                        {s.sec > 0 ? (
                          <span className="tajourney__sec">{formatDuration(s.sec)}</span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

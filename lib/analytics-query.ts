import type { Pool } from "pg";

import { getPayloadClient } from "@/lib/payload";

/**
 * Gösterge paneli sorguları.
 *
 * Toplama işlemleri Payload'ın find API'si yerine ham SQL ile yapılır —
 * gruplama ve sayım için çok daha verimli. Bağlantı, Payload'ın mevcut
 * havuzundan alınır; ayrı bağlantı açılmaz.
 *
 * Tüm sorgular parametrelidir; kullanıcı girdisi asla SQL'e gömülmez.
 */
async function pool(): Promise<Pool> {
  const payload = await getPayloadClient();
  return (payload.db as unknown as { pool: Pool }).pool;
}

const T = "analytics_events";

export type Summary = {
  sessions: number;
  visitors: number;
  pageviews: number;
  avgDurationSec: number;
  prev: { sessions: number; visitors: number; pageviews: number; avgDurationSec: number };
};

export type SeriesPoint = { day: string; sessions: number; pageviews: number };
export type TopPage = { path: string; title: string | null; views: number; avgSec: number };
export type Breakdown = { label: string; count: number };
export type Journey = {
  sessionId: string;
  startedAt: string;
  country: string | null;
  city: string | null;
  device: string | null;
  source: string | null;
  totalSec: number;
  steps: { path: string; sec: number; at: string }[];
};

const pct = (now: number, before: number): number | null => {
  if (before === 0) return now === 0 ? 0 : null;
  return Math.round(((now - before) / before) * 100);
};

export function changePct(now: number, before: number) {
  return pct(now, before);
}

/** Son N gün ve bir önceki N gün için özet. */
export async function getSummary(days: number): Promise<Summary> {
  const p = await pool();
  const q = async (from: string, to: string) => {
    const { rows } = await p.query(
      `select
         count(distinct session_id)::int                      as sessions,
         count(distinct visitor_hash)::int                    as visitors,
         count(*)::int                                        as pageviews,
         coalesce(avg(nullif(duration_ms, 0)), 0)::float      as avg_ms
       from ${T}
       where created_at >= now() - $1::interval
         and created_at <  now() - $2::interval`,
      [from, to],
    );
    const r = rows[0] ?? {};
    return {
      sessions: r.sessions ?? 0,
      visitors: r.visitors ?? 0,
      pageviews: r.pageviews ?? 0,
      avgDurationSec: Math.round((r.avg_ms ?? 0) / 1000),
    };
  };

  const current = await q(`${days} days`, `0 days`);
  const prev = await q(`${days * 2} days`, `${days} days`);
  return { ...current, prev };
}

/** Günlük seri — sparkline için. Veri olmayan günler 0 ile doldurulur. */
export async function getSeries(days: number): Promise<SeriesPoint[]> {
  const p = await pool();
  const { rows } = await p.query(
    `with span as (
       select generate_series(
         (now() - $1::interval)::date, now()::date, '1 day'
       )::date as day
     )
     select to_char(span.day, 'YYYY-MM-DD')                as day,
            count(distinct e.session_id)::int              as sessions,
            count(e.id)::int                               as pageviews
       from span
       left join ${T} e on e.created_at::date = span.day
      group by span.day
      order by span.day`,
    [`${days - 1} days`],
  );
  return rows.map((r) => ({
    day: r.day,
    sessions: r.sessions ?? 0,
    pageviews: r.pageviews ?? 0,
  }));
}

/** Şu anda sitede olan ziyaretçi sayısı (son 5 dakika). */
export async function getOnlineNow(): Promise<number> {
  const p = await pool();
  const { rows } = await p.query(
    `select count(distinct session_id)::int as n
       from ${T}
      where created_at >= now() - interval '5 minutes'`,
  );
  return rows[0]?.n ?? 0;
}

export async function getTopPages(days: number, limit = 10): Promise<TopPage[]> {
  const p = await pool();
  const { rows } = await p.query(
    `select path,
            max(title)                                      as title,
            count(*)::int                                   as views,
            coalesce(avg(nullif(duration_ms, 0)), 0)::float as avg_ms
       from ${T}
      where created_at >= now() - $1::interval
      group by path
      order by views desc
      limit $2`,
    [`${days} days`, limit],
  );
  return rows.map((r) => ({
    path: r.path,
    title: r.title,
    views: r.views,
    avgSec: Math.round((r.avg_ms ?? 0) / 1000),
  }));
}

/** Belirli bir sütuna göre oturum dağılımı. Sütun adı sabit listeden seçilir. */
export async function getBreakdown(
  column: "source" | "country" | "city" | "device" | "browser" | "os",
  days: number,
  limit = 8,
): Promise<Breakdown[]> {
  const ALLOWED = ["source", "country", "city", "device", "browser", "os"] as const;
  if (!ALLOWED.includes(column)) throw new Error(`İzin verilmeyen sütun: ${column}`);

  const p = await pool();
  const { rows } = await p.query(
    `select coalesce(nullif(${column}::text, ''), 'bilinmiyor') as label,
            count(distinct session_id)::int              as count
       from ${T}
      where created_at >= now() - $1::interval
      group by label
      order by count desc
      limit $2`,
    [`${days} days`, limit],
  );
  return rows.map((r) => ({ label: r.label, count: r.count }));
}

/** Son ziyaretçilerin sayfa yolculukları. */
export async function getJourneys(limit = 12): Promise<Journey[]> {
  const p = await pool();
  const { rows } = await p.query(
    `with recent as (
       select session_id, max(created_at) as last_seen
         from ${T}
        group by session_id
        order by last_seen desc
        limit $1
     )
     select e.session_id,
            e.path,
            e.title,
            e.country,
            e.city,
            e.device,
            e.source,
            e.duration_ms,
            e.created_at
       from ${T} e
       join recent r on r.session_id = e.session_id
      order by r.last_seen desc, e.created_at asc`,
    [limit],
  );

  const map = new Map<string, Journey>();
  for (const r of rows) {
    let j = map.get(r.session_id);
    if (!j) {
      j = {
        sessionId: r.session_id,
        startedAt: r.created_at,
        country: r.country,
        city: r.city,
        device: r.device,
        source: r.source,
        totalSec: 0,
        steps: [],
      };
      map.set(r.session_id, j);
    }
    const sec = Math.round((r.duration_ms ?? 0) / 1000);
    j.totalSec += sec;
    j.steps.push({ path: r.path, sec, at: r.created_at });
  }
  return [...map.values()];
}

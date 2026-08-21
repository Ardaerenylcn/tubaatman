/**
 * Google Search Console — arama performansı.
 *
 * Bu verinin kaynağı bizim veritabanımız değil, Google'dır. Gösterim,
 * tıklama ve ortalama sıra yalnızca Search Console API'sinden gelir;
 * hesaplanamaz veya tahmin edilemez.
 *
 * Bağlantı kurulmadan kart "bağlı değil" durumunda gösterilir — sahte
 * sayı üretmek, SEO kararlarını yanlış veriye dayandırmak olurdu.
 *
 * Bağlamak için gerekli ortam değişkenleri:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *   GOOGLE_SEARCH_CONSOLE_SITE   (örn. sc-domain:tubaatman.com)
 */

export type SearchRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchPerformance =
  | { connected: false; reason: string }
  | {
      connected: true;
      site: string;
      from: string;
      to: string;
      queries: SearchRow[];
      pages: SearchRow[];
    };

export function isConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
      process.env.GOOGLE_SEARCH_CONSOLE_SITE,
  );
}

/** Servis hesabı için imzalı JWT üretip erişim jetonu alır. */
async function getAccessToken(): Promise<string> {
  const { createSign } = await import("crypto");
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64(header)}.${b64(claim)}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key, "base64url");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`Jeton alınamadı: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function query(
  token: string,
  site: string,
  dimension: "query" | "page",
  from: string,
  to: string,
): Promise<SearchRow[]> {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: from,
        endDate: to,
        dimensions: [dimension],
        rowLimit: 6,
      }),
    },
  );
  if (!res.ok) throw new Error(`Search Console hatası: ${res.status}`);
  const json = (await res.json()) as { rows?: SearchRow[] };
  return json.rows ?? [];
}

export async function getSearchPerformance(days = 29): Promise<SearchPerformance> {
  if (!isConfigured()) {
    return {
      connected: false,
      reason:
        "Google Search Console bağlı değil. Bağlanınca en çok arandığınız sorgular, gösterim ve tıklama sayıları burada görünecek.",
    };
  }

  const site = process.env.GOOGLE_SEARCH_CONSOLE_SITE!;
  // Search Console verisi ~2 gün gecikmeli gelir
  const end = new Date(Date.now() - 2 * 86400_000);
  const start = new Date(end.getTime() - days * 86400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const token = await getAccessToken();
    const [queries, pages] = await Promise.all([
      query(token, site, "query", iso(start), iso(end)),
      query(token, site, "page", iso(start), iso(end)),
    ]);
    return { connected: true, site, from: iso(start), to: iso(end), queries, pages };
  } catch (e) {
    return {
      connected: false,
      reason: `Search Console'a bağlanılamadı: ${(e as Error).message}`,
    };
  }
}

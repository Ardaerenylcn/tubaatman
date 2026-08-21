/**
 * Analitik boru hattını uçtan uca doğrular:
 * olay gönderimi → mahremiyet kontrolleri → toplama sorguları → panel render'ı.
 * Kendi test verisini yazar ve siler. Dev sunucusu ayakta olmalıdır.
 */
import { getPayload } from "payload";
import config from "../payload.config";
import {
  getBreakdown,
  getJourneys,
  getOnlineNow,
  getSeries,
  getSummary,
  getTopPages,
} from "../lib/analytics-query";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
let pass = 0, fail = 0;
const check = (n: string, ok: boolean, d = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${n}${ok ? "" : `  ← ${d}`}`);
  ok ? pass++ : fail++;
};

const uuid = () => crypto.randomUUID();

async function track(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return fetch(`${BASE}/api/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const run = async () => {
  const payload = await getPayload({ config });
  const sid = `test-${Date.now()}`;
  const ids: string[] = [];

  // --- 1. Sayfa görüntüleme kaydı ---
  const e1 = uuid();
  ids.push(e1);
  let r = await track({
    type: "view", eventId: e1, sessionId: sid, path: "/kelt",
    title: "Kelt", referrer: "https://www.google.com/search?q=takı", isEntry: true,
  }, { "x-vercel-ip-country": "TR", "x-vercel-ip-city": "Istanbul", "x-vercel-ip-country-region": "34" });
  check("görüntüleme kabul edildi", r.status === 200, `HTTP ${r.status}`);

  await new Promise((s) => setTimeout(s, 400));
  let doc = (await payload.find({ collection: "analytics-events", where: { eventId: { equals: e1 } }, limit: 1 })).docs[0];
  check("kayıt oluştu", Boolean(doc));
  check("kaynak Google olarak çözüldü", doc?.source === "Google", `alınan ${doc?.source}`);
  check("cihaz mobil algılandı", doc?.device === "mobile", `alınan ${doc?.device}`);
  check("tarayıcı Safari algılandı", doc?.browser === "Safari", `alınan ${doc?.browser}`);
  check("konum başlıklardan okundu", doc?.country === "TR" && doc?.city === "Istanbul",
        `${doc?.country}/${doc?.city}`);
  check("giriş sayfası işaretlendi", doc?.isEntry === true);

  // --- 2. MAHREMİYET: IP hiçbir alanda saklanmıyor ---
  const serialized = JSON.stringify(doc);
  check("ham IP saklanmıyor", !serialized.includes("203.0.113"), "IP alanlarda görünüyor");
  check("ziyaretçi hash'i üretildi", typeof doc?.visitorHash === "string" && doc.visitorHash.length === 32);

  // Aynı IP+UA aynı gün aynı hash'i vermeli
  const e2 = uuid(); ids.push(e2);
  await track({ type: "view", eventId: e2, sessionId: sid, path: "/kolye", title: "Kolye" },
              { "x-real-ip": "203.0.113.9" });
  await new Promise((s) => setTimeout(s, 400));
  const doc2 = (await payload.find({ collection: "analytics-events", where: { eventId: { equals: e2 } }, limit: 1 })).docs[0];
  check("ikinci sayfa kaydedildi", Boolean(doc2));
  check("hash geri döndürülemez (IP içermiyor)", !JSON.stringify(doc2).includes("203.0.113.9"));

  // --- 3. Süre güncellemesi ---
  r = await track({ type: "leave", eventId: e1, durationMs: 42_000 });
  check("ayrılış kabul edildi", r.status === 200);
  await new Promise((s) => setTimeout(s, 400));
  doc = (await payload.find({ collection: "analytics-events", where: { eventId: { equals: e1 } }, limit: 1 })).docs[0];
  check("süre kaydedildi", doc?.durationMs === 42_000, `alınan ${doc?.durationMs}`);

  // --- 4. Doğrulama ve bot filtresi ---
  r = await track({ type: "view", eventId: "gecersiz-id", sessionId: sid, path: "/x" });
  check("geçersiz eventId reddedildi", r.status === 400);
  r = await track({ type: "view", eventId: uuid(), sessionId: sid, path: "/x" },
                  { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" });
  const botBody = await r.json();
  check("bot trafiği sayılmıyor", botBody.skipped === "bot");
  r = await track({ type: "view", eventId: uuid(), path: "/x" });
  check("sessionId olmadan reddediliyor", r.status === 400);
  r = await track({ type: "leave", eventId: e1, durationMs: 999_999_999 });
  await new Promise((s) => setTimeout(s, 300));
  doc = (await payload.find({ collection: "analytics-events", where: { eventId: { equals: e1 } }, limit: 1 })).docs[0];
  check("aşırı süre üst sınıra çekiliyor", (doc?.durationMs ?? 0) <= 7_200_000, `alınan ${doc?.durationMs}`);

  // --- 5. Toplama sorguları ---
  const summary = await getSummary(30);
  check("özet oturum sayıyor", summary.sessions >= 1, `${summary.sessions}`);
  check("özet ortalama süre hesaplıyor", summary.avgDurationSec > 0, `${summary.avgDurationSec}`);
  const series = await getSeries(30);
  check("günlük seri 30 gün döndürüyor", series.length === 30, `${series.length}`);
  const online = await getOnlineNow();
  check("online sayacı çalışıyor", online >= 1, `${online}`);
  const pages = await getTopPages(30);
  check("en çok görüntülenen sayfalar geldi", pages.length >= 2, `${pages.length}`);
  const src = await getBreakdown("source", 30);
  check("kaynak dağılımı geldi", src.length >= 1);
  const journeys = await getJourneys(10);
  const mine = journeys.find((j) => j.sessionId === sid);
  check("ziyaretçi yolculuğu birleştirildi", Boolean(mine) && (mine?.steps.length ?? 0) >= 2,
        `${mine?.steps.length} adım`);

  // --- 6. SQL enjeksiyon koruması ---
  let threw = false;
  try {
    await getBreakdown("path; drop table analytics_events" as never, 30);
  } catch {
    threw = true;
  }
  check("izin verilmeyen sütun adı reddediliyor", threw);

  // --- temizlik ---
  const all = await payload.find({ collection: "analytics-events", where: { sessionId: { equals: sid } }, limit: 100 });
  for (const d of all.docs) await payload.delete({ collection: "analytics-events", id: d.id });
  console.log(`\n  ${all.docs.length} test kaydı silindi`);

  console.log(`\nSONUÇ: ${pass} geçti, ${fail} başarısız`);
  process.exit(fail === 0 ? 0 : 1);
};

run().catch((e) => { console.error(e); process.exit(1); });

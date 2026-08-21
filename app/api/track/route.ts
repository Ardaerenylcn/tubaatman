import { NextResponse } from "next/server";

import { normalizeSource, parseUserAgent, visitorHash } from "@/lib/analytics-hash";
import { getPayloadClient } from "@/lib/payload";

// iyzico gibi bu uç da Node.js runtime'ında çalışır (crypto ve DB erişimi için)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PATH = 512;
const MAX_DURATION_MS = 1000 * 60 * 60 * 2; // 2 saat; sekmede unutulan sayfalar sayılmaz

type Body = {
  type?: "view" | "leave";
  eventId?: string;
  sessionId?: string;
  path?: string;
  title?: string;
  referrer?: string | null;
  isEntry?: boolean;
  durationMs?: number;
};

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t.slice(0, max);
};

const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isUuid(body.eventId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payload = await getPayloadClient();

  // --- Ayrılış: mevcut olayın süresini güncelle ---
  if (body.type === "leave") {
    const duration = Number(body.durationMs);
    if (!Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ ok: true });
    }
    const existing = await payload.find({
      collection: "analytics-events",
      where: { eventId: { equals: body.eventId } },
      limit: 1,
    });
    if (existing.docs[0]) {
      await payload.update({
        collection: "analytics-events",
        id: existing.docs[0].id,
        data: { durationMs: Math.min(Math.round(duration), MAX_DURATION_MS) },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // --- Sayfa görüntüleme ---
  const path = clean(body.path, MAX_PATH);
  const sessionId = clean(body.sessionId, 64);
  if (!path || !sessionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const headers = request.headers;
  const ua = headers.get("user-agent") ?? "";

  // Botları saymayız
  if (/bot|crawler|spider|crawling|preview|lighthouse|headless/i.test(ua)) {
    return NextResponse.json({ ok: true, skipped: "bot" });
  }

  // IP yalnızca hash girdisi olarak kullanılır, saklanmaz.
  const ip =
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0";

  const { referrerHost, source } = normalizeSource(
    clean(body.referrer, 512),
    headers.get("host"),
  );
  const { device, browser, os } = parseUserAgent(ua);

  const decode = (v: string | null) => {
    if (!v) return null;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };

  try {
    await payload.create({
      collection: "analytics-events",
      data: {
        eventId: body.eventId,
        sessionId,
        visitorHash: visitorHash(ip, ua),
        path,
        title: clean(body.title, 256),
        referrer: clean(body.referrer, 512),
        referrerHost,
        source,
        // Vercel coğrafya başlıkları — yerelde boş gelir
        country: headers.get("x-vercel-ip-country"),
        region: decode(headers.get("x-vercel-ip-country-region")),
        city: decode(headers.get("x-vercel-ip-city")),
        device,
        browser,
        os,
        isEntry: Boolean(body.isEntry),
      },
    });
  } catch {
    // Aynı eventId iki kez gelirse (ağ tekrarı) sessizce yut
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

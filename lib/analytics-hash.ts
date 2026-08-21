import { createHash, randomBytes } from "crypto";

/**
 * Ziyaretçi kimliği üretimi.
 *
 * IP adresi hiçbir yerde saklanmaz; yalnızca hash girdisi olarak kullanılır ve
 * hash geri döndürülemez. Tuz her gün değiştiği için aynı ziyaretçi ertesi gün
 * farklı bir hash alır — kalıcı takip mümkün değildir.
 *
 * Tuz süreç belleğinde tutulur; sunucu yeniden başlarsa yenilenir. Bu, tekil
 * ziyaretçi sayısını bir miktar yukarı çekebilir ama mahremiyet açısından
 * güvenli taraftır.
 */
let cachedSalt: { day: string; value: string } | null = null;

function dailySalt(): string {
  const day = new Date().toISOString().slice(0, 10);
  if (cachedSalt?.day === day) return cachedSalt.value;
  cachedSalt = { day, value: randomBytes(32).toString("hex") };
  return cachedSalt.value;
}

export function visitorHash(ip: string, userAgent: string): string {
  return createHash("sha256")
    .update(`${dailySalt()}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

/** Yönlendiren adresi okunabilir bir kaynağa indirger. */
export function normalizeSource(referrer: string | null, host: string | null): {
  referrerHost: string | null;
  source: string;
} {
  if (!referrer) return { referrerHost: null, source: "doğrudan" };
  let h: string;
  try {
    h = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return { referrerHost: null, source: "doğrudan" };
  }
  if (host && h === host.replace(/^www\./, "")) {
    return { referrerHost: h, source: "site içi" };
  }
  const MAP: [RegExp, string][] = [
    [/google\./, "Google"],
    [/bing\./, "Bing"],
    [/duckduckgo\./, "DuckDuckGo"],
    [/yandex\./, "Yandex"],
    [/instagram\./, "Instagram"],
    [/facebook\.|fb\./, "Facebook"],
    [/t\.co$|twitter\.|x\.com$/, "X"],
    [/pinterest\./, "Pinterest"],
    [/youtube\.|youtu\.be/, "YouTube"],
    [/tiktok\./, "TikTok"],
    [/linkedin\./, "LinkedIn"],
    [/whatsapp\./, "WhatsApp"],
  ];
  for (const [re, label] of MAP) if (re.test(h)) return { referrerHost: h, source: label };
  return { referrerHost: h, source: h };
}

/** Kullanıcı aracısından cihaz/tarayıcı/işletim sistemi çıkarır. */
export function parseUserAgent(ua: string): {
  device: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
} {
  const device = /iPad|Tablet/i.test(ua)
    ? "tablet"
    : /Mobi|Android|iPhone/i.test(ua)
      ? "mobile"
      : "desktop";

  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : "Diğer";

  const os = /Windows/.test(ua)
    ? "Windows"
    : /iPhone|iPad|iOS/.test(ua)
      ? "iOS"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Android/.test(ua)
          ? "Android"
          : /Linux/.test(ua)
            ? "Linux"
            : "Diğer";

  return { device, browser, os };
}

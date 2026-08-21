export function formatDuration(sec: number): string {
  if (!sec || sec < 1) return "—";
  if (sec < 60) return `${sec} sn`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return s === 0 ? `${m} dk` : `${m} dk ${s} sn`;
  const h = Math.floor(m / 60);
  return `${h} sa ${m % 60} dk`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("tr-TR").format(n);
}

const COUNTRY_NAMES = new Intl.DisplayNames(["tr"], { type: "region" });

export function countryLabel(code: string): string {
  if (!code || code === "bilinmiyor") return "Bilinmiyor";
  try {
    return COUNTRY_NAMES.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.round(h / 24)} gün önce`;
}

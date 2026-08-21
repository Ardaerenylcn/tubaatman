"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  all: "Tüm ögeler",
  pending: "Ödeme bekliyor",
  paid: "Ödendi",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
  failed: "Ödeme başarısız",
};

export function OrdersToolbar({
  counts,
  status,
  search,
}: {
  counts: Record<string, number>;
  status: string;
  search: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [term, setTerm] = useState(search);

  // Yazmayı bitirince ara — her tuş vuruşunda sorgu atmaz
  useEffect(() => {
    const t = setTimeout(() => {
      if (term === search) return;
      const next = new URLSearchParams(params.toString());
      if (term) next.set("ara", term);
      else next.delete("ara");
      next.delete("sayfa");
      router.push(`${pathname}?${next.toString()}`);
    }, 350);
    return () => clearTimeout(t);
  }, [term, search, params, pathname, router]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    next.delete("sayfa");
    router.push(`${pathname}?${next.toString()}`);
  };

  const available = Object.keys(STATUS_LABELS).filter(
    (k) => k === "all" || (counts[k] ?? 0) > 0,
  );

  return (
    <div className="taord__toolbar">
      <div className="taord__toolbar-left">
        <label className="taord__select">
          <select
            value={status}
            onChange={(e) => setParam("durum", e.target.value)}
            aria-label="Duruma göre süz"
          >
            {available.map((k) => (
              <option key={k} value={k}>
                {STATUS_LABELS[k]} ({counts[k] ?? 0})
              </option>
            ))}
          </select>
        </label>

        <label className="taord__select taord__select--plain">
          <select
            value={params.get("sirala") ?? "date-desc"}
            onChange={(e) => setParam("sirala", e.target.value)}
            aria-label="Sıralama"
          >
            <option value="date-desc">En yeni önce</option>
            <option value="date-asc">En eski önce</option>
            <option value="total-desc">Tutar: yüksekten düşüğe</option>
            <option value="total-asc">Tutar: düşükten yükseğe</option>
          </select>
        </label>
      </div>

      <div className="taord__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Sipariş no, ad veya e-posta ara…"
          aria-label="Siparişlerde ara"
        />
      </div>
    </div>
  );
}

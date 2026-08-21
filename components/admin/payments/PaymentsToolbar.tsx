"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const LABELS: Record<string, string> = {
  all: "Tüm ödemeler",
  success: "Başarılı",
  declined: "Reddedildi",
  pending: "Bekliyor",
  refunded: "İade edildi",
  cancelled: "İptal edildi",
};

export function PaymentsToolbar({
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

  const setStatus = (v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v && v !== "all") next.set("durum", v);
    else next.delete("durum");
    next.delete("sayfa");
    router.push(`${pathname}?${next.toString()}`);
  };

  const available = Object.keys(LABELS).filter(
    (k) => k === "all" || (counts[k] ?? 0) > 0,
  );

  return (
    <div className="tapay__toolbar">
      <h2 className="tapay__panel-title">Tüm Ödemeler</h2>

      <div className="tapay__tools">
        <label className="tapay__select">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" strokeLinejoin="round" />
          </svg>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Duruma göre süz"
          >
            {available.map((k) => (
              <option key={k} value={k}>
                {LABELS[k]} ({counts[k] ?? 0})
              </option>
            ))}
          </select>
        </label>

        <div className="tapay__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Ad, ödeme numarası ve daha fazlası…"
            aria-label="Ödemelerde ara"
          />
        </div>
      </div>
    </div>
  );
}

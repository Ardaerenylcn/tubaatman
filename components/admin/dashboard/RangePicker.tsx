"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const RANGES = [
  { days: 1, label: "Bugün" },
  { days: 7, label: "Son 7 gün" },
  { days: 30, label: "Son 30 gün" },
  { days: 90, label: "Son 90 gün" },
];

export function RangePicker({ current }: { current: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const select = (days: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("gun", String(days));
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="tarange" role="group" aria-label="Zaman aralığı">
      {RANGES.map((r) => (
        <button
          key={r.days}
          type="button"
          onClick={() => select(r.days)}
          aria-pressed={current === r.days}
          className={`tarange__btn${current === r.days ? " tarange__btn--on" : ""}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

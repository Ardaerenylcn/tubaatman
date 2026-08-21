"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function OverviewSelect({ current }: { current: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="tapay__overview-select">
      <span>Genel bakış:</span>
      <select
        value={String(current)}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("gun", e.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
        aria-label="Genel bakış aralığı"
      >
        <option value="0">Bugün</option>
        <option value="7">Son 7 gün</option>
        <option value="30">Son 30 gün</option>
        <option value="90">Son 90 gün</option>
      </select>
    </label>
  );
}

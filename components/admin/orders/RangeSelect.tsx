"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function RangeSelect({ current }: { current: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="taord__select taord__select--plain">
      <select
        value={String(current)}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("gun", e.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
        aria-label="Zaman aralığı"
      >
        <option value="7">Son 7 gün</option>
        <option value="30">Son 30 gün</option>
        <option value="90">Son 90 gün</option>
        <option value="365">Son 1 yıl</option>
      </select>
    </label>
  );
}

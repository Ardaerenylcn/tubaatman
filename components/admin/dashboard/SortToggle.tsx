"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortToggle({ current }: { current: "oncelik" | "tarih" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const select = (v: "oncelik" | "tarih") => {
    const next = new URLSearchParams(params.toString());
    next.set("sira", v);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="tasort">
      <span className="tasort__label">Sırala:</span>
      <div className="tasort__group" role="group" aria-label="Sıralama">
        <button
          type="button"
          onClick={() => select("oncelik")}
          aria-pressed={current === "oncelik"}
          className={`tasort__btn${current === "oncelik" ? " tasort__btn--on" : ""}`}
        >
          Öncelik
        </button>
        <button
          type="button"
          onClick={() => select("tarih")}
          aria-pressed={current === "tarih"}
          className={`tasort__btn${current === "tarih" ? " tasort__btn--on" : ""}`}
        >
          Tarih
        </button>
      </div>
    </div>
  );
}

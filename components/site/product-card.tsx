import Image from "next/image";
import Link from "next/link";

import { formatKurus } from "@/lib/format";
import type { Media, Product } from "@/payload-types";

/** Ürünün gösterilecek en düşük fiyatı (kuruş). Seçenekliyse en ucuz seçenek. */
export function displayPriceKurus(product: Product): number | null {
  if (product.hasVariants) {
    const prices = (product.variants ?? [])
      .map((v) => v.price)
      .filter((p): p is number => typeof p === "number");
    return prices.length ? Math.min(...prices) : null;
  }
  return typeof product.basePrice === "number" ? product.basePrice : null;
}

export function ProductCard({ product }: { product: Product }) {
  const cover = (product.images ?? []).find(
    (m): m is Media => typeof m === "object" && m !== null,
  );
  const price = displayPriceKurus(product);

  return (
    <Link href={`/urun/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {cover?.url ? (
          <Image
            src={cover.url}
            alt={cover.alt ?? product.title}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <h3 className="mt-4 font-heading text-xl font-light leading-snug">
        {product.title}
      </h3>
      {price !== null ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {product.hasVariants
            ? `Başlangıç ${formatKurus(price)}`
            : formatKurus(price)}
        </p>
      ) : null}
    </Link>
  );
}

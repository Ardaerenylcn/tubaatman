"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ProductGallery } from "@/components/site/product-gallery";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatKurus } from "@/lib/format";
import type { Media, Product } from "@/payload-types";

const METAL_LABEL: Record<string, string> = { silver: "Gümüş", gold: "Altın" };
const SIZE_LABEL: Record<string, string> = {
  small: "Küçük",
  medium: "Orta",
  large: "Büyük",
};

function variantLabel(v: NonNullable<Product["variants"]>[number]): string {
  return (
    [v.metal ? METAL_LABEL[v.metal] : null, v.size ? SIZE_LABEL[v.size] : null]
      .filter(Boolean)
      .join(" · ") || "Seçenek"
  );
}

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();

  const images = useMemo(
    () =>
      (product.images ?? []).filter(
        (m): m is Media => typeof m === "object" && m !== null,
      ),
    [product.images],
  );

  const [variantIndex, setVariantIndex] = useState<number | null>(
    product.hasVariants ? 0 : null,
  );

  // Ana satın alma düğmesi ekrandan çıkınca mobilde yapışkan çubuk belirir.
  const buyRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const variants = product.variants ?? [];
  const selected =
    product.hasVariants && variantIndex !== null ? variants[variantIndex] : null;

  const price = product.hasVariants
    ? (selected?.price ?? null)
    : (product.basePrice ?? null);
  const stock = product.hasVariants
    ? (selected?.stock ?? 0)
    : (product.stock ?? 0);

  const canBuy = price !== null && stock > 0;

  const addToCart = () =>
    add({ productId: Number(product.id), variantIndex, quantity: 1 });

  return (
    <>
      <div className="grid gap-12 lg:grid-cols-2">
        <ProductGallery images={images} title={product.title} />

        <div className="lg:pt-4">
          <h1 className="font-heading text-4xl font-light leading-tight sm:text-5xl">
            {product.title}
          </h1>

          {price !== null ? (
            <p className="mt-4 text-2xl tabular-nums">{formatKurus(price)}</p>
          ) : null}

          {product.hasVariants && variants.length > 0 ? (
            <fieldset className="mt-8">
              <legend className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Seçenek
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {variants.map((v, i) => {
                  const out = (v.stock ?? 0) <= 0;
                  return (
                    <button
                      key={v.id ?? i}
                      type="button"
                      disabled={out}
                      onClick={() => setVariantIndex(i)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        i === variantIndex
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      } ${out ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                    >
                      {variantLabel(v)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <div className="mt-8">
            {stock > 0 ? (
              stock <= 3 ? (
                <p className="text-sm text-muted-foreground">Son {stock} adet</p>
              ) : (
                <p className="text-sm text-muted-foreground">Stokta</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Tükendi</p>
            )}
          </div>

          <div ref={buyRef} className="mt-4">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={!canBuy}
              onClick={addToCart}
            >
              {canBuy ? "Sepete ekle" : "Tükendi"}
            </Button>
          </div>

          {(product.material || product.dimensions) && (
            <dl className="mt-10 space-y-2 border-t border-border pt-6 text-sm">
              {product.material ? (
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0 text-muted-foreground">Malzeme</dt>
                  <dd>{product.material}</dd>
                </div>
              ) : null}
              {product.dimensions ? (
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0 text-muted-foreground">Ölçüler</dt>
                  <dd>{product.dimensions}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </div>
      </div>

      {/* Mobilde yapışkan satın alma çubuğu */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none lg:hidden ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-base font-light leading-tight">
              {product.title}
            </p>
            {price !== null ? (
              <p className="text-sm tabular-nums text-muted-foreground">
                {formatKurus(price)}
                {selected ? ` · ${variantLabel(selected)}` : ""}
              </p>
            ) : null}
          </div>
          <Button
            disabled={!canBuy}
            onClick={addToCart}
            tabIndex={showSticky ? 0 : -1}
          >
            {canBuy ? "Sepete ekle" : "Tükendi"}
          </Button>
        </div>
      </div>
    </>
  );
}

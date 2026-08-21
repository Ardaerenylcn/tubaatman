"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatKurus } from "@/lib/format";

export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="relative inline-flex size-9 items-center justify-center"
    >
      <ShoppingBag className="size-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
          {count}
        </span>
      ) : null}
      <span className="sr-only">Sepeti aç ({count} ürün)</span>
    </button>
  );
}

export function CartDrawer() {
  const { priced, isOpen, setOpen, setQuantity, remove, isPending } = useCart();
  const isEmpty = priced.lines.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-[92vw] max-w-md flex-col">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl font-light">
            Sepet
          </SheetTitle>
        </SheetHeader>

        {priced.issues.length > 0 ? (
          <div className="mx-4 rounded-md border border-border bg-muted p-3 text-sm">
            <ul className="space-y-1">
              {priced.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {isEmpty ? (
          <p className="px-4 py-10 text-muted-foreground">Sepetiniz boş.</p>
        ) : (
          <>
            <ul className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
              {priced.lines.map((line) => (
                <li
                  key={`${line.productId}:${line.variantIndex}`}
                  className="flex gap-4"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden bg-muted">
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt={line.imageAlt ?? line.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/urun/${line.slug}`}
                        onClick={() => setOpen(false)}
                        className="font-heading text-lg font-light leading-snug"
                      >
                        {line.title}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(line.productId, line.variantIndex)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-4" />
                        <span className="sr-only">{line.title} ürününü kaldır</span>
                      </button>
                    </div>

                    {line.variantLabel ? (
                      <p className="text-xs text-muted-foreground">
                        {line.variantLabel}
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded border border-border">
                        <button
                          type="button"
                          className="px-2 py-1 disabled:opacity-40"
                          disabled={line.quantity <= 1}
                          onClick={() =>
                            setQuantity(
                              line.productId,
                              line.variantIndex,
                              line.quantity - 1,
                            )
                          }
                        >
                          <Minus className="size-3.5" />
                          <span className="sr-only">Azalt</span>
                        </button>
                        <span className="min-w-8 text-center text-sm tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-2 py-1 disabled:opacity-40"
                          disabled={line.quantity >= line.available}
                          onClick={() =>
                            setQuantity(
                              line.productId,
                              line.variantIndex,
                              line.quantity + 1,
                            )
                          }
                        >
                          <Plus className="size-3.5" />
                          <span className="sr-only">Artır</span>
                        </button>
                      </div>
                      <span className="text-sm tabular-nums">
                        {formatKurus(line.lineTotal)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border px-4 py-4">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ara toplam</dt>
                  <dd className="tabular-nums">{formatKurus(priced.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Kargo</dt>
                  <dd className="tabular-nums">
                    {priced.shippingCost === 0
                      ? "Ücretsiz"
                      : formatKurus(priced.shippingCost)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base">
                  <dt>Toplam</dt>
                  <dd className="tabular-nums">{formatKurus(priced.total)}</dd>
                </div>
              </dl>

              <Button asChild className="mt-4 w-full" disabled={isPending}>
                <Link href="/checkout" onClick={() => setOpen(false)}>
                  Ödemeye geç
                </Link>
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Tutarlar sunucuda doğrulanır.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

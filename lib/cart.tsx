"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { priceCart } from "@/app/actions/cart";
import { EMPTY_CART, type CartLine, type PricedCart } from "@/lib/cart-types";

const STORAGE_KEY = "tubaatman.cart.v1";
const MAX_QTY_PER_LINE = 10;

type CartContextValue = {
  lines: CartLine[];
  priced: PricedCart;
  count: number;
  isPending: boolean;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  add: (line: CartLine) => void;
  setQuantity: (productId: number, variantIndex: number | null, quantity: number) => void;
  remove: (productId: number, variantIndex: number | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Depolanan veriye güvenilmez; yalnızca beklenen alanlar alınır, fiyat yok.
    return parsed.flatMap((item): CartLine[] => {
      if (typeof item !== "object" || item === null) return [];
      const o = item as Record<string, unknown>;
      const productId = Number(o.productId);
      const quantity = Number(o.quantity);
      const variantIndex =
        o.variantIndex === null || o.variantIndex === undefined
          ? null
          : Number(o.variantIndex);
      if (!Number.isInteger(productId) || productId <= 0) return [];
      if (!Number.isInteger(quantity) || quantity <= 0) return [];
      if (variantIndex !== null && !Number.isInteger(variantIndex)) return [];
      return [{ productId, variantIndex, quantity: Math.min(quantity, MAX_QTY_PER_LINE) }];
    });
  } catch {
    return [];
  }
}

const sameLine = (a: CartLine, productId: number, variantIndex: number | null) =>
  a.productId === productId && a.variantIndex === variantIndex;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [priced, setPriced] = useState<PricedCart>(EMPTY_CART);
  const [isOpen, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);

  // İlk yüklemede localStorage'dan oku
  useEffect(() => {
    setLines(readStorage());
    setHydrated(true);
  }, []);

  // Değişince yaz
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Kota dolu veya gizli mod — sepet oturumluk çalışır, hata gösterilmez.
    }
  }, [lines, hydrated]);

  // Fiyatlandırmayı her zaman sunucudan al
  useEffect(() => {
    if (!hydrated) return;
    if (lines.length === 0) {
      setPriced(EMPTY_CART);
      return;
    }
    startTransition(async () => {
      const result = await priceCart(lines);
      setPriced(result);
      // Sunucu stok nedeniyle adet düşürdüyse istemciyi ona hizala.
      const corrected = result.lines.map((l) => ({
        productId: l.productId,
        variantIndex: l.variantIndex,
        quantity: l.quantity,
      }));
      setLines((prev) =>
        JSON.stringify(prev) === JSON.stringify(corrected) ? prev : corrected,
      );
    });
  }, [lines, hydrated]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const existing = prev.find((l) =>
        sameLine(l, line.productId, line.variantIndex),
      );
      if (existing) {
        return prev.map((l) =>
          sameLine(l, line.productId, line.variantIndex)
            ? { ...l, quantity: Math.min(MAX_QTY_PER_LINE, l.quantity + line.quantity) }
            : l,
        );
      }
      return [...prev, { ...line, quantity: Math.min(MAX_QTY_PER_LINE, line.quantity) }];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback(
    (productId: number, variantIndex: number | null, quantity: number) => {
      setLines((prev) =>
        quantity <= 0
          ? prev.filter((l) => !sameLine(l, productId, variantIndex))
          : prev.map((l) =>
              sameLine(l, productId, variantIndex)
                ? { ...l, quantity: Math.min(MAX_QTY_PER_LINE, quantity) }
                : l,
            ),
      );
    },
    [],
  );

  const remove = useCallback((productId: number, variantIndex: number | null) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, productId, variantIndex)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      priced,
      count,
      isPending,
      isOpen,
      setOpen,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, priced, count, isPending, isOpen, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalı.");
  return ctx;
}

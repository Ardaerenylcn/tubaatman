"use server";

import { getPayloadClient } from "@/lib/payload";
import { EMPTY_CART, type CartLine, type PricedCart, type PricedLine } from "@/lib/cart-types";
import type { Media, Product } from "@/payload-types";

const MAX_QTY_PER_LINE = 10;

/**
 * Sepeti SUNUCUDA fiyatlandırır.
 *
 * İstemciden yalnızca (productId, variantIndex, quantity) gelir. Fiyat, stok ve
 * ürün adı veritabanındaki güncel kayıttan okunur. İstemci fiyat gönderemez;
 * gönderse bile burada dikkate alınmaz. Checkout da bu fonksiyonu kullanır,
 * böylece gösterilen tutar ile tahsil edilen tutar tek bir kaynaktan gelir.
 */
export async function priceCart(lines: CartLine[]): Promise<PricedCart> {
  if (!Array.isArray(lines) || lines.length === 0) return EMPTY_CART;

  const payload = await getPayloadClient();
  const issues: string[] = [];

  // Aynı ürün+varyant birden fazla satırda gelirse birleştir.
  const merged = new Map<string, CartLine>();
  for (const raw of lines) {
    const productId = Number(raw?.productId);
    const variantIndex =
      raw?.variantIndex === null || raw?.variantIndex === undefined
        ? null
        : Number(raw.variantIndex);
    const quantity = Math.floor(Number(raw?.quantity));

    if (!Number.isInteger(productId) || productId <= 0) continue;
    if (!Number.isInteger(quantity) || quantity <= 0) continue;
    if (variantIndex !== null && (!Number.isInteger(variantIndex) || variantIndex < 0)) {
      continue;
    }

    const key = `${productId}:${variantIndex}`;
    const existing = merged.get(key);
    merged.set(key, {
      productId,
      variantIndex,
      quantity: Math.min(
        MAX_QTY_PER_LINE,
        (existing?.quantity ?? 0) + quantity,
      ),
    });
  }

  if (merged.size === 0) return EMPTY_CART;

  const found = await payload.find({
    collection: "products",
    where: { id: { in: [...merged.values()].map((l) => l.productId) } },
    limit: merged.size,
    depth: 1,
  });

  const byId = new Map<number, Product>(
    (found.docs as Product[]).map((p) => [Number(p.id), p]),
  );

  const priced: PricedLine[] = [];

  for (const line of merged.values()) {
    const product = byId.get(line.productId);

    if (!product || !product.isActive) {
      issues.push("Sepetinizdeki bir ürün artık satışta değil ve kaldırıldı.");
      continue;
    }

    let unitPrice: number | null = null;
    let available = 0;
    let variantLabel: string | null = null;

    if (product.hasVariants) {
      const variant = (product.variants ?? [])[line.variantIndex ?? -1];
      if (!variant || typeof variant.price !== "number") {
        issues.push(`“${product.title}” için seçtiğiniz seçenek artık mevcut değil.`);
        continue;
      }
      unitPrice = variant.price;
      available = variant.stock ?? 0;
      variantLabel = [
        variant.metal === "gold" ? "Altın" : variant.metal === "silver" ? "Gümüş" : null,
        variant.size === "small"
          ? "Küçük"
          : variant.size === "medium"
            ? "Orta"
            : variant.size === "large"
              ? "Büyük"
              : null,
      ]
        .filter(Boolean)
        .join(" · ") || null;
    } else {
      if (typeof product.basePrice !== "number") {
        issues.push(`“${product.title}” fiyatlandırılmamış ve kaldırıldı.`);
        continue;
      }
      unitPrice = product.basePrice;
      available = product.stock ?? 0;
    }

    if (available <= 0) {
      issues.push(`“${product.title}” tükendi ve sepetinizden kaldırıldı.`);
      continue;
    }

    const quantity = Math.min(line.quantity, available);
    if (quantity < line.quantity) {
      issues.push(
        `“${product.title}” için stokta ${available} adet kaldı; adet güncellendi.`,
      );
    }

    const cover = (product.images ?? []).find(
      (m): m is Media => typeof m === "object" && m !== null,
    );

    priced.push({
      productId: Number(product.id),
      variantIndex: line.variantIndex,
      quantity,
      title: product.title,
      variantLabel,
      slug: product.slug,
      imageUrl: cover?.url ?? null,
      imageAlt: cover?.alt ?? product.title,
      unitPrice,
      lineTotal: unitPrice * quantity,
      available,
    });
  }

  const subtotal = priced.reduce((sum, l) => sum + l.lineTotal, 0);

  const settings = await payload.findGlobal({ slug: "settings" });
  const flatRate = settings?.shipping?.flatRate ?? 0;
  const freeThreshold = settings?.shipping?.freeThreshold;

  const shippingCost =
    priced.length === 0
      ? 0
      : typeof freeThreshold === "number" && freeThreshold > 0 && subtotal >= freeThreshold
        ? 0
        : flatRate;

  return {
    lines: priced,
    issues: [...new Set(issues)],
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
  };
}

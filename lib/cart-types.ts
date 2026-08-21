/**
 * SEPET GÜVENLİK KURALI
 * ---------------------
 * İstemcideki sepet YALNIZCA ürün kimliği, seçenek indeksi ve adet tutar.
 * FİYAT İSTEMCİDE TUTULMAZ ve istemciden gelen hiçbir fiyata güvenilmez.
 * Görüntülenen ve tahsil edilen tutarlar her zaman sunucuda, veritabanındaki
 * güncel kayıttan yeniden hesaplanır (bkz. app/actions/cart.ts).
 */

export type CartLine = {
  productId: number;
  /** hasVariants=true ise seçilen varyantın dizideki sırası. */
  variantIndex: number | null;
  quantity: number;
};

/** Sunucuda fiyatlandırılmış satır — istemci bunu asla üretmez, yalnızca gösterir. */
export type PricedLine = {
  productId: number;
  variantIndex: number | null;
  quantity: number;
  title: string;
  variantLabel: string | null;
  slug: string;
  imageUrl: string | null;
  imageAlt: string | null;
  unitPrice: number;
  lineTotal: number;
  /** Stokta kalan adet. quantity bunu aşıyorsa satır uyarılı gösterilir. */
  available: number;
};

export type PricedCart = {
  lines: PricedLine[];
  /** Stok yetersizliği veya kaldırılmış ürün nedeniyle düşen satırlar. */
  issues: string[];
  subtotal: number;
  shippingCost: number;
  total: number;
};

export const EMPTY_CART: PricedCart = {
  lines: [],
  issues: [],
  subtotal: 0,
  shippingCost: 0,
  total: 0,
};

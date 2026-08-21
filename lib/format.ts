/**
 * PARA BİRİMİ KURALI
 * ------------------
 * Tüm fiyatlar veritabanında ve kod içinde KURUŞ cinsinden tam sayı (integer)
 * olarak taşınır. Ondalıklı sayı (float) ile para tutmak yuvarlama hatası
 * üretir — 0.1 + 0.2 !== 0.3. Biçimlendirme yalnızca ekrana basarken yapılır.
 *
 * 790000 kuruş  →  "7.900,00 ₺"
 */

const withCents = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const whole = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Kuruş cinsinden tam sayıyı görüntülenebilir Türk Lirası metnine çevirir.
 * Tutar tam liraysa kuruş hanesi gösterilmez (₺7.900), değilse gösterilir
 * (₺7.900,50). Mevcut sitedeki gösterimle uyumlu.
 */
export function formatKurus(kurus: number): string {
  if (!Number.isInteger(kurus)) {
    throw new Error(
      `formatKurus tam sayı bekler (kuruş), alınan: ${kurus}. Fiyatlar asla float olarak taşınmaz.`,
    );
  }
  return kurus % 100 === 0 ? whole.format(kurus / 100) : withCents.format(kurus / 100);
}

/** iyzico'ya gönderilecek ondalıklı string ("7900.00"). Yalnızca ödeme sınırında kullanılır. */
export function kurusToDecimalString(kurus: number): string {
  if (!Number.isInteger(kurus)) {
    throw new Error(`kurusToDecimalString tam sayı bekler, alınan: ${kurus}`);
  }
  const lira = Math.trunc(kurus / 100);
  const remainder = Math.abs(kurus % 100);
  return `${lira}.${String(remainder).padStart(2, "0")}`;
}

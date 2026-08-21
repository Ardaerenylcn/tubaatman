/**
 * Türkçe karakterleri koruyarak URL slug'ı üretir.
 *
 * Basit bir `[^a-z0-9]` temizliği Türkçe harfleri SİLER:
 *   "Düş Kapanı Küpe" → "d-kapan-k-pe"   (yanlış)
 * Doğru davranış harfleri Latin karşılıklarına çevirmektir:
 *   "Düş Kapanı Küpe" → "dus-kapani-kupe"
 *
 * Dikkat: Türkçe'de İ→i ve I→ı özel durumdur. Bu yüzden küçültme
 * işleminden ÖNCE harf değişimi yapılır; aksi halde "İ" JavaScript'in
 * varsayılan küçültmesiyle "i̇" (i + birleşen nokta) olur ve slug bozulur.
 * Yayındaki sitede "deni̇z-kabuklari" tam olarak bu hatadan kaynaklanıyor.
 */
const MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i",
  İ: "i", i: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
  â: "a", Â: "a",
  î: "i", Î: "i",
  û: "u", Û: "u",
};

export function slugify(input: string): string {
  return input
    .split("")
    .map((ch) => MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    // Kalan aksanlı harfleri (é, ñ …) taban harfe indir
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

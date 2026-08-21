import { getPayload } from "payload";
import config from "../payload.config";

/** Kategoriler — slug'lar mevcut sitedekiyle birebir aynı. */
const CATEGORIES = [
  { title: "Kolye", slug: "kolye", order: 1 },
  { title: "Küpe", slug: "kupe", order: 2 },
  { title: "Yüzük", slug: "yuzuk", order: 3 },
  { title: "Erkek Kolye", slug: "erkekkolye", order: 4 },
  { title: "Erkek Yüzük", slug: "erkekyuzuk", order: 5 },
];

/**
 * Koleksiyonlar — slug'lar yayındaki siteden alındı.
 * İstisna: "Deniz Kabukları" mevcut sitede bozuk bir slug'la duruyor
 * (deni̇z-kabuklari → "i" + birleşen nokta, U+0069 U+0307). Temiz halini
 * kullanıyoruz; eskisinden 301 yönlendirmesi Faz 9'da eklenecek.
 */
const COLLECTIONS = [
  { title: "Güneş Saatleri", slug: "gunes-saatleri", order: 1 },
  { title: "Kelt", slug: "kelt", order: 2 },
  { title: "Dört Yapraklı İnci", slug: "mineli", order: 3 },
  { title: "Yerküre", slug: "yerkure", order: 4 },
  { title: "Mavi Kuyu", slug: "mavi-kuyu", order: 5 },
  { title: "Japon Şemsiyeleri", slug: "japonsemsiye", order: 6 },
  { title: "Hipnoz", slug: "hipnoz", order: 7 },
  { title: "Pul", slug: "pul", order: 8 },
  { title: "Kozalaklar", slug: "kozalaklar", order: 9 },
  { title: "Burcunuzun Yıldızları", slug: "burcunuzun-yildizlari", order: 10 },
  { title: "İncili Peri", slug: "incili", order: 11 },
  { title: "Cosmos", slug: "cosmos", order: 12 },
  { title: "Düş Kapanları", slug: "dus-kapanlari", order: 13 },
  { title: "Dönüşüm", slug: "donus", order: 14 },
  { title: "Bir Damla Deniz", slug: "1damladeniz", order: 15 },
  { title: "Deniz Kabukları", slug: "deniz-kabuklari", order: 16 },
  { title: "Erkek", slug: "erkek", order: 17 },
];

/**
 * İçerik sayfaları. Yasal metinlerin İÇERİĞİ BİLEREK BOŞ bırakılmıştır —
 * KVKK, mesafeli satış ve iade şartları hukuki sorumluluk doğurur ve
 * uydurulamaz. Yayına çıkmadan önce doldurulması zorunludur.
 */
const PAGES = [
  { title: "Hakkımızda", slug: "hakkinda" },
  { title: "KVKK Aydınlatma Metni", slug: "kvkk" },
  { title: "Gizlilik Politikası", slug: "gizlilik" },
  { title: "Mesafeli Satış Sözleşmesi", slug: "mesafelisatis" },
  { title: "Teslimat ve İade Şartları", slug: "teslimatveiade" },
];

async function upsertPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  data: { title: string; slug: string },
) {
  const existing = await payload.find({
    collection: "pages",
    where: { slug: { equals: data.slug } },
    limit: 1,
  });
  if (existing.docs.length > 0) return "zaten var";
  await payload.create({ collection: "pages", data });
  return "oluşturuldu";
}

async function upsert(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: "categories" | "collections",
  data: { title: string; slug: string; order: number },
) {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: data.slug } },
    limit: 1,
  });
  if (existing.docs.length > 0) {
    await payload.update({
      collection,
      id: existing.docs[0].id,
      data,
    });
    return "güncellendi";
  }
  await payload.create({ collection, data });
  return "oluşturuldu";
}

const run = async () => {
  const payload = await getPayload({ config });

  for (const c of CATEGORIES) {
    const action = await upsert(payload, "categories", c);
    console.log(`  kategori  ${c.slug.padEnd(24)} ${action}`);
  }
  for (const c of COLLECTIONS) {
    const action = await upsert(payload, "collections", c);
    console.log(`  koleksiyon ${c.slug.padEnd(23)} ${action}`);
  }

  for (const p of PAGES) {
    const action = await upsertPage(payload, p);
    console.log(`  sayfa      ${p.slug.padEnd(23)} ${action}`);
  }

  console.log(
    `\nToplam: ${CATEGORIES.length} kategori, ${COLLECTIONS.length} koleksiyon, ${PAGES.length} sayfa.`,
  );
  console.log(
    "\nUYARI: Yasal sayfaların içeriği BOŞ. KVKK, Gizlilik, Mesafeli Satış ve\n" +
      "Teslimat/İade metinleri yayına çıkmadan önce doldurulmak zorunda.",
  );
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

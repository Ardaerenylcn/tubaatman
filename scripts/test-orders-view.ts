/**
 * Özel sipariş listesi görünümünü doğrular.
 * Geçici yönetici oluşturur, giriş yapar, sayfayı çeker, kullanıcıyı siler.
 * Dev sunucusu ayakta olmalıdır.
 */
import { getPayload } from "payload";
import config from "../payload.config";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
let pass = 0, fail = 0;
const check = (n: string, ok: boolean, d = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${n}${ok ? "" : `  ← ${d}`}`);
  ok ? pass++ : fail++;
};

const run = async () => {
  const payload = await getPayload({ config });
  const email = `ordview-${Date.now()}@example.invalid`;
  const password = "Gecici!" + Math.random().toString(36).slice(2, 12);
  const user = await payload.create({
    collection: "users",
    data: { email, password, name: "Sipariş Testi" },
  });

  try {
    const login = await fetch(`${BASE}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";

    const get = async (qs = "") => {
      const res = await fetch(`${BASE}/admin/collections/orders${qs}`, {
        headers: { cookie },
      });
      return { status: res.status, html: await res.text() };
    };

    const { status, html } = await get();
    check("sayfa yüklendi", status === 200, `HTTP ${status}`);
    check("özel görünüm kullanılıyor", /class="[^"]*taord/.test(html));
    check("Payload varsayılan listesi değil", !/collection-list__wrap/.test(html));
    check("başlık Siparişler", /taord__title[^>]*>Siparişler/.test(html));
    check("Yeni Sipariş Ekle düğmesi", /Yeni Sipariş Ekle/.test(html));

    for (const label of ["Satışlar", "Siparişler", "Ort. sipariş değeri"]) {
      check(`özet: ${label}`, html.includes(label));
    }
    check("zaman aralığı seçici", /Son 30 gün/.test(html));
    check("Analizlere Git bağlantısı", /Analizlere Git/.test(html));

    for (const col of ["Oluşturulma tarihi", "Müşteri", "Ödeme", "Karşılanma durumu", "Toplam", "Ögeler"]) {
      check(`sütun: ${col}`, html.includes(col));
    }

    check("arama kutusu", /taord__search/.test(html));
    check("durum süzgeci", /Tüm ögeler/.test(html));
    check("ödeme rozeti", /Ödendi/.test(html));
    check("karşılanma rozeti", /Karşılandı|Kargoda|Hazırlanıyor|Karşılanmadı/.test(html));
    check("tutarlar ₺ ile biçimli", /₺[0-9.]/.test(html));

    // Arama gerçekten süzüyor mu
    const found = await get("?ara=Akkaya");
    const missing = await get("?ara=zzzbulunmayanzzz");
    check("arama sonuç süzüyor", /Akkaya/.test(found.html));
    check("eşleşme yoksa boş durum", /uyan sipariş yok/.test(missing.html));

    // Durum süzgeci
    const cancelled = await get("?durum=cancelled");
    check("durum süzgeci çalışıyor",
      !/Karşılandı/.test(cancelled.html) || /İptal/.test(cancelled.html));
  } finally {
    await payload.delete({ collection: "users", id: user.id });
  }

  console.log(`\nSONUÇ: ${pass} geçti, ${fail} başarısız`);
  process.exit(fail === 0 ? 0 : 1);
};

run().catch((e) => { console.error(e); process.exit(1); });

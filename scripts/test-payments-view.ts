/**
 * Ödemeler ekranını doğrular. Geçici yönetici oluşturur, giriş yapar,
 * sayfayı çeker, kullanıcıyı siler. Dev sunucusu ayakta olmalıdır.
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
  const email = `payview-${Date.now()}@example.invalid`;
  const password = "Gecici!" + Math.random().toString(36).slice(2, 12);
  const user = await payload.create({
    collection: "users",
    data: { email, password, name: "Ödeme Testi" },
  });

  try {
    const login = await fetch(`${BASE}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
    const get = async (qs = "") => {
      const res = await fetch(`${BASE}/admin/collections/payments${qs}`, { headers: { cookie } });
      return { status: res.status, html: await res.text() };
    };

    const { status, html } = await get("?gun=90");
    check("sayfa yüklendi", status === 200, `HTTP ${status}`);
    check("özel görünüm kullanılıyor", /class="[^"]*tapay/.test(html));
    check("başlık Ödemeler", /tapay__title[^>]*>Ödemeler/.test(html));
    check("alt başlık", /Müşterilerinizden gelen ödemeleri takip edin/.test(html));
    check("Genel bakış seçici", /Genel bakış/.test(html));
    check("Brüt Satış Hacmi", /Brüt Satış Hacmi/.test(html));
    check("Başarılı Ödemeler", /Başarılı Ödemeler/.test(html));
    check("panel başlığı Tüm Ödemeler", /Tüm Ödemeler/.test(html));
    check("arama kutusu", /Ad, ödeme numarası/.test(html));

    for (const col of ["Ödeme tarihi", "Müşteri", "Ürün / Hizmet", "Ödeme yöntemi", "İşlem durumu", "İşlem tarihi"]) {
      check(`sütun: ${col}`, html.includes(col));
    }

    check("iyzico ödeme yöntemi yazısı", /Bankamatik ve Kredi Kartı/.test(html));
    check("Başarılı rozeti", /tapay__badge--good/.test(html));
    check("Reddedildi rozeti", /Reddedildi/.test(html));
    check("tutarlar ₺ ile", /₺[0-9.]/.test(html));
    check("kart bilgisi maskeli", /••••/.test(html));
    check("tam kart numarası yok", !/\b\d{16}\b/.test(html));

    const declined = await get("?durum=declined&gun=90");
    check("durum süzgeci çalışıyor",
      /Reddedildi/.test(declined.html) && !/tapay__badge--good/.test(declined.html));

    const none = await get("?ara=zzzyokzzz");
    check("eşleşme yoksa boş durum", /uyan ödeme yok/.test(none.html));
  } finally {
    await payload.delete({ collection: "users", id: user.id });
  }

  console.log(`\nSONUÇ: ${pass} geçti, ${fail} başarısız`);
  process.exit(fail === 0 ? 0 : 1);
};

run().catch((e) => { console.error(e); process.exit(1); });

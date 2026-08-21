/**
 * Sipariş detay ekranını doğrular: render, veri ve eylemler.
 * Geçici yönetici oluşturur, giriş yapar, siler. Dev sunucusu gereklidir.
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
  const found = await payload.find({ collection: "orders", limit: 1, sort: "-createdAt" });
  const order = found.docs[0];
  if (!order) { console.log("Sipariş yok, test atlandı."); process.exit(0); }

  const email = `detail-${Date.now()}@example.invalid`;
  const password = "Gecici!" + Math.random().toString(36).slice(2, 12);
  const user = await payload.create({
    collection: "users", data: { email, password, name: "Detay Testi" },
  });

  try {
    const login = await fetch(`${BASE}/api/users/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
    const res = await fetch(`${BASE}/admin/collections/orders/${order.id}`, {
      headers: { cookie },
    });
    const html = await res.text();

    check("sayfa yüklendi", res.status === 200, `HTTP ${res.status}`);
    check("özel detay görünümü", /class="[^"]*taod/.test(html));
    check("Payload varsayılan formu değil", !/document-fields__edit/.test(html));
    check("kırıntı navigasyonu", /taod__crumbs/.test(html));
    check("sipariş numarası başlıkta", html.includes(order.orderNumber));
    check("ödeme + karşılanma rozeti", (html.match(/taod__badge--/g) ?? []).length >= 4);
    check("oluşturulma tarihi", /tarihinde oluşturuldu/.test(html));
    check("Diğer Eylemler menüsü", /Diğer Eylemler/.test(html));

    for (const t of [
      "Ögeler (", "Gönderilecek Ürünler", "Ödeme Bilgileri", "Toplam",
      "Müşterinin ödediği tutar", "Sipariş Hareketleri",
      "Müşterileriniz bunu görmez", "Sipariş Bilgileri", "İletişim Bilgileri",
      "Teslimat yöntemi", "Gönderim adresi", "Haritayı Görüntüle",
      "Fatura adresi", "Ek bilgi", "TC Kimlik No", "Etiketler", "Etiket Ata",
    ]) {
      check(`bölüm: ${t}`, html.includes(t));
    }

    check("zaman çizelgesinde kayıt var", /taod__tl-item/.test(html));
    check("müşteri adı görünüyor",
      html.includes(order.customer?.firstName ?? "___"));
    check("ürün kalemi listeleniyor", /taod__item-total/.test(html));

    // Sunucu eylemleri gerçekten kimlik istiyor mu
    const { addOrderNote } = await import("../app/actions/order-admin");
    let denied = false;
    try {
      const r = await addOrderNote(Number(order.id), "yetkisiz deneme");
      denied = !r.ok;
    } catch { denied = true; }
    check("giriş yapmadan not eklenemiyor", denied);
  } finally {
    await payload.delete({ collection: "users", id: user.id });
  }

  console.log(`\nSONUÇ: ${pass} geçti, ${fail} başarısız`);
  process.exit(fail === 0 ? 0 : 1);
};

run().catch((e) => { console.error(e); process.exit(1); });

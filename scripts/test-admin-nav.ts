/**
 * Yönetim paneli yan barının giriş yapmış kullanıcıda doğru render
 * edildiğini doğrular. Geçici bir yönetici oluşturur, giriş yapar,
 * /admin sayfasını çeker ve kullanıcıyı siler.
 *
 * Çalışması için dev sunucusunun ayakta olması gerekir.
 */
import { getPayload } from "payload";
import config from "../payload.config";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const EMAIL = `navtest-${Date.now()}@example.invalid`;
const PASS = "Gecici!" + Math.random().toString(36).slice(2, 12);

let pass = 0, fail = 0;
const check = (n: string, ok: boolean, d = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${n}${ok ? "" : `  ← ${d}`}`);
  ok ? pass++ : fail++;
};

const run = async () => {
  const payload = await getPayload({ config });
  const user = await payload.create({
    collection: "users",
    data: { email: EMAIL, password: PASS, name: "Nav Testi" },
  });

  try {
    const login = await fetch(`${BASE}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASS }),
    });
    const cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
    check("giriş başarılı", login.status === 200 && cookie !== "", `HTTP ${login.status}`);

    const page = await fetch(`${BASE}/admin`, { headers: { cookie } });
    const html = await page.text();
    const n = (re: RegExp) => (html.match(re) ?? []).length;
    const labels = [...html.matchAll(/<span class="tanav__label">([^<]*)<\/span>/g)].map((m) => m[1]);

    check("/admin yüklendi", page.status === 200, `HTTP ${page.status}`);
    check("özel yan bar render edildi", n(/class="tanav"/g) === 1);
    check("menü satırları var", n(/tanav__row/g) >= 12, `${n(/tanav__row/g)} satır`);
    check("gruplar arası ayraç var", n(/tanav__rule/g) >= 2, `${n(/tanav__rule/g)} ayraç`);
    check("Favoriler bölümü var", /Favoriler/.test(html));
    check("rozet render edildi", n(/tanav__badge/g) >= 1);
    check("Payload varsayılan nav kaldırıldı", !/nav__link/.test(html));
    check("çalışan bağlantılar var", /href="\/admin\/collections\/products"/.test(html) || labels.includes("Katalog"));

    console.log("\n  görünen ana maddeler:");
    labels.forEach((l) => console.log("    -", l));
  } finally {
    await payload.delete({ collection: "users", id: user.id });
    console.log("\n  geçici kullanıcı silindi");
  }

  console.log(`\nSONUÇ: ${pass} geçti, ${fail} başarısız`);
  process.exit(fail === 0 ? 0 : 1);
};

run().catch((e) => { console.error(e); process.exit(1); });

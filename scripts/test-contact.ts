import { getPayload } from "payload";
import config from "../payload.config";
import { submitContact } from "../app/actions/contact";

let pass = 0, fail = 0;
const check = (n: string, ok: boolean, d = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${n}${ok ? "" : `  ← ${d}`}`);
  ok ? pass++ : fail++;
};
const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.append(k, v));
  return f;
};

const valid = {
  name: "Test Kullanıcı",
  email: "test@example.com",
  message: "Özel bir kolye tasarımı hakkında bilgi almak istiyorum.",
  subject: "custom",
};

const run = async () => {
  const payload = await getPayload({ config });
  const before = (await payload.find({ collection: "messages", limit: 0 })).totalDocs;

  let r = await submitContact(null, fd({ ...valid, name: "A" }));
  check("çok kısa ad reddediliyor", !r.ok);

  r = await submitContact(null, fd({ ...valid, email: "bozuk-eposta" }));
  check("geçersiz e-posta reddediliyor", !r.ok);

  r = await submitContact(null, fd({ ...valid, message: "kısa" }));
  check("çok kısa mesaj reddediliyor", !r.ok);

  r = await submitContact(null, fd({ ...valid, message: "x".repeat(5000) }));
  check("aşırı uzun mesaj reddediliyor", !r.ok);

  // Bot tuzağı: dolu honeypot sessizce başarılı döner ama kayıt OLUŞTURMAZ
  const mid = (await payload.find({ collection: "messages", limit: 0 })).totalDocs;
  r = await submitContact(null, fd({ ...valid, website: "http://spam.example" }));
  const afterHoneypot = (await payload.find({ collection: "messages", limit: 0 })).totalDocs;
  check("bot tuzağı başarılı görünüyor (bota ipucu vermiyor)", r.ok === true);
  check("bot tuzağı kayıt oluşturmuyor", afterHoneypot === mid,
        `${mid} → ${afterHoneypot}`);

  // Geçerli gönderi
  r = await submitContact(null, fd(valid));
  check("geçerli mesaj kabul ediliyor", r.ok === true);

  const after = await payload.find({
    collection: "messages",
    limit: 1,
    sort: "-createdAt",
  });
  check("mesaj veritabanına yazıldı", after.totalDocs === before + 1,
        `${before} → ${after.totalDocs}`);
  check("durum 'new' olarak kaydedildi", after.docs[0]?.status === "new");
  check("konu korunuyor", after.docs[0]?.subject === "custom");

  // temizlik
  if (after.docs[0]) {
    await payload.delete({ collection: "messages", id: after.docs[0].id });
  }
  console.log("\nTest verisi temizlendi.");
  console.log(`\nSONUÇ: ${pass} geçti, ${fail} başarısız`);
  process.exit(fail === 0 ? 0 : 1);
};

run().catch((e) => { console.error(e); process.exit(1); });

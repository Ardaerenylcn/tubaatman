/**
 * Sepet fiyatlandırmasının güvenlik davranışını doğrular.
 * Gerçek veritabanına test ürünü yazar, sonra temizler.
 */
import { getPayload } from "payload";
import sharp from "sharp";
import config from "../payload.config";
import { priceCart } from "../app/actions/cart";

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${name}${ok ? "" : `  ← ${detail}`}`);
  ok ? pass++ : fail++;
};

const run = async () => {
  const payload = await getPayload({ config });

  const png = await sharp({
    create: { width: 40, height: 50, channels: 3, background: "#d8d2c8" },
  })
    .png()
    .toBuffer();

  const media = await payload.create({
    collection: "media",
    data: { alt: "Test görseli" },
    file: { name: "test.png", data: png, mimetype: "image/png", size: png.length },
  });

  const product = await payload.create({
    collection: "products",
    data: {
      title: "TEST Kolye",
      slug: `test-kolye-${Date.now()}`,
      images: [media.id],
      hasVariants: true,
      isActive: true,
      variants: [
        { metal: "silver", size: "medium", price: 790000, stock: 2 },
        { metal: "gold", size: "medium", price: 1290000, stock: 0 },
      ],
    },
  });
  const id = Number(product.id);
  console.log(`\nTest ürünü #${id} oluşturuldu (gümüş ₺7.900 / 2 adet, altın ₺12.900 / 0 adet)\n`);

  // 1 — normal fiyatlandırma
  let r = await priceCart([{ productId: id, variantIndex: 0, quantity: 1 }]);
  check("doğru fiyat sunucudan geliyor", r.lines[0]?.unitPrice === 790000,
        `alınan ${r.lines[0]?.unitPrice}`);
  check("varyant etiketi çözümleniyor", r.lines[0]?.variantLabel === "Gümüş · Orta",
        `alınan ${r.lines[0]?.variantLabel}`);

  // 2 — istemci sahte fiyat gönderiyor
  r = await priceCart([
    { productId: id, variantIndex: 0, quantity: 1, unitPrice: 1, price: 1, lineTotal: 1 } as never,
  ]);
  check("istemcinin gönderdiği sahte fiyat yok sayılıyor", r.lines[0]?.unitPrice === 790000,
        `alınan ${r.lines[0]?.unitPrice}`);
  check("toplam sunucudan hesaplanıyor", r.subtotal === 790000, `alınan ${r.subtotal}`);

  // 3 — stoktan fazla adet
  r = await priceCart([{ productId: id, variantIndex: 0, quantity: 99 }]);
  check("adet stokla sınırlanıyor", r.lines[0]?.quantity === 2, `alınan ${r.lines[0]?.quantity}`);
  check("stok uyarısı üretiliyor", r.issues.length > 0);

  // 4 — tükenmiş varyant
  r = await priceCart([{ productId: id, variantIndex: 1, quantity: 1 }]);
  check("tükenmiş varyant sepete girmiyor", r.lines.length === 0);

  // 5 — olmayan varyant indeksi
  r = await priceCart([{ productId: id, variantIndex: 99, quantity: 1 }]);
  check("geçersiz varyant indeksi reddediliyor", r.lines.length === 0);

  // 6 — negatif ve sıfır adet
  r = await priceCart([{ productId: id, variantIndex: 0, quantity: -5 }]);
  check("negatif adet reddediliyor", r.lines.length === 0);

  // 7 — olmayan ürün
  r = await priceCart([{ productId: 999999, variantIndex: null, quantity: 1 }]);
  check("olmayan ürün reddediliyor", r.lines.length === 0);

  // 8 — aynı satır iki kez → birleşiyor, yine stokla sınırlı
  r = await priceCart([
    { productId: id, variantIndex: 0, quantity: 2 },
    { productId: id, variantIndex: 0, quantity: 2 },
  ]);
  check("yinelenen satırlar birleşiyor", r.lines.length === 1);
  check("birleşince de stok sınırı geçerli", r.lines[0]?.quantity === 2,
        `alınan ${r.lines[0]?.quantity}`);

  // 9 — satılmayan ürün
  await payload.update({ collection: "products", id, data: { isActive: false } });
  r = await priceCart([{ productId: id, variantIndex: 0, quantity: 1 }]);
  check("satışta olmayan ürün sepetten düşüyor", r.lines.length === 0);

  // temizlik
  await payload.delete({ collection: "products", id });
  await payload.delete({ collection: "media", id: media.id });
  console.log("\nTest verisi temizlendi.");

  console.log(`\nSONUÇ: ${pass} geçti, ${fail} başarısız`);
  process.exit(fail === 0 ? 0 : 1);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

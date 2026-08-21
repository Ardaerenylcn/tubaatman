/**
 * ÖRNEK VERİ — tasarımı değerlendirmek için.
 * Ürün adları ve fiyatlar yayındaki tubaatman.com'dan alınmıştır.
 * Görseller kod içinde üretilen YER TUTUCULARDIR, gerçek fotoğraf değildir.
 *
 * Temizlemek için:  npm run seed:samples -- --clean
 */
import { getPayload } from "payload";
import sharp from "sharp";
import config from "../payload.config";
import { slugify } from "../lib/slug";

const MARK = "[ÖRNEK]";

type Sample = {
  title: string;
  collection: string;
  categories: string[];
  price?: number;
  stock?: number;
  variants?: { metal: "silver" | "gold"; size?: "small" | "medium" | "large"; price: number; stock: number }[];
  featured?: boolean;
  material?: string;
  dimensions?: string;
  tone: [number, number, number];
};

const SAMPLES: Sample[] = [
  {
    title: "Güneş Saatleri Kolye",
    collection: "gunes-saatleri",
    categories: ["kolye"],
    variants: [
      { metal: "silver", size: "small", price: 429000, stock: 4 },
      { metal: "silver", size: "medium", price: 620000, stock: 2 },
      { metal: "silver", size: "large", price: 790000, stock: 1 },
    ],
    featured: true,
    material: "925 ayar gümüş",
    dimensions: "Zincir 45 cm",
    tone: [198, 190, 176],
  },
  {
    title: "Kelt Kolye, Gümüş",
    collection: "kelt",
    categories: ["kolye"],
    price: 690000,
    stock: 3,
    featured: true,
    material: "925 ayar gümüş",
    dimensions: "Ø 3,2 cm",
    tone: [176, 172, 164],
  },
  {
    title: "Cosmos Kolye, Altın",
    collection: "cosmos",
    categories: ["kolye"],
    variants: [
      { metal: "gold", size: "small", price: 1150000, stock: 2 },
      { metal: "gold", size: "medium", price: 1349000, stock: 0 },
    ],
    featured: true,
    material: "14 ayar altın",
    tone: [206, 188, 152],
  },
  {
    title: "Japon Şemsiyeleri Kolye",
    collection: "japonsemsiye",
    categories: ["kolye"],
    price: 899000,
    stock: 2,
    material: "925 ayar gümüş, mine",
    tone: [190, 178, 180],
  },
  {
    title: "Bir Damla Deniz Kolye",
    collection: "1damladeniz",
    categories: ["kolye"],
    price: 499000,
    stock: 6,
    material: "925 ayar gümüş",
    tone: [172, 186, 192],
  },
  {
    title: "Kozalak Küpe",
    collection: "kozalaklar",
    categories: ["kupe"],
    price: 480000,
    stock: 4,
    featured: true,
    material: "925 ayar gümüş",
    tone: [186, 176, 158],
  },
  {
    title: "Hipnoz Yüzük",
    collection: "hipnoz",
    categories: ["yuzuk"],
    variants: [
      { metal: "silver", size: "small", price: 720000, stock: 2 },
      { metal: "silver", size: "medium", price: 720000, stock: 3 },
      { metal: "silver", size: "large", price: 760000, stock: 0 },
    ],
    material: "925 ayar gümüş",
    tone: [182, 180, 184],
  },
  {
    title: "Kozmik Halka Yüzük",
    collection: "cosmos",
    categories: ["yuzuk"],
    price: 950000,
    stock: 1,
    material: "925 ayar gümüş",
    tone: [168, 170, 178],
  },
  {
    title: "Yerküre Erkek Kolye",
    collection: "yerkure",
    categories: ["erkekkolye"],
    price: 1200000,
    stock: 2,
    featured: true,
    material: "925 ayar oksitli gümüş",
    tone: [150, 150, 148],
  },
  {
    title: "Dönüşüm Erkek Yüzük",
    collection: "donus",
    categories: ["erkekyuzuk"],
    price: 1380000,
    stock: 1,
    material: "925 ayar gümüş",
    tone: [158, 154, 150],
  },
  {
    title: "Düş Kapanı Küpe",
    collection: "dus-kapanlari",
    categories: ["kupe"],
    price: 449000,
    stock: 5,
    material: "925 ayar gümüş, inci",
    tone: [200, 194, 188],
  },
  {
    title: "İncili Peri Kolye",
    collection: "incili",
    categories: ["kolye"],
    price: 720000,
    stock: 0,
    material: "925 ayar gümüş, tatlı su incisi",
    tone: [204, 198, 196],
  },
];

/** Yumuşak degrade + hafif form içeren yer tutucu görsel. Gerçek fotoğraf değil. */
async function placeholder(tone: [number, number, number], label: string, i: number) {
  const [r, g, b] = tone;
  const dark = `rgb(${Math.max(0, r - 42)},${Math.max(0, g - 42)},${Math.max(0, b - 42)})`;
  const light = `rgb(${Math.min(255, r + 26)},${Math.min(255, g + 26)},${Math.min(255, b + 26)})`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stop-color="${light}"/>
        <stop offset="100%" stop-color="rgb(${r},${g},${b})"/>
      </linearGradient>
      <radialGradient id="v" cx="50%" cy="42%" r="52%">
        <stop offset="0%" stop-color="${light}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${dark}" stop-opacity="0.28"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="1500" fill="url(#g)"/>
    <rect width="1200" height="1500" fill="url(#v)"/>
    <circle cx="600" cy="640" r="${190 + (i % 4) * 26}" fill="none" stroke="${dark}" stroke-opacity="0.42" stroke-width="3"/>
    <circle cx="600" cy="640" r="${96 + (i % 3) * 20}" fill="none" stroke="${dark}" stroke-opacity="0.3" stroke-width="2"/>
    <line x1="600" y1="${300 + (i % 3) * 30}" x2="600" y2="450" stroke="${dark}" stroke-opacity="0.35" stroke-width="2"/>
    <text x="600" y="1400" text-anchor="middle" font-family="sans-serif" font-size="30"
          fill="${dark}" fill-opacity="0.55" letter-spacing="3">YER TUTUCU · ${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
}

const run = async () => {
  const payload = await getPayload({ config });
  const clean = process.argv.includes("--clean");

  if (clean) {
    // SIRA ÖNEMLİ: görsellere referans veren kayıtlar önce temizlenmeli,
    // yoksa settings_hero.image_id NOT NULL kısıtı silmeyi reddeder.
    await payload.updateGlobal({
      slug: "settings",
      data: { hero: [], atelier: { enabled: false, image: null } },
    });

    const colsAll = await payload.find({ collection: "collections", limit: 100 });
    for (const c of colsAll.docs) {
      if (c.cover) await payload.update({ collection: "collections", id: c.id, data: { cover: null } });
    }
    const catsAll = await payload.find({ collection: "categories", limit: 100 });
    for (const c of catsAll.docs) {
      if (c.cover) await payload.update({ collection: "categories", id: c.id, data: { cover: null } });
    }

    const products = await payload.find({
      collection: "products",
      where: { title: { like: MARK } },
      limit: 500,
    });
    for (const p of products.docs) {
      await payload.delete({ collection: "products", id: p.id });
    }

    const payments = await payload.find({
      collection: "payments",
      where: { notes: { like: MARK } },
      limit: 500,
    });
    for (const pay of payments.docs) {
      await payload.delete({ collection: "payments", id: pay.id });
    }

    const orders = await payload.find({
      collection: "orders",
      where: { notes: { like: MARK } },
      limit: 500,
    });
    for (const o of orders.docs) {
      await payload.delete({ collection: "orders", id: o.id });
    }

    const media = await payload.find({
      collection: "media",
      where: { alt: { like: MARK } },
      limit: 500,
    });
    for (const m of media.docs) {
      await payload.delete({ collection: "media", id: m.id });
    }

    console.log(
      `Temizlendi: ${products.docs.length} örnek ürün, ${orders.docs.length} örnek sipariş, ${payments.docs.length} örnek ödeme, ${media.docs.length} yer tutucu görsel, kapaklar, slider ve atölye bölümü.`,
    );
    process.exit(0);
  }

  // slug → id haritaları
  const cols = await payload.find({ collection: "collections", limit: 100 });
  const cats = await payload.find({ collection: "categories", limit: 100 });
  const colId = new Map(cols.docs.map((c) => [c.slug, c.id]));
  const catId = new Map(cats.docs.map((c) => [c.slug, c.id]));

  let n = 0;
  for (const [i, s] of SAMPLES.entries()) {
    const title = `${s.title} ${MARK}`;
    const exists = await payload.find({
      collection: "products",
      where: { title: { equals: title } },
      limit: 1,
    });
    if (exists.docs.length) {
      console.log(`  atlandı (zaten var): ${s.title}`);
      continue;
    }

    const img = await placeholder(s.tone, s.title, i);
    const media = await payload.create({
      collection: "media",
      data: { alt: `${s.title} — yer tutucu görsel ${MARK}` },
      file: {
        name: `ornek-${i}-${Date.now()}.jpg`,
        data: img,
        mimetype: "image/jpeg",
        size: img.length,
      },
    });

    const hasVariants = Boolean(s.variants?.length);
    await payload.create({
      collection: "products",
      data: {
        title,
        slug: `ornek-${slugify(s.title)}`,
        images: [media.id],
        collection: colId.get(s.collection),
        categories: s.categories.map((c) => catId.get(c)).filter(Boolean) as number[],
        hasVariants,
        ...(hasVariants ? { variants: s.variants } : { basePrice: s.price, stock: s.stock }),
        material: s.material,
        dimensions: s.dimensions,
        isActive: true,
        isFeatured: Boolean(s.featured),
      },
    });

    // Koleksiyonun kapağı yoksa bu görseli kapak yap
    const cid = colId.get(s.collection);
    if (cid) {
      const col = cols.docs.find((c) => c.id === cid);
      if (col && !col.cover) {
        await payload.update({ collection: "collections", id: cid, data: { cover: media.id } });
      }
    }

    n++;
    console.log(`  eklendi: ${s.title}`);
  }

  // ---- Kategori kapakları ----
  const catsAll = await payload.find({ collection: "categories", limit: 100 });
  for (const [i, cat] of catsAll.docs.entries()) {
    if (cat.cover) continue;
    const img = await placeholder([184 - i * 6, 180 - i * 5, 172 - i * 4], cat.title, i + 40);
    const m = await payload.create({
      collection: "media",
      data: { alt: `${cat.title} kategori kapağı — yer tutucu ${MARK}` },
      file: { name: `kat-${i}-${Date.now()}.jpg`, data: img, mimetype: "image/jpeg", size: img.length },
    });
    await payload.update({ collection: "categories", id: cat.id, data: { cover: m.id } });
  }
  console.log("  kategori kapakları eklendi");

  // ---- Ana sayfa slider ----
  const HERO = [
    { slug: "kelt", eyebrow: "Koleksiyon", title: "Kelt", subtitle: "Başı ve sonu olmayan düğümler; kesintisiz bir çizginin taşıdığı süreklilik fikri.", tone: [176, 172, 164] as [number, number, number] },
    { slug: "cosmos", eyebrow: "Yeni", title: "Cosmos", subtitle: "Gökyüzünün geometrisi: yörüngeler, halkalar ve aradaki boşluk.", tone: [206, 188, 152] as [number, number, number] },
    { slug: "gunes-saatleri", eyebrow: "Koleksiyon", title: "Güneş Saatleri", subtitle: "Işığın düştüğü yerde zaman okunur. Üç boy, tek fikir.", tone: [198, 190, 176] as [number, number, number] },
  ];

  const heroRows = [];
  for (const [i, h] of HERO.entries()) {
    const img = await placeholder(h.tone, h.title, i + 60);
    const m = await payload.create({
      collection: "media",
      data: { alt: `${h.title} slider görseli — yer tutucu ${MARK}` },
      file: { name: `hero-${i}-${Date.now()}.jpg`, data: img, mimetype: "image/jpeg", size: img.length },
    });
    heroRows.push({
      image: m.id,
      eyebrow: h.eyebrow,
      title: h.title,
      subtitle: h.subtitle,
      linkLabel: "Koleksiyonu gör",
      linkHref: `/${h.slug}`,
    });
  }

  // ---- Atölye bölümü ----
  const atelierImg = await placeholder([178, 170, 158], "Atölye", 80);
  const atelierMedia = await payload.create({
    collection: "media",
    data: { alt: `Atölye görseli — yer tutucu ${MARK}` },
    file: { name: `atolye-${Date.now()}.jpg`, data: atelierImg, mimetype: "image/jpeg", size: atelierImg.length },
  });

  await payload.updateGlobal({
    slug: "settings",
    data: {
      hero: heroRows,
      atelier: {
        enabled: true,
        image: atelierMedia.id,
        title: "Her parça elden geçer",
        text: "Bir takı önce kâğıtta bir çizgidir. Sonra mumda bir biçim, sonra metalde bir ağırlık. Atölyede üretim adetli değil; her parçanın kendi yüzeyi, kendi izleri vardır.\n\nBu yüzden iki kolye hiçbir zaman tam olarak aynı olmaz.",
        linkLabel: "Hikâyemiz",
        linkHref: "/hakkinda",
      },
    },
  });
  console.log("  slider (3 kare) ve atölye bölümü eklendi");

  // ---- Örnek siparişler ----
  const CUSTOMERS = [
    ["Çiğdem", "Akkaya", "cigdem@example.invalid", "0532 111 22 33", "Kadıköy", "İstanbul"],
    ["Selvi Başak", "Öztürk", "selvi@example.invalid", "0533 222 33 44", "Çankaya", "Ankara"],
    ["Özge", "Kara", "ozge@example.invalid", "0534 333 44 55", "Konak", "İzmir"],
    ["Eren", "Turgut", "eren@example.invalid", "0535 444 55 66", "Nilüfer", "Bursa"],
    ["Serra", "Faracı", "serra@example.invalid", "0536 555 66 77", "Muratpaşa", "Antalya"],
    ["Sibel", "Kişnişçi", "sibel@example.invalid", "0537 666 77 88", "Beşiktaş", "İstanbul"],
    ["Hatice", "Taşdemir", "hatice@example.invalid", "0538 777 88 99", "Şahinbey", "Gaziantep"],
    ["Merve", "Yıldırım", "merve@example.invalid", "0539 888 99 00", "Selçuklu", "Konya"],
  ] as const;

  const STATUSES = [
    "delivered", "delivered", "shipped", "shipped",
    "preparing", "paid", "paid", "pending",
    "delivered", "cancelled", "delivered", "refunded", "delivered",
  ] as const;

  const allProducts = await payload.find({ collection: "products", limit: 100 });
  const pickable = allProducts.docs.filter((d) => !d.hasVariants && typeof d.basePrice === "number");

  const existingOrders = await payload.find({
    collection: "orders",
    where: { notes: { like: MARK } },
    limit: 1,
  });

  if (existingOrders.docs.length === 0 && pickable.length > 0) {
    for (let i = 0; i < STATUSES.length; i++) {
      const c = CUSTOMERS[i % CUSTOMERS.length];
      const itemCount = (i % 3) + 1;
      const items = [];
      let subtotal = 0;
      for (let k = 0; k < itemCount; k++) {
        const prod = pickable[(i + k) % pickable.length];
        const qty = k === 0 ? 1 : ((i + k) % 2) + 1;
        const unit = prod.basePrice as number;
        const line = unit * qty;
        subtotal += line;
        items.push({
          product: prod.id,
          titleSnapshot: prod.title,
          unitPrice: unit,
          quantity: qty,
          lineTotal: line,
        });
      }
      const shippingCost = subtotal >= 500000 ? 0 : 15000;
      // Tarihleri geriye doğru dağıt
      const daysAgo = i * 3 + (i % 4);
      const created = new Date(Date.now() - daysAgo * 86400_000 - i * 3600_000);

      await payload.create({
        collection: "orders",
        data: {
          orderNumber: `#${10013 - i}`,
          status: STATUSES[i],
          customer: { firstName: c[0], lastName: c[1], email: c[2], phone: c[3] },
          shippingAddress: { line1: `${c[4]} Mah. Örnek Sok. No:${i + 3}`, district: c[4], city: c[5] },
          billingSameAsShipping: true,
          items,
          subtotal,
          shippingCost,
          total: subtotal + shippingCost,
          contractAcceptedAt: created.toISOString(),
          notes: `Örnek sipariş ${MARK}`,
          createdAt: created.toISOString(),
        },
      });
    }
    console.log(`  ${STATUSES.length} örnek sipariş eklendi`);
  } else {
    console.log("  örnek siparişler zaten var, atlandı");
  }

  // ---- Örnek ödeme işlemleri ----
  const existingPayments = await payload.find({
    collection: "payments",
    where: { notes: { like: MARK } },
    limit: 1,
  });

  if (existingPayments.docs.length === 0) {
    const seededOrders = await payload.find({
      collection: "orders",
      where: { notes: { like: MARK } },
      sort: "-createdAt",
      limit: 50,
      depth: 0,
    });

    const CARDS = [
      ["Bonus", "4242"], ["World", "5528"], ["Maximum", "9014"],
      ["Axess", "3317"], ["Paraf", "7788"],
    ] as const;
    const DECLINE_REASONS = [
      ["10051", "Yetersiz bakiye"],
      ["10005", "İşlem onaylanmadı"],
      ["10012", "Kart 3D Secure doğrulamasını geçemedi"],
      ["10041", "Kart kullanıma kapalı"],
    ] as const;

    let created = 0;

    // Başarılı ödemeler: her ödenmiş siparişe bir işlem
    for (const [i, o] of seededOrders.docs.entries()) {
      const paidLike = ["paid", "preparing", "shipped", "delivered"].includes(o.status ?? "");
      if (!paidLike) continue;
      const card = CARDS[i % CARDS.length];
      const at = new Date(o.createdAt);
      await payload.create({
        collection: "payments",
        data: {
          paymentId: `iyz-${100000 + i}`,
          conversationId: o.orderNumber,
          order: o.id,
          customerName: `${o.customer?.firstName ?? ""} ${o.customer?.lastName ?? ""}`.trim(),
          customerEmail: o.customer?.email,
          itemSummary: (o.items ?? []).map((it) => it.titleSnapshot).join(", ").replace(/ \[ÖRNEK\]/g, ""),
          status: o.status === "refunded" ? "refunded" : "success",
          amount: o.total,
          method: {
            channel: "card",
            cardFamily: card[0],
            cardLastFour: card[1],
            installment: i % 4 === 0 ? 3 : 1,
          },
          processedAt: new Date(at.getTime() + 3 * 60_000).toISOString(),
          notes: `Örnek ödeme ${MARK}`,
          createdAt: at.toISOString(),
        },
      });
      created++;
    }

    // Reddedilen denemeler — gerçek hayatta olur, ekranda görünmeli
    for (let i = 0; i < 6; i++) {
      const o = seededOrders.docs[i % Math.max(1, seededOrders.docs.length)];
      const card = CARDS[(i + 2) % CARDS.length];
      const reason = DECLINE_REASONS[i % DECLINE_REASONS.length];
      const at = new Date(Date.now() - (i * 5 + 1) * 86400_000 - i * 900_000);
      await payload.create({
        collection: "payments",
        data: {
          paymentId: `iyz-fail-${200000 + i}`,
          conversationId: `${o?.orderNumber ?? "#0"}-deneme`,
          customerName: `${o?.customer?.firstName ?? "Müşteri"} ${o?.customer?.lastName ?? ""}`.trim(),
          customerEmail: o?.customer?.email,
          itemSummary: (o?.items ?? []).map((it) => it.titleSnapshot).join(", ").replace(/ \[ÖRNEK\]/g, "") || "Sepet",
          status: "declined",
          amount: o?.total ?? 490000,
          method: { channel: "card", cardFamily: card[0], cardLastFour: card[1], installment: 1 },
          failure: { code: reason[0], message: reason[1] },
          processedAt: at.toISOString(),
          notes: `Örnek ödeme ${MARK}`,
          createdAt: at.toISOString(),
        },
      });
      created++;
    }

    console.log(`  ${created} örnek ödeme işlemi eklendi`);
  } else {
    console.log("  örnek ödemeler zaten var, atlandı");
  }

  console.log(`\n${n} örnek ürün eklendi. Temizlemek için: npm run seed:samples -- --clean`);
  process.exit(0);
};

run().catch((e) => { console.error(e); process.exit(1); });

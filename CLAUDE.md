@AGENTS.md

# tubaatman.com

Tuba Atman Design Studio için el yapımı takı e-ticaret sitesi. Wix'ten Next.js'e
tam yeniden inşa. Detaylı plan: `~/.claude/plans/shiny-giggling-babbage.md`

**Stack**: Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui ·
Payload CMS 3 · Neon Postgres · Vercel Blob · iyzico Checkout Form · Resend

**Dil**: Site ve admin paneli Türkçe. Kullanıcıyla iletişim Türkçe.

## Para ve ödeme kuralları

Bunlar pazarlık konusu değil — gerçek para akan bir sistem:

- Fiyatlar **kuruş cinsinden `integer`** olarak tutulur. Para için asla float kullanma.
- Sepet istemcide sadece ürün ID + varyant + adet tutar. **Fiyat istemciden gelmez.**
  Checkout'ta sepet sunucuda DB'den yeniden fiyatlanır ve stok doğrulanır.
- iyzico dönüşü **her zaman** sunucu tarafında `checkoutFormRetrieve` ile doğrulanır.
  Callback'ten gelen hiçbir veriye güvenilmez.
- Webhook (`/api/iyzico/webhook`) `X-IYZ-SIGNATURE-V3` başlığını HMAC-SHA256 ile
  doğrular ve **idempotent** çalışır — aynı olay iki kez gelirse stok iki kez düşmez.
- iyzico çağrıları Node.js runtime'ında çalışır, edge'de değil.

## Vercel Blob

Ürün görselleri **`tubaatman-public`** store'unda (fra1, **public** erişim).

Blob store'un erişim modu (public/private) **store oluşturulurken belirlenir ve
sonradan değiştirilemez.** Ürün görselleri public olmak zorunda: CDN'den doğrudan
servis edilmeleri ve Google Görseller'de indekslenmeleri gerekiyor. Private store
görselleri Function üzerinden akıtır — yavaş ve pahalı.

`.env.local`'de **`BLOB_STORE_ID` bulunmamalı.** Varsa SDK OIDC yoluna geçer
(`VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID`) ve o kimlik eski private store'a işaret
edebilir. Doğru kurulum: yalnızca `BLOB_READ_WRITE_TOKEN`.

Boş ve kullanılmayan bir `tubaatman-media` (private) store'u duruyor — silinebilir.

## SEO

Mevcut sitenin URL'leri **birebir korunur** (`/kelt`, `/kolye`, `/cosmos` …).
Yeni bir slug uydurmadan önce yayındaki adresi kontrol et.

## gstack

`~/.claude/skills/gstack` altında kurulu, ancak bu projede **yalnızca `/cso`
kullanılıyor** — ödeme akışı, webhook doğrulama ve sunucu tarafı fiyatlamanın
güvenlik denetimi için (Faz 4 ve sonrası).

Diğer gstack skill'lerini bu projede kullanma:

- `/design-shotgun` ve `/design-html` bağımsız "Pretext-native" HTML üretiyor;
  Tailwind + shadcn + RSC stack'imize uymuyor. Tasarım için `ui-ux-pro-max`,
  `vercel:shadcn` ve `artifact-design` kullan.
- `/review`, `/qa`, `/ship`, `/land-and-deploy` yerleşik `/code-review`,
  `/security-review` ve `vercel:deploy` ile örtüşüyor — yerleşikleri tercih et.

`/cso` ilk çalıştığında "diğer projelerden öğrenilenler" sorarsa cevap
**proje kapsamlı** — bu bir müşteri kod tabanı, çapraz bulaşma istemiyoruz.
(`cross_project_learnings=false` olarak ayarlandı.)

## ui-ux-pro-max

`~/.claude/skills/ui-ux-pro-max` altında kurulu. Arama aracı:

```bash
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<sorgu>" --domain <alan>
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<sorgu>" --stack nextjs
```

**Kullan:** kural ve implementasyon katmanı için. `data/stacks/nextjs.csv` (62 kural,
`nextjs 16.2` için 2026-08-13'te doğrulanmış), `data/stacks/shadcn.csv` (68 kural),
`data/ux-guidelines.csv` (119 kural), `data/react-performance.csv`. Bunlar Do/Don't,
iyi/kötü kod örneği, severity ve doküman linki içeriyor — güvenilir.

**Font seçerken:** `data/google-fonts.csv` içinde `Subsets` sütunu var. Türkçe için
`latin-ext` şart (ğ ş ı İ ç ö ü). Aday fontu önermeden önce bu sütundan doğrula.

### `--design-system` çıktısına körü körüne uyma

Bu jeneratör anahtar kelime eşleştirmesi yapıyor, tasarım muhakemesi değil.
`"handmade artisan jewelry ecommerce editorial"` sorgusuna verdiği cevap:

- **Pattern:** "Feature-Rich Showcase" — feature grid, use cases, logo duvarı.
  Bu bir SaaS landing page kalıbı; takı kataloğu için yanlış.
- **Style:** "Vibrant & Block-based" — *"bold, energetic, playful, high color
  contrast, duotone"*, en uygun olduğu yerler *"startups, gaming, youth-focused"*.
  ₺25.000'lik el yapımı takı için tamamen yanlış register.
- **Colors:** zümrüt yeşili + turuncu CTA, nane yeşili zemin. Renkli zemin ürün
  fotoğrafıyla yarışır — takıda zemin nötr olmalı.
- **Typography:** Amatic SC — "handmade/artisan" etiketli çünkü *kelimenin
  düz anlamıyla* el yazısı görünüyor. İnce, kondens, dekoratif bir display face;
  gövde metni için kullanılamaz, lüks takı için uygun değil.
  (Türkçe desteği var, sorun o değil — sorun karakteri.)

`products.csv` ayrıca "E-commerce Luxury" ve "Luxury/Premium Brand" için birincil
stil olarak **Liquid Glass + Glassmorphism** öneriyor. Bunu da kullanma: efekt
katmanı ürün fotoğrafının önüne geçer ve trend bağımlıdır. Aynı satırların ikincil
önerisi **"Minimalism & Swiss Style"**, planımızdaki editoryal galeri yönüne uyan
budur.

**Bu proje için tasarım yönü sabit:** nötr/sessiz zemin, geniş beyaz alan, büyük
ürün görselleri, ince serif başlık + nötr sans gövde. **Takının kendisi tek renk
kaynağıdır.** Efekt yok, gradient yok, glassmorphism yok.

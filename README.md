# tubaatman.com

Tuba Atman Design Studio için el yapımı takı e-ticaret sitesi.
Wix Stores'tan Next.js + Vercel'e tam yeniden inşa.

- **Canlı:** https://tubaatman.vercel.app
- **Yönetim paneli:** https://tubaatman.vercel.app/admin

## Stack

| Katman | Teknoloji |
|---|---|
| Uygulama | Next.js 16 (App Router), TypeScript, Tailwind v4, shadcn/ui |
| İçerik & ürün yönetimi | Payload CMS 3 (gömülü `/admin`, arayüz Türkçe) |
| Veritabanı | Neon Postgres (fra1) |
| Görseller | Vercel Blob (fra1, **public** store) |
| Ödeme | iyzico Checkout Form *(Faz 4 — henüz yok)* |
| E-posta | Resend *(Faz 5 — henüz yok)* |

## Kurulum

```bash
npm install
vercel link            # ardaerenylcns-projects/tubaatman
vercel env pull .env.local
npm run dev
```

İlk açılışta `/admin` adresinde yönetici hesabı oluşturulması istenir.

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run seed` | Kategori, koleksiyon ve içerik sayfalarını oluşturur (idempotent) |
| `npm run seed:samples` | Tasarımı değerlendirmek için örnek ürün + slider verisi |
| `npm run seed:samples -- --clean` | Örnek veriyi tamamen siler |
| `npm run test:cart` | Sepet fiyatlandırma ve stok güvenliği testleri |
| `npm run test:contact` | İletişim formu doğrulama testleri |
| `npm run generate:types` | Payload şemasından TypeScript tipleri üretir |

> Node betikleri `.env.local`'i kendiliğinden okumaz; komutlar
> `node --env-file=.env.local` ile sarılmıştır. Yeni betik eklerken aynısını yapın.

## Bilmeniz gereken kararlar

**Para kuruş cinsinden integer tutulur.** `790000` = 7.900,00 TL. Float ile para
taşımak yuvarlama hatası üretir. Biçimlendirme yalnızca ekrana basarken,
`lib/format.ts` üzerinden yapılır.

**Sepette fiyat istemcide tutulmaz.** Tarayıcı yalnızca ürün kimliği, varyant ve
adet gönderir. Fiyat ve stok her seferinde sunucuda, veritabanından yeniden
hesaplanır (`app/actions/cart.ts`). İstemciden gelen fiyat bilgisi yok sayılır.

**URL'ler yayındaki Wix sitesiyle birebir aynı.** `/kelt`, `/kolye`, `/cosmos`…
Slug değiştirmek Google'da indekslenmiş adresleri ve SEO değerini kaybettirir.
Tek segmentli adresler sırayla kategori → koleksiyon → içerik sayfası olarak
çözümlenir (`app/(frontend)/[slug]/page.tsx`).

**Slug üretimi Türkçe'ye duyarlı.** `lib/slug.ts` harfleri silmez, çevirir:
"Düş Kapanı Küpe" → `dus-kapani-kupe`. Küçültme işlemi harf değişiminden sonra
yapılır; aksi halde `İ` harfi birleşen nokta içeren bozuk bir slug üretir
(yayındaki sitedeki `deni̇z-kabuklari` adresi bu hatanın sonucudur).

**Blob store public olmak zorunda.** Erişim modu store oluşturulurken belirlenir
ve **sonradan değiştirilemez**. `.env.local` içinde `BLOB_STORE_ID` bulunmamalı —
varsa SDK OIDC yoluna geçer ve eski bir store'a yazabilir.

**`"type": "module"` gereklidir.** Payload ESM'dir; `create-next-app` bu alanı
koymaz ve olmadan `ERR_REQUIRE_ASYNC_MODULE` alınır.

## Deploy

`main` dalına yapılan her push production deploy'u tetikler.

**Commit yazarının e-postası geçerli olmalıdır.** Vercel, commit yazarını
GitHub hesabıyla eşleştiremezse deployment'ı **build başlamadan bloklar** ve
CLI'da yalnızca `UNKNOWN` durumu görünür — log dönmez, sebep yalnızca panelde
yazar. Bu depo için doğru ayar zaten yapılmıştır:

```bash
git config --local user.email "143708462+Ardaerenylcn@users.noreply.github.com"
```

Yeni bir makinede çalışırken ya da global ayarınız bozuksa kontrol edin:

```bash
git log -1 --pretty='%an <%ae>'
```

## Yayın öncesi tamamlanması gerekenler

- [ ] KVKK, Gizlilik, Mesafeli Satış ve Teslimat/İade metinleri (şu an **boş**)
- [ ] Satıcı bilgileri: ticari unvan, adres, vergi dairesi/no, MERSİS
- [ ] iyzico üretim anahtarları ve panelde webhook adresi
- [ ] Gerçek ürün ve fotoğrafların girilmesi, örnek verinin temizlenmesi
- [ ] `tubaatman.com` DNS'inin Wix'ten Vercel'e taşınması
- [ ] Wix aboneliği, geçiş doğrulanana kadar kapatılmamalı

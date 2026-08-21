/**
 * Yönetim paneli yan bar tanımı.
 *
 * `href` verilen maddeler çalışır durumdadır. `href` verilmeyenler
 * yer tutucudur — adım adım doldurulacaktır ve arayüzde soluk görünür.
 * Bu ayrım bilinçlidir: çalışmayan bir bağlantıyı çalışıyormuş gibi
 * göstermek, panelde gezinen kişiyi yanıltır.
 */
export type MenuItem = {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
  badge?: string;
  children?: { label: string; href?: string }[];
};

export type IconName =
  | "home"
  | "sparkles"
  | "receipt"
  | "gem"
  | "grid"
  | "monitor"
  | "megaphone"
  | "creditCard"
  | "inbox"
  | "users"
  | "chart"
  | "zap"
  | "settings"
  | "layout"
  | "code";

export type MenuGroup = { id: string; items: MenuItem[] };

const A = "/admin";

export const MENU: MenuGroup[] = [
  {
    id: "main",
    items: [
      { id: "home", label: "Ana Sayfa", icon: "home", href: A },
      {
        id: "sales",
        label: "Satış",
        icon: "receipt",
        children: [
          { label: "Siparişler", href: `${A}/collections/orders` },
          { label: "Mesajlar", href: `${A}/collections/messages` },
          { label: "İadeler" },
        ],
      },
      {
        id: "catalog",
        label: "Katalog",
        icon: "gem",
        children: [
          { label: "Ürünler", href: `${A}/collections/products` },
          { label: "Koleksiyonlar", href: `${A}/collections/collections` },
          { label: "Kategoriler", href: `${A}/collections/categories` },
          { label: "Stok durumu" },
        ],
      },
      {
        id: "apps",
        label: "Uygulamalar",
        icon: "grid",
        children: [{ label: "Yakında" }],
      },
    ],
  },
  {
    id: "growth",
    items: [
      {
        id: "site",
        label: "Site ve İçerik",
        icon: "monitor",
        children: [
          { label: "Sayfalar", href: `${A}/collections/pages` },
          { label: "Görseller", href: `${A}/collections/media` },
          { label: "Ana sayfa slider", href: `${A}/globals/settings` },
        ],
      },
      {
        id: "marketing",
        label: "Pazarlama",
        icon: "megaphone",
        children: [
          { label: "İndirim kodları" },
          { label: "E-posta bültenleri" },
        ],
      },
      {
        id: "payments",
        label: "Ödeme Alma",
        icon: "creditCard",
        badge: "YAKINDA",
        children: [
          { label: "iyzico ayarları" },
          { label: "Taksit seçenekleri" },
        ],
      },
      { id: "inbox", label: "Gelen Kutusu", icon: "inbox", href: `${A}/collections/messages` },
      {
        id: "customers",
        label: "Müşteriler",
        icon: "users",
        children: [{ label: "Müşteri listesi" }, { label: "Randevular" }],
      },
      {
        id: "analytics",
        label: "Analizler",
        icon: "chart",
        children: [{ label: "Satış raporu" }, { label: "Ürün performansı" }],
      },
      { id: "automations", label: "Otomasyonlar", icon: "zap" },
    ],
  },
  {
    id: "system",
    items: [
      { id: "settings", label: "Ayarlar", icon: "settings", href: `${A}/globals/settings` },
      { id: "users", label: "Kullanıcılar", icon: "layout", href: `${A}/collections/users` },
      {
        id: "dev",
        label: "Geliştirici Araçları",
        icon: "code",
        children: [
          { label: "GraphQL", href: "/api/graphql-playground" },
          { label: "REST API", href: "/api" },
        ],
      },
    ],
  },
];

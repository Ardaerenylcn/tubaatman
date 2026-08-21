import type { CollectionConfig } from "payload";

/**
 * Ziyaretçi olayları.
 *
 * MAHREMİYET KURALI: Ham IP adresi HİÇBİR ZAMAN saklanmaz. Konum, Vercel'in
 * istek başlıklarından okunup yalnızca ülke/şehir/bölge olarak yazılır.
 * Tekil ziyaretçi ayrımı `visitorHash` ile yapılır: her gün değişen bir tuzla
 * hash'lenir, geri döndürülemez ve ertesi gün aynı kişi farklı hash üretir.
 *
 * Erişim varsayılan olarak kapalıdır — yalnızca giriş yapmış yönetici okur.
 * Kayıtlar sunucu tarafından Local API ile yazılır (erişim denetimini atlar).
 */
export const AnalyticsEvents: CollectionConfig = {
  slug: "analytics-events",
  labels: { singular: "Ziyaret", plural: "Ziyaretler" },
  admin: {
    hidden: true, // panelde ham liste olarak gösterilmez; gösterge paneli kullanılır
    useAsTitle: "path",
  },
  timestamps: true,
  fields: [
    {
      name: "eventId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "İstemcide üretilen kimlik; süre güncellemesi bununla eşleşir." },
    },
    { name: "sessionId", type: "text", required: true, index: true },
    {
      name: "visitorHash",
      type: "text",
      index: true,
      admin: { description: "Günlük tuzla hash'lenmiş ziyaretçi kimliği. IP saklanmaz." },
    },
    { name: "path", type: "text", required: true, index: true },
    { name: "title", type: "text" },
    { name: "referrer", type: "text" },
    { name: "referrerHost", type: "text", index: true },
    {
      name: "source",
      type: "text",
      index: true,
      admin: { description: "Normalleştirilmiş kaynak: google, instagram, doğrudan …" },
    },
    {
      type: "row",
      fields: [
        { name: "country", type: "text", index: true },
        { name: "region", type: "text" },
        { name: "city", type: "text" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "device",
          type: "select",
          options: [
            { label: "Mobil", value: "mobile" },
            { label: "Tablet", value: "tablet" },
            { label: "Masaüstü", value: "desktop" },
          ],
          index: true,
        },
        { name: "browser", type: "text" },
        { name: "os", type: "text" },
      ],
    },
    {
      name: "durationMs",
      type: "number",
      index: true,
      admin: { description: "Sayfada geçirilen süre. Ayrılırken güncellenir." },
    },
    {
      name: "isEntry",
      type: "checkbox",
      defaultValue: false,
      index: true,
      admin: { description: "Oturumun ilk sayfası mı." },
    },
  ],
};

import type { CollectionConfig } from "payload";

/**
 * Ödeme işlem kaydı.
 *
 * Her iyzico denemesi — başarılı olsun ya da olmasın — buraya yazılır.
 * Sipariş kaydı yalnızca BAŞARILI ödemeyi taşır; reddedilen denemeler
 * siparişte görünmez. Oysa "kaç deneme reddedildi, neden" sorusu hem
 * müşteri desteği hem de dolandırıcılık takibi için gereklidir.
 *
 * KART VERİSİ SAKLANMAZ. Yalnızca iyzico'nun döndürdüğü maskelenmiş
 * son dört hane ve kart ailesi tutulur; tam kart numarası, CVC veya
 * son kullanma tarihi hiçbir zaman bu sisteme girmez — ödeme formu
 * iyzico'da barındırılır.
 */
export const Payments: CollectionConfig = {
  slug: "payments",
  labels: { singular: "Ödeme", plural: "Ödemeler" },
  admin: {
    useAsTitle: "paymentId",
    defaultColumns: ["paymentId", "customerName", "amount", "status", "createdAt"],
    group: "Satış",
    components: {
      views: {
        list: { Component: "@/components/admin/payments/PaymentsList#default" },
      },
    },
  },
  timestamps: true,
  fields: [
    {
      type: "row",
      fields: [
        { name: "paymentId", type: "text", index: true, label: "iyzico ödeme no" },
        { name: "conversationId", type: "text", index: true, label: "conversationId" },
      ],
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
      label: "Sipariş",
    },
    {
      type: "row",
      fields: [
        { name: "customerName", type: "text", label: "Müşteri" },
        { name: "customerEmail", type: "email", label: "E-posta" },
      ],
    },
    {
      name: "itemSummary",
      type: "text",
      label: "Ürün / Hizmet",
      admin: { description: "Ödemeye konu ürünlerin kısa özeti." },
    },
    {
      type: "row",
      fields: [
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "pending",
          index: true,
          label: "İşlem durumu",
          options: [
            { label: "Başarılı", value: "success" },
            { label: "Reddedildi", value: "declined" },
            { label: "Bekliyor", value: "pending" },
            { label: "İade edildi", value: "refunded" },
            { label: "İptal edildi", value: "cancelled" },
          ],
        },
        {
          name: "amount",
          type: "number",
          required: true,
          label: "Tutar (kuruş)",
          admin: { description: "KURUŞ cinsinden tam sayı." },
        },
      ],
    },
    {
      name: "method",
      type: "group",
      label: "Ödeme yöntemi",
      fields: [
        {
          name: "channel",
          type: "select",
          defaultValue: "card",
          label: "Kanal",
          options: [
            { label: "Bankamatik ve Kredi Kartı — iyzico", value: "card" },
            { label: "Havale / EFT", value: "transfer" },
            { label: "Kapıda ödeme", value: "cod" },
          ],
        },
        { name: "cardFamily", type: "text", label: "Kart ailesi" },
        {
          name: "cardLastFour",
          type: "text",
          maxLength: 4,
          label: "Son 4 hane",
          admin: { description: "iyzico'dan gelen maskelenmiş değer. Tam kart numarası saklanmaz." },
        },
        { name: "installment", type: "number", label: "Taksit" },
      ],
    },
    {
      name: "failure",
      type: "group",
      label: "Hata (reddedilen işlemler)",
      admin: { condition: (data) => data?.status === "declined" },
      fields: [
        { name: "code", type: "text", label: "Hata kodu" },
        { name: "message", type: "text", label: "Banka mesajı" },
      ],
    },
    {
      name: "processedAt",
      type: "date",
      label: "İşlem tarihi",
      admin: {
        description: "Bankanın işlemi sonuçlandırdığı an. Ödeme tarihinden farklı olabilir.",
        date: { pickerAppearance: "dayAndTime" },
      },
    },
    { name: "notes", type: "textarea", label: "Notlar" },
  ],
};

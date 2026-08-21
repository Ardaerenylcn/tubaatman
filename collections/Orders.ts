import type { CollectionConfig } from "payload";

/**
 * Siparişler. Erişim varsayılan olarak kapalı — yalnızca giriş yapmış
 * yönetici okuyabilir. Kalem fiyatları sipariş anında KOPYALANIR;
 * ürün fiyatı sonradan değişse bile sipariş değişmez.
 */
export const Orders: CollectionConfig = {
  slug: "orders",
  labels: { singular: "Sipariş", plural: "Siparişler" },
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "status", "total", "createdAt"],
    group: "Satış",
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "orderNumber",
          type: "text",
          required: true,
          unique: true,
          index: true,
          label: "Sipariş no",
        },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "pending",
          label: "Durum",
          options: [
            { label: "Ödeme bekliyor", value: "pending" },
            { label: "Ödendi", value: "paid" },
            { label: "Hazırlanıyor", value: "preparing" },
            { label: "Kargoya verildi", value: "shipped" },
            { label: "Teslim edildi", value: "delivered" },
            { label: "İptal edildi", value: "cancelled" },
            { label: "İade edildi", value: "refunded" },
            { label: "Ödeme başarısız", value: "failed" },
          ],
        },
      ],
    },
    {
      name: "customer",
      type: "group",
      label: "Müşteri",
      fields: [
        {
          type: "row",
          fields: [
            { name: "firstName", type: "text", required: true, label: "Ad" },
            { name: "lastName", type: "text", required: true, label: "Soyad" },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "email", type: "email", required: true, label: "E-posta" },
            { name: "phone", type: "text", required: true, label: "Telefon" },
          ],
        },
      ],
    },
    {
      name: "shippingAddress",
      type: "group",
      label: "Teslimat adresi",
      fields: [
        { name: "line1", type: "textarea", required: true, label: "Adres" },
        {
          type: "row",
          fields: [
            { name: "district", type: "text", required: true, label: "İlçe" },
            { name: "city", type: "text", required: true, label: "İl" },
            { name: "postalCode", type: "text", label: "Posta kodu" },
          ],
        },
      ],
    },
    {
      name: "billingSameAsShipping",
      type: "checkbox",
      defaultValue: true,
      label: "Fatura adresi teslimat adresiyle aynı",
    },
    {
      name: "billingAddress",
      type: "group",
      label: "Fatura adresi",
      admin: { condition: (data) => !data?.billingSameAsShipping },
      fields: [
        { name: "line1", type: "textarea", label: "Adres" },
        {
          type: "row",
          fields: [
            { name: "district", type: "text", label: "İlçe" },
            { name: "city", type: "text", label: "İl" },
            { name: "postalCode", type: "text", label: "Posta kodu" },
          ],
        },
      ],
    },
    {
      name: "items",
      type: "array",
      required: true,
      label: "Sipariş kalemleri",
      admin: {
        description:
          "Fiyatlar sipariş anında kopyalanmıştır; ürün fiyatı sonradan değişse bile burası değişmez.",
      },
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          label: "Ürün",
        },
        { name: "titleSnapshot", type: "text", required: true, label: "Ürün adı" },
        { name: "variantLabel", type: "text", label: "Seçenek" },
        {
          type: "row",
          fields: [
            {
              name: "unitPrice",
              type: "number",
              required: true,
              label: "Birim fiyat (kuruş)",
            },
            {
              name: "quantity",
              type: "number",
              required: true,
              min: 1,
              label: "Adet",
            },
            {
              name: "lineTotal",
              type: "number",
              required: true,
              label: "Satır toplamı (kuruş)",
            },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "subtotal", type: "number", required: true, label: "Ara toplam (kuruş)" },
        { name: "shippingCost", type: "number", required: true, defaultValue: 0, label: "Kargo (kuruş)" },
        { name: "total", type: "number", required: true, label: "Genel toplam (kuruş)" },
      ],
    },
    {
      name: "payment",
      type: "group",
      label: "Ödeme (iyzico)",
      admin: { description: "Sunucu tarafından doldurulur, elle değiştirmeyin." },
      fields: [
        { name: "conversationId", type: "text", index: true, label: "conversationId" },
        { name: "token", type: "text", index: true, label: "CF token" },
        { name: "paymentId", type: "text", index: true, label: "paymentId" },
        { name: "paidAt", type: "date", label: "Ödeme zamanı" },
        { name: "installment", type: "number", label: "Taksit" },
      ],
    },
    {
      name: "contractAcceptedAt",
      type: "date",
      label: "Sözleşme onay zamanı",
      admin: {
        description:
          "Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu'nun kabul edildiği an. Yasal kayıt.",
      },
    },
    {
      name: "shipping",
      type: "group",
      label: "Kargo",
      fields: [
        { name: "carrier", type: "text", label: "Kargo firması" },
        { name: "trackingNumber", type: "text", label: "Takip numarası" },
        { name: "shippedAt", type: "date", label: "Kargoya veriliş" },
      ],
    },
    { name: "notes", type: "textarea", label: "Notlar" },
  ],
};

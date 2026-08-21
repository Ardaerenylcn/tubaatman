import type { CollectionConfig } from "payload";

/**
 * İletişim formu gönderileri. Erişim varsayılan olarak kapalı.
 * Faz 5'te Resend eklendiğinde buraya bir afterChange hook'u ile
 * e-posta bildirimi bağlanacak; kayıt yine burada tutulmaya devam eder.
 */
export const Messages: CollectionConfig = {
  slug: "messages",
  labels: { singular: "Mesaj", plural: "Mesajlar" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "subject", "status", "createdAt"],
    group: "Satış",
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", type: "text", required: true, label: "Ad Soyad" },
        {
          name: "status",
          type: "select",
          defaultValue: "new",
          label: "Durum",
          options: [
            { label: "Yeni", value: "new" },
            { label: "Yanıtlandı", value: "answered" },
            { label: "Kapatıldı", value: "closed" },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "email", type: "email", required: true, label: "E-posta" },
        { name: "phone", type: "text", label: "Telefon" },
      ],
    },
    {
      name: "subject",
      type: "select",
      label: "Konu",
      defaultValue: "general",
      options: [
        { label: "Genel soru", value: "general" },
        { label: "Özel tasarım", value: "custom" },
        { label: "Randevu talebi", value: "appointment" },
        { label: "Sipariş hakkında", value: "order" },
      ],
    },
    { name: "message", type: "textarea", required: true, label: "Mesaj" },
  ],
};

import type { GlobalConfig } from "payload";

export const Settings: GlobalConfig = {
  slug: "settings",
  label: "Site Ayarları",
  admin: { group: "Ayarlar" },
  access: { read: () => true },
  fields: [
    {
      name: "hero",
      type: "array",
      label: "Ana sayfa slider",
      maxRows: 6,
      admin: {
        description:
          "Ana sayfanın en üstündeki tam ekran slider. Sıralamayı sürükleyerek değiştirebilirsiniz. İlk kare en hızlı yüklenen görsel olduğu için en güçlü fotoğrafı oraya koyun. Boş bırakılırsa slider gösterilmez.",
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
          label: "Görsel",
          admin: { description: "Yatay, en az 2000px genişlikte olmalı." },
        },
        { name: "eyebrow", type: "text", label: "Üst etiket", admin: { description: "Örn: “Yeni Koleksiyon”" } },
        { name: "title", type: "text", required: true, label: "Başlık" },
        { name: "subtitle", type: "textarea", label: "Alt metin" },
        {
          type: "row",
          fields: [
            { name: "linkLabel", type: "text", label: "Buton yazısı" },
            { name: "linkHref", type: "text", label: "Bağlantı", admin: { description: "Örn: /kelt" } },
          ],
        },
      ],
    },
    {
      name: "atelier",
      type: "group",
      label: "Atölye bölümü",
      admin: { description: "Ana sayfada üretim sürecini anlatan editoryal bölüm." },
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: false, label: "Göster" },
        { name: "image", type: "upload", relationTo: "media", label: "Görsel" },
        { name: "title", type: "text", label: "Başlık" },
        { name: "text", type: "textarea", label: "Metin" },
        {
          type: "row",
          fields: [
            { name: "linkLabel", type: "text", label: "Buton yazısı" },
            { name: "linkHref", type: "text", label: "Bağlantı" },
          ],
        },
      ],
    },
    {
      name: "contact",
      type: "group",
      label: "İletişim",
      fields: [
        { name: "phone", type: "text", label: "Telefon", defaultValue: "+90 532 517 51 71" },
        { name: "email", type: "email", label: "E-posta", defaultValue: "atolyebiz.tuba@gmail.com" },
        { name: "address", type: "textarea", label: "Atölye adresi" },
        { name: "whatsapp", type: "text", label: "WhatsApp numarası" },
      ],
    },
    {
      name: "social",
      type: "group",
      label: "Sosyal medya",
      fields: [
        { name: "instagram", type: "text", label: "Instagram", defaultValue: "https://www.instagram.com/tubaatman/" },
        { name: "facebook", type: "text", label: "Facebook", defaultValue: "https://tr-tr.facebook.com/TubaAtmanDesignStudio/" },
      ],
    },
    {
      name: "shipping",
      type: "group",
      label: "Kargo",
      fields: [
        {
          name: "flatRate",
          type: "number",
          label: "Kargo ücreti (kuruş)",
          defaultValue: 0,
          admin: { description: "KURUŞ cinsinden. Örn: 150,00 TL için 15000." },
        },
        {
          name: "freeThreshold",
          type: "number",
          label: "Ücretsiz kargo eşiği (kuruş)",
          admin: {
            description:
              "Bu tutarın üzerindeki siparişlerde kargo ücretsiz. Boş bırakılırsa ücretsiz kargo yok.",
          },
        },
      ],
    },
    {
      name: "seller",
      type: "group",
      label: "Satıcı bilgileri (yasal)",
      admin: {
        description:
          "Mesafeli satış mevzuatı gereği sitede yayımlanması zorunlu bilgiler.",
      },
      fields: [
        { name: "legalName", type: "text", label: "Ticari unvan" },
        { name: "address", type: "textarea", label: "Adres" },
        { name: "taxOffice", type: "text", label: "Vergi dairesi" },
        { name: "taxNumber", type: "text", label: "Vergi numarası" },
        { name: "mersis", type: "text", label: "MERSİS numarası" },
      ],
    },
    {
      name: "announcement",
      type: "group",
      label: "Duyuru bandı",
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: false, label: "Göster" },
        { name: "text", type: "text", label: "Metin" },
        { name: "link", type: "text", label: "Bağlantı" },
      ],
    },
  ],
};

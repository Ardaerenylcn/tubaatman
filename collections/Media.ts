import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Görsel", plural: "Görseller" },
  admin: { group: "İçerik" },
  access: {
    read: () => true,
  },
  upload: {
    // Blob adaptörü dosyaları Vercel Blob'a public olarak yükler
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Alternatif metin",
      admin: {
        description:
          "Görselde ne olduğunu yazın. Ekran okuyucular ve Google için gerekli. Örn: “Gümüş Kelt kolye, yakın çekim”.",
      },
    },
    {
      name: "credit",
      type: "text",
      label: "Fotoğraf künyesi",
      admin: { description: "İsteğe bağlı. Fotoğrafçı adı." },
    },
  ],
};

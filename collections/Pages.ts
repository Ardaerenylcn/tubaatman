import type { CollectionConfig } from "payload";

import { slugField } from "@/lib/slug-field";

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Sayfa", plural: "Sayfalar" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug"],
    group: "İçerik",
  },
  access: { read: () => true },
  fields: [
    { name: "title", type: "text", required: true, label: "Başlık" },
    slugField({
      description:
        "Yasal sayfalar mevcut adreslerini korumalı: kvkk, gizlilik, mesafelisatis, teslimatveiade.",
    }),
    { name: "content", type: "richText", label: "İçerik" },
    {
      name: "seo",
      type: "group",
      label: "SEO",
      fields: [
        { name: "metaTitle", type: "text", label: "Sayfa başlığı" },
        { name: "metaDescription", type: "textarea", label: "Açıklama" },
      ],
    },
  ],
};

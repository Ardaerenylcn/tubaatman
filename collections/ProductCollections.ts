import type { CollectionConfig } from "payload";

import { slugField } from "@/lib/slug-field";

/**
 * Takı koleksiyonları (Kelt, Cosmos, Hipnoz …).
 * Payload'ın "collection" kavramıyla karışmaması için dosya adı
 * ProductCollections; slug ve arayüz dili ürün koleksiyonuna ait.
 */
export const ProductCollections: CollectionConfig = {
  slug: "collections",
  labels: { singular: "Koleksiyon", plural: "Koleksiyonlar" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "order"],
    group: "Katalog",
  },
  access: { read: () => true },
  defaultSort: "order",
  fields: [
    { name: "title", type: "text", required: true, label: "Ad" },
    slugField({
      description:
        "Mevcut sitedeki adresle birebir aynı olmalı (kelt, cosmos, yerkure …). Değiştirmek Google sıralamasını kaybettirir.",
    }),
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      label: "Kapak görseli",
    },
    {
      name: "story",
      type: "richText",
      label: "Koleksiyon hikâyesi",
      admin: {
        description:
          "Koleksiyonun arkasındaki hikâye. Ürün sayfalarında da gösterilir.",
      },
    },
    { name: "order", type: "number", defaultValue: 0, label: "Sıra" },
  ],
};

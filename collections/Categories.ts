import type { CollectionConfig } from "payload";

import { slugField } from "@/lib/slug-field";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: { singular: "Kategori", plural: "Kategoriler" },
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
        "Mevcut siteyle aynı kalmalı: kolye, kupe, yuzuk, erkekkolye, erkekyuzuk.",
    }),
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
      label: "Kapak görseli",
    },
    { name: "order", type: "number", defaultValue: 0, label: "Sıra" },
  ],
};

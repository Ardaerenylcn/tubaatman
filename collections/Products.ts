import type { CollectionConfig } from "payload";

import { slugField } from "@/lib/slug-field";

const kurusField = (name: string, label: string) =>
  ({
    name,
    type: "number" as const,
    label,
    min: 0,
    admin: {
      step: 1,
      description:
        "KURUŞ cinsinden tam sayı girin. Örn: 7.900,00 TL için 790000 yazın.",
    },
  });

export const Products: CollectionConfig = {
  slug: "products",
  labels: { singular: "Ürün", plural: "Ürünler" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "collection", "basePrice", "isActive"],
    group: "Katalog",
  },
  access: { read: () => true },
  fields: [
    { name: "title", type: "text", required: true, label: "Ürün adı" },
    slugField({
      description:
        "Adres /urun/<buraya> şeklinde oluşur.",
    }),
    {
      type: "row",
      fields: [
        {
          name: "categories",
          type: "relationship",
          relationTo: "categories",
          hasMany: true,
          label: "Kategoriler",
        },
        {
          name: "collection",
          type: "relationship",
          relationTo: "collections",
          label: "Koleksiyon",
        },
      ],
    },
    {
      name: "images",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      required: true,
      label: "Görseller",
      admin: { description: "İlk görsel liste ve paylaşımlarda kapak olur." },
    },
    { name: "description", type: "richText", label: "Açıklama" },
    {
      type: "row",
      fields: [
        { name: "material", type: "text", label: "Malzeme" },
        { name: "dimensions", type: "text", label: "Ölçüler" },
      ],
    },
    {
      name: "hasVariants",
      type: "checkbox",
      defaultValue: false,
      label: "Bu üründe seçenek var (boy / metal)",
    },
    {
      ...kurusField("basePrice", "Fiyat"),
      required: true,
      admin: {
        ...kurusField("basePrice", "Fiyat").admin,
        condition: (data) => !data?.hasVariants,
      },
    },
    {
      name: "stock",
      type: "number",
      label: "Stok adedi",
      defaultValue: 0,
      min: 0,
      admin: { condition: (data) => !data?.hasVariants },
    },
    {
      name: "variants",
      type: "array",
      label: "Seçenekler",
      admin: { condition: (data) => Boolean(data?.hasVariants) },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "metal",
              type: "select",
              label: "Metal",
              options: [
                { label: "Gümüş", value: "silver" },
                { label: "Altın", value: "gold" },
              ],
            },
            {
              name: "size",
              type: "select",
              label: "Boy",
              options: [
                { label: "Küçük", value: "small" },
                { label: "Orta", value: "medium" },
                { label: "Büyük", value: "large" },
              ],
            },
          ],
        },
        {
          type: "row",
          fields: [
            { ...kurusField("price", "Fiyat"), required: true },
            {
              name: "stock",
              type: "number",
              label: "Stok adedi",
              defaultValue: 0,
              min: 0,
              required: true,
            },
          ],
        },
        { name: "sku", type: "text", label: "Stok kodu" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "isActive",
          type: "checkbox",
          defaultValue: true,
          label: "Satışta",
        },
        {
          name: "isFeatured",
          type: "checkbox",
          defaultValue: false,
          label: "Ana sayfada öne çıkar",
        },
      ],
    },
    {
      name: "seo",
      type: "group",
      label: "SEO",
      fields: [
        { name: "metaTitle", type: "text", label: "Sayfa başlığı" },
        {
          name: "metaDescription",
          type: "textarea",
          label: "Açıklama",
          admin: { description: "Google sonuçlarında görünen metin. ~155 karakter." },
        },
      ],
    },
  ],
};

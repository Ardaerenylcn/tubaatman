import type { Field } from "payload";

import { slugify } from "@/lib/slug";

/**
 * Başlıktan otomatik slug üreten alan.
 * Elle doldurulursa ona dokunulmaz — mevcut URL'leri korumak için şart.
 */
export const slugField = (opts: { description: string }): Field => ({
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  label: "URL adresi",
  admin: {
    description: `${opts.description} Boş bırakırsanız başlıktan otomatik üretilir.`,
    position: "sidebar",
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === "string" && value.trim() !== "") {
          return slugify(value);
        }
        if (typeof data?.title === "string" && data.title.trim() !== "") {
          return slugify(data.title);
        }
        return value;
      },
    ],
  },
});

import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Kullanıcı", plural: "Kullanıcılar" },
  admin: {
    useAsTitle: "email",
    group: "Ayarlar",
  },
  auth: true,
  fields: [
    {
      name: "name",
      type: "text",
      label: "Ad Soyad",
    },
  ],
};

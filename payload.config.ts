import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AnalyticsEvents } from "./collections/AnalyticsEvents";
import { Categories } from "./collections/Categories";
import { Media } from "./collections/Media";
import { Messages } from "./collections/Messages";
import { Orders } from "./collections/Orders";
import { Pages } from "./collections/Pages";
import { ProductCollections } from "./collections/ProductCollections";
import { Products } from "./collections/Products";
import { Users } from "./collections/Users";
import { Settings } from "./globals/Settings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      // Varsayılan yan barın yerine özel navigasyon
      Nav: "@/components/admin/nav/AdminNav#AdminNav",
      views: {
        // Ana sayfa: ziyaretçi analizleri
        dashboard: {
          Component: "@/components/admin/dashboard/Dashboard#default",
        },
      },
    },
    meta: {
      titleSuffix: " — Tuba Atman Yönetim",
    },
  },
  collections: [
    Products,
    ProductCollections,
    Categories,
    Orders,
    Messages,
    Media,
    Pages,
    Users,
    AnalyticsEvents,
  ],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || "" },
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: true,
      collections: {
        // disablePayloadAccessControl: URL'ler doğrudan public Blob CDN'ini
        // gösterir. Aksi halde Payload her görseli kendi Function'ı üzerinden
        // proxy'ler — public store'un CDN avantajı boşa gider, hem yavaş hem
        // pahalı olur. Ürün görselleri zaten herkese açık.
        [Media.slug]: { disablePayloadAccessControl: true },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    }),
  ],
});

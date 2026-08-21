import { getPayloadClient } from "@/lib/payload";

export type NavItem = { title: string; slug: string };

/**
 * Header ve footer için kategori + koleksiyon listesi.
 * Sayfalar ISR ile statik üretildiğinden bu sorgu build/revalidate anında çalışır.
 */
export async function getNavData(): Promise<{
  categories: NavItem[];
  collections: NavItem[];
}> {
  const payload = await getPayloadClient();

  const [categories, collections] = await Promise.all([
    payload.find({
      collection: "categories",
      limit: 100,
      sort: "order",
      select: { title: true, slug: true },
    }),
    payload.find({
      collection: "collections",
      limit: 100,
      sort: "order",
      select: { title: true, slug: true },
    }),
  ]);

  return {
    categories: categories.docs.map((d) => ({ title: d.title, slug: d.slug })),
    collections: collections.docs.map((d) => ({ title: d.title, slug: d.slug })),
  };
}

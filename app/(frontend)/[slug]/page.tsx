import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Where } from "payload";

import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { getPayloadClient } from "@/lib/payload";
import type { Media, Product } from "@/payload-types";

// Vitrin sayfaları statik üretilir, saatte bir tazelenir.
export const revalidate = 3600;

/**
 * Tek segmentli adresler hem kategori (/kolye) hem koleksiyon (/kelt)
 * olabiliyor — mevcut sitedeki URL yapısı böyle ve SEO için korunuyor.
 * Bu yüzden slug önce kategorilerde, sonra koleksiyonlarda aranır.
 */
async function resolveSlug(slug: string) {
  const payload = await getPayloadClient();

  const category = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (category.docs[0]) {
    return { kind: "category" as const, doc: category.docs[0] };
  }

  const collection = await payload.find({
    collection: "collections",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (collection.docs[0]) {
    return { kind: "collection" as const, doc: collection.docs[0] };
  }

  // Yasal ve serbest içerik sayfaları (kvkk, gizlilik, hakkinda …)
  const page = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (page.docs[0]) {
    return { kind: "page" as const, doc: page.docs[0] };
  }

  return null;
}

async function findProducts(kind: "category" | "collection", id: number | string) {
  const payload = await getPayloadClient();
  const where: Where =
    kind === "category"
      ? { categories: { in: [id] }, isActive: { equals: true } }
      : { collection: { equals: id }, isActive: { equals: true } };

  const result = await payload.find({
    collection: "products",
    where,
    limit: 60,
    depth: 1,
  });
  return result.docs as Product[];
}

export async function generateStaticParams() {
  const payload = await getPayloadClient();
  const [categories, collections, pages] = await Promise.all([
    payload.find({ collection: "categories", limit: 100, select: { slug: true } }),
    payload.find({ collection: "collections", limit: 100, select: { slug: true } }),
    payload.find({ collection: "pages", limit: 100, select: { slug: true } }),
  ]);
  return [...categories.docs, ...collections.docs, ...pages.docs].map((d) => ({
    slug: d.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveSlug(slug);
  if (!resolved) return {};
  if (resolved.kind === "page") {
    return {
      title: resolved.doc.seo?.metaTitle || resolved.doc.title,
      description: resolved.doc.seo?.metaDescription ?? undefined,
      alternates: { canonical: `/${slug}` },
    };
  }
  return {
    title: resolved.doc.title,
    alternates: { canonical: `/${slug}` },
  };
}

export default async function SlugPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const resolved = await resolveSlug(slug);
  if (!resolved) notFound();

  // İçerik sayfaları ürün listelemez
  if (resolved.kind === "page") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-heading text-5xl font-light leading-tight">
          {resolved.doc.title}
        </h1>
        {resolved.doc.content ? (
          <div className="prose prose-neutral mt-10 max-w-none">
            <RichText data={resolved.doc.content} />
          </div>
        ) : (
          <p className="mt-10 text-muted-foreground">
            Bu sayfanın içeriği henüz hazırlanmadı.
          </p>
        )}
      </main>
    );
  }

  const products = await findProducts(resolved.kind, resolved.doc.id);
  const story = resolved.kind === "collection" ? resolved.doc.story : null;
  const cover =
    typeof resolved.doc.cover === "object" && resolved.doc.cover !== null
      ? (resolved.doc.cover as Media)
      : null;

  return (
    <main>
      {cover?.url ? (
        // Tam genişlik kapak — başlık görselin üzerinde
        <section className="relative isolate">
          <div className="relative h-[42vh] min-h-[300px] w-full sm:h-[54vh]">
            <Image
              src={cover.url}
              alt={cover.alt ?? resolved.doc.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0">
              <div className="mx-auto max-w-6xl px-6 pb-12">
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">
                  {resolved.kind === "collection" ? "Koleksiyon" : "Ürünler"}
                </p>
                <h1 className="mt-3 font-heading text-4xl font-light leading-tight text-white sm:text-6xl">
                  {resolved.doc.title}
                </h1>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-6xl px-6 py-16">
        {!cover?.url ? (
          <header className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {resolved.kind === "collection" ? "Koleksiyon" : "Ürünler"}
            </p>
            <h1 className="mt-4 font-heading text-5xl font-light leading-tight">
              {resolved.doc.title}
            </h1>
          </header>
        ) : null}

        {story ? (
          <Reveal>
            <div className="prose prose-neutral max-w-2xl text-muted-foreground">
              <RichText data={story} />
            </div>
          </Reveal>
        ) : null}

        {products.length > 0 ? (
          <div className={`grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 ${story || !cover ? "mt-16" : ""}`}>
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 90}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-16 text-muted-foreground">
            Bu {resolved.kind === "collection" ? "koleksiyonda" : "kategoride"}{" "}
            henüz ürün yok.
          </p>
        )}
      </div>
    </main>
  );
}

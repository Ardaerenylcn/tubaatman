import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";

import { ProductCard, displayPriceKurus } from "@/components/site/product-card";
import { ProductDetail } from "@/components/site/product-detail";
import { getPayloadClient } from "@/lib/payload";
import type { Media, Product } from "@/payload-types";

export const revalidate = 3600;

async function getProduct(slug: string): Promise<Product | null> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    where: { slug: { equals: slug }, isActive: { equals: true } },
    limit: 1,
    depth: 2,
  });
  return (docs[0] as Product) ?? null;
}

export async function generateStaticParams() {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "products",
    where: { isActive: { equals: true } },
    limit: 500,
    select: { slug: true },
  });
  return docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const cover = (product.images ?? []).find(
    (m): m is Media => typeof m === "object" && m !== null,
  );

  return {
    title: product.seo?.metaTitle || product.title,
    description: product.seo?.metaDescription ?? undefined,
    alternates: { canonical: `/urun/${slug}` },
    openGraph: {
      title: product.seo?.metaTitle || product.title,
      description: product.seo?.metaDescription ?? undefined,
      type: "website",
      images: cover?.url ? [{ url: cover.url }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/urun/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const payload = await getPayloadClient();
  const collection =
    typeof product.collection === "object" && product.collection !== null
      ? product.collection
      : null;

  const related = collection
    ? await payload.find({
        collection: "products",
        where: {
          collection: { equals: collection.id },
          id: { not_equals: product.id },
          isActive: { equals: true },
        },
        limit: 3,
        depth: 1,
      })
    : null;

  const price = displayPriceKurus(product);
  const cover = (product.images ?? []).find(
    (m): m is Media => typeof m === "object" && m !== null,
  );

  // Google zengin sonuçları için Product yapısal verisi
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.seo?.metaDescription ?? undefined,
    image: cover?.url ? [cover.url] : undefined,
    brand: { "@type": "Brand", name: "Tuba Atman" },
    material: product.material ?? undefined,
    offers:
      price !== null
        ? {
            "@type": "Offer",
            price: (price / 100).toFixed(2),
            priceCurrency: "TRY",
            availability:
              (product.hasVariants
                ? (product.variants ?? []).some((v) => (v.stock ?? 0) > 0)
                : (product.stock ?? 0) > 0)
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          }
        : undefined,
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Konum" className="mb-8 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:underline">
              Ana sayfa
            </Link>
          </li>
          {collection ? (
            <>
              <li aria-hidden>·</li>
              <li>
                <Link href={`/${collection.slug}`} className="hover:underline">
                  {collection.title}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden>·</li>
          <li aria-current="page" className="text-foreground">
            {product.title}
          </li>
        </ol>
      </nav>

      <ProductDetail product={product} />

      {product.description ? (
        <section className="mt-16 max-w-2xl">
          <div className="prose prose-neutral max-w-none">
            <RichText data={product.description} />
          </div>
        </section>
      ) : null}

      {collection?.story ? (
        <section className="mt-16 max-w-2xl border-t border-border pt-10">
          <h2 className="font-heading text-2xl font-light">
            {collection.title} koleksiyonu
          </h2>
          <div className="prose prose-neutral mt-4 max-w-none text-muted-foreground">
            <RichText data={collection.story} />
          </div>
          <Link
            href={`/${collection.slug}`}
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            Koleksiyonun tamamını gör
          </Link>
        </section>
      ) : null}

      {related && related.docs.length > 0 ? (
        <section className="mt-20 border-t border-border pt-12">
          <h2 className="font-heading text-2xl font-light">Benzer parçalar</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
            {(related.docs as Product[]).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

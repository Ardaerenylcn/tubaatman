import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";

import { getPayloadClient } from "@/lib/payload";
import type { Media } from "@/payload-types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Koleksiyon Hikâyeleri",
  description:
    "Her koleksiyonun arkasındaki fikir: Güneş Saatleri, Kelt, Cosmos, Düş Kapanları ve diğerleri.",
  alternates: { canonical: "/koleksiyon-hikayeleri" },
};

export default async function StoriesPage() {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "collections",
    limit: 100,
    sort: "order",
    depth: 1,
  });

  const withStories = docs.filter((c) => c.story);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="max-w-2xl">
        <h1 className="font-heading text-5xl font-light leading-tight">
          Koleksiyon Hikâyeleri
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Bir takı, önce bir fikirdir. Bu sayfada her koleksiyonun nereden
          geldiğini anlatıyoruz.
        </p>
      </header>

      {withStories.length === 0 ? (
        <p className="mt-16 text-muted-foreground">
          Hikâyeler yakında burada olacak.
        </p>
      ) : (
        <div className="mt-16 space-y-24">
          {withStories.map((c) => {
            const cover =
              typeof c.cover === "object" && c.cover !== null
                ? (c.cover as Media)
                : null;
            return (
              <article key={c.id} className="scroll-mt-24" id={c.slug}>
                {cover?.url ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    <Image
                      src={cover.url}
                      alt={cover.alt ?? c.title}
                      fill
                      sizes="(min-width: 1024px) 896px, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <h2 className="mt-8 font-heading text-3xl font-light">
                  {c.title}
                </h2>
                <div className="prose prose-neutral mt-4 max-w-none text-muted-foreground">
                  <RichText data={c.story!} />
                </div>
                <Link
                  href={`/${c.slug}`}
                  className="mt-6 inline-block text-sm underline underline-offset-4"
                >
                  {c.title} koleksiyonunu gör
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";

import { AtelierSection } from "@/components/site/atelier-section";
import { HeroSlider } from "@/components/site/hero-slider";
import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { getPayloadClient } from "@/lib/payload";
import type { Media, Product } from "@/payload-types";

export const revalidate = 3600;

export default async function Home() {
  const payload = await getPayloadClient();

  const [featured, collections, settings] = await Promise.all([
    payload.find({
      collection: "products",
      where: { isFeatured: { equals: true }, isActive: { equals: true } },
      limit: 6,
      depth: 1,
    }),
    payload.find({
      collection: "collections",
      limit: 6,
      sort: "order",
      depth: 1,
    }),
    payload.findGlobal({ slug: "settings", depth: 1 }),
  ]);

  const slides = settings?.hero ?? [];

  return (
    <main>
      {slides.length > 0 ? (
        <HeroSlider slides={slides} />
      ) : (
        // Slider tanımlanmamışsa metin tabanlı açılış
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Tuba Atman Design Studio
          </p>
          <h1 className="mt-6 max-w-3xl font-heading text-5xl font-light leading-[1.08] sm:text-7xl">
            Hikâyesi olan takılar
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Her parça atölyede, elde şekillendirilir.
          </p>
        </section>
      )}

      {slides.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-16 text-center">
          <Reveal>
            <h1 className="mx-auto max-w-2xl font-heading text-3xl font-light leading-tight sm:text-4xl">
              Hikâyesi olan takılar
            </h1>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
              Her parça atölyede, elde şekillendirilir. Gümüş ve altın; bir gök
              cismini, bir deniz kabuğunu ya da bir düşü izler.
            </p>
          </Reveal>
        </section>
      ) : null}

      {featured.docs.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <Reveal>
            <h2 className="font-heading text-3xl font-light">Öne çıkanlar</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
            {(featured.docs as Product[]).map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 90}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <AtelierSection atelier={settings?.atelier} />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <div className="flex items-baseline justify-between gap-6">
            <h2 className="font-heading text-3xl font-light">Koleksiyonlar</h2>
            <Link
              href="/koleksiyonlar"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Tümü
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {collections.docs.map((c, i) => {
            const cover =
              typeof c.cover === "object" && c.cover !== null
                ? (c.cover as Media)
                : null;
            return (
              <Reveal key={c.id} delay={(i % 3) * 90}>
                <Link href={`/${c.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    {cover?.url ? (
                      <Image
                        src={cover.url}
                        alt={cover.alt ?? c.title}
                        fill
                        sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                        className="object-cover transition duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    ) : null}
                  </div>
                  <h3 className="mt-4 font-heading text-2xl font-light">
                    {c.title}
                  </h3>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </main>
  );
}

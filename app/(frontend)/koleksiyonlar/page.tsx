import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getPayloadClient } from "@/lib/payload";
import type { Media } from "@/payload-types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Koleksiyonlar",
  description:
    "Güneş Saatleri'nden Cosmos'a, her biri kendi hikâyesini taşıyan takı koleksiyonları.",
  alternates: { canonical: "/koleksiyonlar" },
};

export default async function CollectionsPage() {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "collections",
    limit: 100,
    sort: "order",
    depth: 1,
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="max-w-2xl">
        <h1 className="font-heading text-5xl font-light leading-tight">
          Koleksiyonlar
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Her koleksiyon bir fikirden doğar. Kimi bir gök cismini, kimi bir deniz
          kabuğunu izler.
        </p>
      </header>

      <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((c) => {
          const cover =
            typeof c.cover === "object" && c.cover !== null
              ? (c.cover as Media)
              : null;
          return (
            <Link key={c.id} href={`/${c.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                {cover?.url ? (
                  <Image
                    src={cover.url}
                    alt={cover.alt ?? c.title}
                    fill
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                ) : null}
              </div>
              <h2 className="mt-4 font-heading text-2xl font-light">{c.title}</h2>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

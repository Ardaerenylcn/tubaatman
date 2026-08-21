import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/site/reveal";
import type { Media, Setting } from "@/payload-types";

export function AtelierSection({ atelier }: { atelier: Setting["atelier"] }) {
  if (!atelier?.enabled || !atelier.title) return null;

  const image =
    typeof atelier.image === "object" && atelier.image !== null
      ? (atelier.image as Media)
      : null;

  return (
    <section className="border-y border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-20">
        {image?.url ? (
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <Image
                src={image.url}
                alt={image.alt ?? atelier.title}
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        ) : null}

        <Reveal delay={120}>
          <h2 className="font-heading text-4xl font-light leading-tight">
            {atelier.title}
          </h2>
          {atelier.text ? (
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
              {atelier.text}
            </p>
          ) : null}
          {atelier.linkHref && atelier.linkLabel ? (
            <Link
              href={atelier.linkHref}
              className="mt-8 inline-block border-b border-foreground/40 pb-1 text-sm transition hover:border-foreground"
            >
              {atelier.linkLabel}
            </Link>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}

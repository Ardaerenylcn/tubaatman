"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Media, Setting } from "@/payload-types";

type Slide = NonNullable<Setting["hero"]>[number];

const AUTOPLAY_MS = 6500;

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  const count = slides.length;

  // Hareket tercihi: kullanıcı azaltılmış hareket istiyorsa otomatik geçiş olmaz.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count <= 1 || paused || reducedMotion) return;
    const t = window.setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearInterval(t);
  }, [index, count, paused, reducedMotion, go]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    }
  };

  if (count === 0) return null;

  return (
    <section
      ref={regionRef}
      aria-roledescription="karusel"
      aria-label="Öne çıkan koleksiyonlar"
      className="relative isolate overflow-hidden bg-muted"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        if (start === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(delta) > 48) go(index + (delta < 0 ? 1 : -1));
        touchStartX.current = null;
      }}
    >
      <div className="relative h-[62vh] min-h-[420px] w-full sm:h-[76vh]">
        {slides.map((slide, i) => {
          const img =
            typeof slide.image === "object" && slide.image !== null
              ? (slide.image as Media)
              : null;
          const active = i === index;
          return (
            <div
              key={slide.id ?? i}
              aria-hidden={!active}
              inert={!active || undefined}
              className={`absolute inset-0 transition-opacity duration-[900ms] ease-out motion-reduce:transition-none ${
                active ? "opacity-100" : "opacity-0"
              }`}
            >
              {img?.url ? (
                <Image
                  src={img.url}
                  alt={img.alt ?? slide.title}
                  fill
                  // İlk kare LCP görselidir: öncelikli yüklenir, diğerleri tembel.
                  priority={i === 0}
                  loading={i === 0 ? undefined : "lazy"}
                  sizes="100vw"
                  className="object-cover"
                />
              ) : null}

              {/* Metin okunabilirliği için alttan yukarı koyulaşan katman */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

              <div className="absolute inset-x-0 bottom-0">
                <div className="mx-auto max-w-6xl px-6 pb-16 sm:pb-24">
                  {slide.eyebrow ? (
                    <p className="text-xs uppercase tracking-[0.22em] text-white/80">
                      {slide.eyebrow}
                    </p>
                  ) : null}
                  <h2 className="mt-4 max-w-2xl font-heading text-4xl font-light leading-[1.08] text-white sm:text-6xl">
                    {slide.title}
                  </h2>
                  {slide.subtitle ? (
                    <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85">
                      {slide.subtitle}
                    </p>
                  ) : null}
                  {slide.linkHref && slide.linkLabel ? (
                    <Link
                      href={slide.linkHref}
                      tabIndex={active ? 0 : -1}
                      className="mt-8 inline-block border-b border-white/60 pb-1 text-sm text-white transition hover:border-white"
                    >
                      {slide.linkLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/30 sm:block"
          >
            <ChevronLeft className="size-5" />
            <span className="sr-only">Önceki</span>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/30 sm:block"
          >
            <ChevronRight className="size-5" />
            <span className="sr-only">Sonraki</span>
          </button>

          <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2.5">
            {slides.map((s, i) => (
              <button
                key={s.id ?? i}
                type="button"
                onClick={() => go(i)}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              >
                <span className="sr-only">{i + 1}. kare: {s.title}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {/* Ekran okuyucular için kare değişimi bildirimi */}
      <p aria-live="polite" className="sr-only">
        {index + 1} / {count}: {slides[index]?.title}
      </p>
    </section>
  );
}

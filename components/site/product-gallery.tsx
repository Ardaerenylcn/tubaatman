"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import type { Media } from "@/payload-types";

/**
 * Ürün galerisi.
 * - Mobil: parmakla kaydırma (native scroll-snap — akıcı ve JS'siz)
 * - Masaüstü: imleçle üzerine gelince büyüteç (transform-origin ile)
 */
export function ProductGallery({
  images,
  title,
}: {
  images: Media[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[i] as HTMLElement | undefined;
    if (child) track.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    setIndex(i);
  }, []);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== index) setIndex(i);
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  if (images.length === 0) {
    return <div className="aspect-[4/5] w-full bg-muted" />;
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden bg-muted lg:cursor-zoom-in"
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              onMouseMove={onMove}
            >
              {img.url ? (
                <Image
                  src={img.url}
                  alt={img.alt ?? `${title} — görsel ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  style={
                    zoom && i === index
                      ? { transformOrigin: origin }
                      : undefined
                  }
                  className={`object-cover transition-transform duration-300 motion-reduce:transition-none lg:duration-500 ${
                    zoom && i === index ? "lg:scale-[1.9]" : "scale-100"
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => scrollTo(Math.max(0, index - 1))}
              disabled={index === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur transition hover:bg-background disabled:opacity-0"
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Önceki görsel</span>
            </button>
            <button
              type="button"
              onClick={() => scrollTo(Math.min(images.length - 1, index + 1))}
              disabled={index === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur transition hover:bg-background disabled:opacity-0"
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Sonraki görsel</span>
            </button>

            {/* Mobilde nokta göstergesi */}
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden">
              {images.map((img, i) => (
                <span
                  key={img.id}
                  aria-hidden
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-foreground" : "w-1.5 bg-foreground/35"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="mt-4 hidden grid-cols-5 gap-3 lg:grid">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => scrollTo(i)}
                aria-current={i === index}
                className={`relative block aspect-square w-full overflow-hidden bg-muted transition ${
                  i === index ? "ring-1 ring-foreground ring-offset-2" : "opacity-70 hover:opacity-100"
                }`}
              >
                {img.url ? (
                  <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
                ) : null}
                <span className="sr-only">Görsel {i + 1}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 hidden text-xs text-muted-foreground lg:block">
        Yakınlaştırmak için görselin üzerine gelin.
      </p>
    </div>
  );
}

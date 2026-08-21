import Link from "next/link";

import { CartButton } from "@/components/site/cart-drawer";
import { MobileNav } from "@/components/site/mobile-nav";
import { getNavData } from "@/lib/nav";
import { getPayloadClient } from "@/lib/payload";

export async function SiteHeader() {
  const [{ categories, collections }, payload] = await Promise.all([
    getNavData(),
    getPayloadClient(),
  ]);
  const settings = await payload.findGlobal({ slug: "settings" });
  const announcement = settings?.announcement;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      {announcement?.enabled && announcement.text ? (
        <div className="bg-foreground text-background">
          <div className="mx-auto max-w-6xl px-6 py-2 text-center text-xs tracking-wide">
            {announcement.link ? (
              <Link href={announcement.link} className="underline-offset-4 hover:underline">
                {announcement.text}
              </Link>
            ) : (
              announcement.text
            )}
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <MobileNav categories={categories} collections={collections} />

        <Link
          href="/"
          className="font-heading text-2xl font-light tracking-[0.08em]"
        >
          Tuba Atman
        </Link>

        <nav className="ml-auto hidden items-center gap-8 text-sm lg:flex">
          <div className="group relative">
            <button className="py-2" type="button">
              Ürünler
            </button>
            <div className="invisible absolute left-1/2 top-full w-56 -translate-x-1/2 rounded-md border border-border bg-background p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <ul>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/${c.slug}`}
                      className="block rounded px-3 py-2 hover:bg-muted"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="group relative">
            <button className="py-2" type="button">
              Koleksiyonlar
            </button>
            <div className="invisible absolute left-1/2 top-full w-[34rem] -translate-x-1/2 rounded-md border border-border bg-background p-3 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <ul className="grid grid-cols-2 gap-x-2">
                {collections.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/${c.slug}`}
                      className="block rounded px-3 py-2 hover:bg-muted"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link href="/hakkinda" className="py-2">
            Hakkımızda
          </Link>
          <Link href="/iletisim" className="py-2">
            İletişim
          </Link>
        </nav>

        <div className="ml-auto lg:ml-4">
          <CartButton />
        </div>
      </div>
    </header>
  );
}

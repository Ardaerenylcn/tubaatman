import Link from "next/link";

import { getNavData } from "@/lib/nav";
import { getPayloadClient } from "@/lib/payload";

const LEGAL = [
  { title: "KVKK Aydınlatma Metni", slug: "kvkk" },
  { title: "Gizlilik Politikası", slug: "gizlilik" },
  { title: "Mesafeli Satış Sözleşmesi", slug: "mesafelisatis" },
  { title: "Teslimat ve İade Şartları", slug: "teslimatveiade" },
];

export async function SiteFooter() {
  const [{ categories, collections }, payload] = await Promise.all([
    getNavData(),
    getPayloadClient(),
  ]);
  const settings = await payload.findGlobal({ slug: "settings" });

  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-2xl font-light tracking-wide">
            Tuba Atman
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Hikâyesi olan, elde üretilen takılar.
          </p>
        </div>

        <nav aria-labelledby="footer-urunler">
          <h2
            id="footer-urunler"
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            Ürünler
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-koleksiyonlar">
          <h2
            id="footer-koleksiyonlar"
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            Koleksiyonlar
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {collections.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/koleksiyonlar"
                className="text-muted-foreground hover:underline"
              >
                Tümünü gör →
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            İletişim
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {settings?.contact?.phone && (
              <li>
                <a
                  href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}
                  className="hover:underline"
                >
                  {settings.contact.phone}
                </a>
              </li>
            )}
            {settings?.contact?.email && (
              <li>
                <a
                  href={`mailto:${settings.contact.email}`}
                  className="hover:underline"
                >
                  {settings.contact.email}
                </a>
              </li>
            )}
            {settings?.social?.instagram && (
              <li>
                <a
                  href={settings.social.instagram}
                  className="hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL.map((l) => (
              <li key={l.slug}>
                <Link href={`/${l.slug}`} className="hover:underline">
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
          <p>© {new Date().getFullYear()} Tuba Atman Design Studio</p>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";

import { ContactForm } from "@/components/site/contact-form";
import { getPayloadClient } from "@/lib/payload";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Özel tasarım, randevu ve sorularınız için Tuba Atman Design Studio ile iletişime geçin.",
  alternates: { canonical: "/iletisim" },
};

export default async function ContactPage() {
  const payload = await getPayloadClient();
  const settings = await payload.findGlobal({ slug: "settings" });
  const contact = settings?.contact;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: "Tuba Atman Design Studio",
    telephone: contact?.phone ?? undefined,
    email: contact?.email ?? undefined,
    address: contact?.address ?? undefined,
    sameAs: [settings?.social?.instagram, settings?.social?.facebook].filter(
      Boolean,
    ),
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-2xl">
        <h1 className="font-heading text-5xl font-light leading-tight">
          İletişim
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Özel bir tasarım, bir soru ya da atölyede randevu için yazın. Genelde
          aynı gün içinde dönüş yapıyoruz.
        </p>
      </header>

      <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_320px]">
        <ContactForm />

        <aside className="space-y-8 lg:border-l lg:border-border lg:pl-10">
          <div>
            <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Doğrudan
            </h2>
            <ul className="mt-4 space-y-2">
              {contact?.phone ? (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="hover:underline"
                  >
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact?.email ? (
                <li>
                  <a href={`mailto:${contact.email}`} className="hover:underline">
                    {contact.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          {contact?.address ? (
            <div>
              <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Atölye
              </h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed">
                {contact.address}
              </p>
            </div>
          ) : null}

          <div>
            <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Sosyal
            </h2>
            <ul className="mt-4 space-y-2">
              {settings?.social?.instagram ? (
                <li>
                  <a
                    href={settings.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Instagram
                  </a>
                </li>
              ) : null}
              {settings?.social?.facebook ? (
                <li>
                  <a
                    href={settings.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Facebook
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavItem } from "@/lib/nav";

export function MobileNav({
  categories,
  collections,
}: {
  categories: NavItem[];
  collections: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Menüyü aç</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl font-light">
            Tuba Atman
          </SheetTitle>
        </SheetHeader>

        <nav className="px-4 pb-10">
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Ürünler
          </p>
          <ul className="mt-3 space-y-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${c.slug}`}
                  onClick={close}
                  className="block py-2 text-base"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Koleksiyonlar
          </p>
          <ul className="mt-3 space-y-1">
            {collections.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${c.slug}`}
                  onClick={close}
                  className="block py-2 text-base"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-8 space-y-1 border-t border-border pt-6">
            <li>
              <Link href="/hakkinda" onClick={close} className="block py-2">
                Hakkımızda
              </Link>
            </li>
            <li>
              <Link href="/iletisim" onClick={close} className="block py-2">
                İletişim
              </Link>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

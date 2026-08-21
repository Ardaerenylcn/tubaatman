"use client";

import { useActionState } from "react";

import { submitContact, type ContactResult } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";

const FIELD =
  "mt-2 w-full rounded-none border-0 border-b border-border bg-transparent px-0 py-2 text-base outline-none focus:border-foreground";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactResult | null, FormData>(
    submitContact,
    null,
  );

  if (state?.ok) {
    return (
      <div className="rounded-md border border-border bg-muted p-6">
        <p className="font-heading text-2xl font-light">Mesajınız ulaştı.</p>
        <p className="mt-2 text-muted-foreground">
          En kısa sürede size dönüş yapacağız. Acil durumlar için telefonla
          ulaşabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {/* Bot tuzağı — ekran okuyuculardan ve kullanıcıdan gizli */}
      <div aria-hidden className="hidden">
        <label>
          Web sitesi
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="name" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Ad Soyad
        </label>
        <input id="name" name="name" required maxLength={120} className={FIELD} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            E-posta
          </label>
          <input id="email" name="email" type="email" required maxLength={200} className={FIELD} />
        </div>
        <div>
          <label htmlFor="phone" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Telefon <span className="normal-case tracking-normal">(isteğe bağlı)</span>
          </label>
          <input id="phone" name="phone" type="tel" maxLength={40} className={FIELD} />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Konu
        </label>
        <select id="subject" name="subject" defaultValue="general" className={FIELD}>
          <option value="general">Genel soru</option>
          <option value="custom">Özel tasarım</option>
          <option value="appointment">Randevu talebi</option>
          <option value="order">Sipariş hakkında</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Mesajınız
        </label>
        <textarea id="message" name="message" required rows={6} maxLength={4000} className={FIELD} />
      </div>

      {state && !state.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Gönderiliyor…" : "Gönder"}
      </Button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  addOrderNote,
  addOrderTag,
  removeOrderTag,
  setOrderStatus,
  setTrackingNumber,
} from "@/app/actions/order-admin";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "İşlem başarısız.");
      else router.refresh();
    });
  };
  return { run, pending, error };
}

/** Durum değiştirme menüsü — "Diğer Eylemler". */
export function StatusMenu({
  orderId,
  current,
}: {
  orderId: number;
  current: string;
}) {
  const { run, pending, error } = useAction();
  const [open, setOpen] = useState(false);

  const OPTIONS: [string, string][] = [
    ["paid", "Ödendi olarak işaretle"],
    ["preparing", "Hazırlanıyor olarak işaretle"],
    ["shipped", "Kargoya verildi olarak işaretle"],
    ["delivered", "Karşılandı olarak işaretle"],
    ["cancelled", "Siparişi iptal et"],
    ["refunded", "İade edildi olarak işaretle"],
  ];

  return (
    <div className="taod__menu">
      <button
        type="button"
        className="taod__btn taod__btn--outline"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
      >
        Diğer Eylemler <span aria-hidden>▾</span>
      </button>
      {open ? (
        <ul className="taod__menu-list">
          {OPTIONS.filter(([v]) => v !== current).map(([value, label]) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  run(() => setOrderStatus(orderId, value));
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="taod__error">{error}</p> : null}
    </div>
  );
}

/** Takip numarası ekleme. */
export function TrackingButton({
  orderId,
  carrier,
  trackingNumber,
}: {
  orderId: number;
  carrier: string | null;
  trackingNumber: string | null;
}) {
  const { run, pending, error } = useAction();
  const [open, setOpen] = useState(false);
  const [c, setC] = useState(carrier ?? "");
  const [t, setT] = useState(trackingNumber ?? "");

  if (trackingNumber && !open) {
    return (
      <div className="taod__tracking">
        <span className="taod__tracking-no">
          {carrier ? `${carrier} · ` : ""}
          {trackingNumber}
        </span>
        <button type="button" className="taod__link" onClick={() => setOpen(true)}>
          Düzenle
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="taod__btn taod__btn--primary"
        onClick={() => setOpen(true)}
      >
        Takip Numarası Ekle
      </button>
    );
  }

  return (
    <form
      className="taod__tracking-form"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const r = await setTrackingNumber(orderId, c, t);
          if (r.ok) setOpen(false);
          return r;
        });
      }}
    >
      <input
        value={c}
        onChange={(e) => setC(e.target.value)}
        placeholder="Kargo firması"
        aria-label="Kargo firması"
      />
      <input
        value={t}
        onChange={(e) => setT(e.target.value)}
        placeholder="Takip numarası"
        aria-label="Takip numarası"
        required
      />
      <button type="submit" className="taod__btn taod__btn--primary" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
      <button type="button" className="taod__link" onClick={() => setOpen(false)}>
        Vazgeç
      </button>
      {error ? <p className="taod__error">{error}</p> : null}
    </form>
  );
}

/** Zaman çizelgesine not ekleme. */
export function NoteBox({ orderId }: { orderId: number }) {
  const { run, pending, error } = useAction();
  const [text, setText] = useState("");

  return (
    <form
      className="taod__note"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const r = await addOrderNote(orderId, text);
          if (r.ok) setText("");
          return r;
        });
      }}
    >
      <label htmlFor="order-note" className="taod__note-label">
        Bir not ekleyin <span>(Müşterileriniz bunu görmez)</span>
      </label>
      <textarea
        id="order-note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={2000}
      />
      {text.trim().length >= 2 ? (
        <button type="submit" className="taod__btn taod__btn--primary" disabled={pending}>
          {pending ? "Ekleniyor…" : "Notu ekle"}
        </button>
      ) : null}
      {error ? <p className="taod__error">{error}</p> : null}
    </form>
  );
}

/** Etiket atama ve kaldırma. */
export function TagEditor({
  orderId,
  tags,
}: {
  orderId: number;
  tags: string[];
}) {
  const { run, pending, error } = useAction();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  return (
    <div className="taod__tags">
      {tags.length > 0 ? (
        <ul className="taod__taglist">
          {tags.map((t) => (
            <li key={t}>
              <span>{t}</span>
              <button
                type="button"
                aria-label={`${t} etiketini kaldır`}
                onClick={() => run(() => removeOrderTag(orderId, t))}
                disabled={pending}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <form
          className="taod__tagform"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await addOrderTag(orderId, label);
              if (r.ok) { setLabel(""); setOpen(false); }
              return r;
            });
          }}
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Etiket adı"
            aria-label="Etiket adı"
            maxLength={40}
            autoFocus
          />
          <button type="submit" className="taod__btn taod__btn--primary" disabled={pending}>
            Ekle
          </button>
          <button type="button" className="taod__link" onClick={() => setOpen(false)}>
            Vazgeç
          </button>
        </form>
      ) : (
        <button type="button" className="taod__assign" onClick={() => setOpen(true)}>
          <span aria-hidden>+</span> Etiket Ata
        </button>
      )}
      {error ? <p className="taod__error">{error}</p> : null}
    </div>
  );
}

/** Adresi panoya kopyalar. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="taod__copy"
      aria-label={label}
      title={done ? "Kopyalandı" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* pano izni yoksa sessizce geç */
        }
      }}
    >
      {done ? "✓" : "⧉"}
    </button>
  );
}

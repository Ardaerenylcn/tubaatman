"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const SESSION_KEY = "tubaatman.sid";
const ENTRY_KEY = "tubaatman.entered";

/**
 * Sayfa görüntülemelerini ve sayfada geçirilen süreyi kaydeder.
 *
 * Çerez kullanmaz: oturum kimliği sekme ömrü boyunca `sessionStorage`'da
 * tutulur, sekme kapanınca kaybolur. Sunucuya IP gönderilmez; sunucu zaten
 * isteğin kendisinden okuduğu IP'yi yalnızca hash girdisi olarak kullanır.
 *
 * Ayrılış olayı `sendBeacon` ile gönderilir — sayfa kapanırken normal fetch
 * iptal edilebilir, beacon edilmez.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const eventIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const activeMsRef = useRef<number>(0);
  const lastResumeRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let sessionId: string;
    try {
      sessionId = window.sessionStorage.getItem(SESSION_KEY) ?? crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, sessionId);
    } catch {
      sessionId = crypto.randomUUID();
    }

    let isEntry = false;
    try {
      isEntry = window.sessionStorage.getItem(ENTRY_KEY) === null;
      if (isEntry) window.sessionStorage.setItem(ENTRY_KEY, "1");
    } catch {
      /* gizli mod */
    }

    const eventId = crypto.randomUUID();
    eventIdRef.current = eventId;
    startedAtRef.current = Date.now();
    activeMsRef.current = 0;
    lastResumeRef.current = Date.now();

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        type: "view",
        eventId,
        sessionId,
        path: pathname,
        title: document.title,
        referrer: document.referrer || null,
        isEntry,
      }),
    }).catch(() => {
      /* analitik hiçbir zaman sayfayı bozmaz */
    });

    // Sekme arka plandayken geçen süre sayılmaz — "sayfada geçirilen süre"
    // gerçekten bakılan süre olmalı.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        activeMsRef.current += Date.now() - lastResumeRef.current;
      } else {
        lastResumeRef.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const sendLeave = () => {
      const id = eventIdRef.current;
      if (!id) return;
      let total = activeMsRef.current;
      if (document.visibilityState !== "hidden") {
        total += Date.now() - lastResumeRef.current;
      }
      if (total < 500) return; // anlık sekmeler kaydedilmez
      const payload = JSON.stringify({ type: "leave", eventId: id, durationMs: total });
      try {
        navigator.sendBeacon(
          "/api/track",
          new Blob([payload], { type: "application/json" }),
        );
      } catch {
        /* yoksay */
      }
      eventIdRef.current = null;
    };

    window.addEventListener("pagehide", sendLeave);

    return () => {
      sendLeave();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", sendLeave);
    };
  }, [pathname]);

  return null;
}

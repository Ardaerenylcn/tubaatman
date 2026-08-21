"use server";

import { getPayloadClient } from "@/lib/payload";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

const SUBJECTS = ["general", "custom", "appointment", "order"] as const;
const MAX = { name: 120, email: 200, phone: 40, message: 4000 };

/** Basit e-posta biçim kontrolü. Kesin doğrulama yanıt denemesiyle yapılır. */
const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export async function submitContact(
  _prev: ContactResult | null,
  formData: FormData,
): Promise<ContactResult> {
  // Bot tuzağı: gerçek kullanıcı bu gizli alanı doldurmaz.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { ok: true };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const subjectRaw = String(formData.get("subject") ?? "general");
  const subject = (SUBJECTS as readonly string[]).includes(subjectRaw)
    ? (subjectRaw as (typeof SUBJECTS)[number])
    : "general";

  if (name.length < 2 || name.length > MAX.name) {
    return { ok: false, error: "Lütfen adınızı yazın.", field: "name" };
  }
  if (!looksLikeEmail(email) || email.length > MAX.email) {
    return { ok: false, error: "Geçerli bir e-posta adresi yazın.", field: "email" };
  }
  if (phone.length > MAX.phone) {
    return { ok: false, error: "Telefon numarası çok uzun.", field: "phone" };
  }
  if (message.length < 10) {
    return {
      ok: false,
      error: "Mesajınız çok kısa. Biraz daha ayrıntı verir misiniz?",
      field: "message",
    };
  }
  if (message.length > MAX.message) {
    return { ok: false, error: "Mesajınız çok uzun.", field: "message" };
  }

  try {
    const payload = await getPayloadClient();
    await payload.create({
      collection: "messages",
      data: { name, email, phone: phone || undefined, subject, message, status: "new" },
    });
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "Mesaj gönderilemedi. Lütfen telefon veya e-posta ile doğrudan ulaşın.",
    };
  }
}

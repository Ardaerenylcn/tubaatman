"use server";

import { revalidatePath } from "next/cache";
import { headers as nextHeaders } from "next/headers";

import { getPayloadClient } from "@/lib/payload";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Yönetim eylemleri.
 *
 * Her biri önce oturumu doğrular — bu server action'lar tarayıcıdan
 * doğrudan çağrılabilir, yani kimlik denetimi burada yapılmak zorunda.
 * Payload'ın erişim denetimini `overrideAccess: false` ile devrede
 * tutuyoruz; giriş yapmamış biri sipariş değiştiremez.
 */
async function requireUser() {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user) throw new Error("Bu işlem için giriş yapmanız gerekiyor.");
  return { payload, user };
}

export async function addOrderNote(
  orderId: number,
  note: string,
): Promise<ActionResult> {
  const text = note.trim();
  if (text.length < 2) return { ok: false, error: "Not çok kısa." };
  if (text.length > 2000) return { ok: false, error: "Not çok uzun." };

  try {
    const { payload, user } = await requireUser();
    const order = await payload.findByID({ collection: "orders", id: orderId });
    await payload.update({
      collection: "orders",
      id: orderId,
      overrideAccess: false,
      user,
      data: {
        timeline: [
          ...(order.timeline ?? []),
          {
            kind: "note",
            at: new Date().toISOString(),
            message: text,
            author: user.email,
          },
        ],
      },
    });
    revalidatePath(`/admin/collections/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setTrackingNumber(
  orderId: number,
  carrier: string,
  trackingNumber: string,
): Promise<ActionResult> {
  const t = trackingNumber.trim();
  if (t.length < 4) return { ok: false, error: "Takip numarası çok kısa." };

  try {
    const { payload, user } = await requireUser();
    const order = await payload.findByID({ collection: "orders", id: orderId });
    await payload.update({
      collection: "orders",
      id: orderId,
      overrideAccess: false,
      user,
      data: {
        shipping: {
          ...(order.shipping ?? {}),
          carrier: carrier.trim() || order.shipping?.carrier,
          trackingNumber: t,
          shippedAt: order.shipping?.shippedAt ?? new Date().toISOString(),
        },
        // Kargoya verildi bilgisi durumu da ilerletir
        status: ["paid", "preparing"].includes(order.status ?? "")
          ? "shipped"
          : order.status,
      },
    });
    revalidatePath(`/admin/collections/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const ALLOWED_STATUS = [
  "pending", "paid", "preparing", "shipped",
  "delivered", "cancelled", "refunded", "failed",
];

export async function setOrderStatus(
  orderId: number,
  status: string,
): Promise<ActionResult> {
  if (!ALLOWED_STATUS.includes(status)) {
    return { ok: false, error: "Geçersiz durum." };
  }
  try {
    const { payload, user } = await requireUser();
    await payload.update({
      collection: "orders",
      id: orderId,
      overrideAccess: false,
      user,
      data: { status: status as never },
    });
    revalidatePath(`/admin/collections/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function addOrderTag(
  orderId: number,
  label: string,
): Promise<ActionResult> {
  const t = label.trim();
  if (!t) return { ok: false, error: "Etiket boş olamaz." };
  if (t.length > 40) return { ok: false, error: "Etiket çok uzun." };

  try {
    const { payload, user } = await requireUser();
    const order = await payload.findByID({ collection: "orders", id: orderId });
    const existing = order.tags ?? [];
    if (existing.some((x) => x.label?.toLowerCase() === t.toLowerCase())) {
      return { ok: true };
    }
    await payload.update({
      collection: "orders",
      id: orderId,
      overrideAccess: false,
      user,
      data: { tags: [...existing, { label: t }] },
    });
    revalidatePath(`/admin/collections/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeOrderTag(
  orderId: number,
  label: string,
): Promise<ActionResult> {
  try {
    const { payload, user } = await requireUser();
    const order = await payload.findByID({ collection: "orders", id: orderId });
    await payload.update({
      collection: "orders",
      id: orderId,
      overrideAccess: false,
      user,
      data: { tags: (order.tags ?? []).filter((x) => x.label !== label) },
    });
    revalidatePath(`/admin/collections/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

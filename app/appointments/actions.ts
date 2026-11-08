"use server";

import { requireOwner } from "@/lib/owner";
import { computeIsLocked } from "@/lib/plan-limits";
import { normalizeTrPhone, phoneLookupVariants, PHONE_ERROR } from "@/lib/validations";
import { isValidDateString, isValidTimeString, istanbulToUtc } from "@/lib/time";
import {
  newCancelToken,
  sendAppointmentCancellation,
  sendAppointmentConfirmation,
} from "@/lib/appointment-messages";

type ActionResult = { success: true; notified: boolean } | { success: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Bekleyen randevuyu onaylar ve müşteriye WhatsApp onay şablonunu gönderir.
 * `_shopId` geriye dönük uyumluluk için duruyor; dükkan her zaman oturumdan okunur.
 */
export async function confirmAppointmentAndNotify(appointmentId: string, _shopId?: string): Promise<ActionResult> {
  if (!UUID_RE.test(appointmentId)) return { success: false, error: "Geçersiz randevu." };

  const auth = await requireOwner({ requireActive: true });
  if ("error" in auth) return { success: false, error: auth.error as string };
  const { supabase, shop } = auth.ctx;

  const { data: apt } = await supabase
    .from("appointments")
    .select("id, status, scheduled_at, cancel_token, customer:customers(name, phone)")
    .eq("id", appointmentId)
    .eq("shop_id", shop.id)
    .single();

  if (!apt) return { success: false, error: "Randevu bulunamadı." };
  if (apt.status !== "pending") return { success: false, error: "Yalnızca onay bekleyen randevular onaylanabilir." };

  const cancelToken = apt.cancel_token || newCancelToken();

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "confirmed", cancel_token: cancelToken })
    .eq("id", apt.id)
    .eq("shop_id", shop.id);

  if (updateError) {
    console.error("Randevu onaylanamadı:", updateError);
    return { success: false, error: "Randevu güncellenemedi." };
  }

  const customer = Array.isArray(apt.customer) ? apt.customer[0] : apt.customer;
  if (!customer?.phone || new Date(apt.scheduled_at) <= new Date()) {
    return { success: true, notified: false };
  }

  const result = await sendAppointmentConfirmation({
    phone: customer.phone,
    customerName: customer.name,
    scheduledAt: apt.scheduled_at,
    shopName: shop.name,
    cancelToken,
  });
  if (!result.success) console.error("WhatsApp onay bildirimi gönderilemedi:", result.error);

  return { success: true, notified: result.success };
}

/** İşletme randevuyu iptal eder; ileri tarihli randevularda müşteriye WhatsApp iptal şablonu gider. */
export async function cancelAppointmentByOwner(appointmentId: string): Promise<ActionResult> {
  if (!UUID_RE.test(appointmentId)) return { success: false, error: "Geçersiz randevu." };

  const auth = await requireOwner();
  if ("error" in auth) return { success: false, error: auth.error as string };
  const { supabase, shop } = auth.ctx;

  const { data: apt } = await supabase
    .from("appointments")
    .select("id, status, scheduled_at, customer:customers(name, phone), service:services(name)")
    .eq("id", appointmentId)
    .eq("shop_id", shop.id)
    .single();

  if (!apt) return { success: false, error: "Randevu bulunamadı." };
  if (apt.status === "cancelled") return { success: false, error: "Bu randevu zaten iptal edilmiş." };

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", apt.id)
    .eq("shop_id", shop.id);

  if (error) {
    console.error("Randevu iptal edilemedi:", error);
    return { success: false, error: "Randevu iptal edilemedi." };
  }

  const customer = Array.isArray(apt.customer) ? apt.customer[0] : apt.customer;
  const service = Array.isArray(apt.service) ? apt.service[0] : apt.service;
  const isUpcoming = new Date(apt.scheduled_at) > new Date();
  const wasActive = apt.status === "pending" || apt.status === "confirmed";

  // Abonelik bitmişse ücretli WhatsApp mesajı gönderilmez, iptal yine de yapılır.
  const canNotify = !computeIsLocked(shop);

  if (!customer?.phone || !isUpcoming || !wasActive || !canNotify) {
    return { success: true, notified: false };
  }

  const result = await sendAppointmentCancellation({
    phone: customer.phone,
    customerName: customer.name,
    scheduledAt: apt.scheduled_at,
    serviceName: service?.name,
    shopName: shop.name,
  });
  if (!result.success) console.error("WhatsApp iptal bildirimi gönderilemedi:", result.error);

  return { success: true, notified: result.success };
}

/** Panelden manuel randevu ekleme (telefonla/yüz yüze alınan randevular). */
export async function createAppointmentByOwner(input: {
  customerName: string;
  customerPhone: string;
  serviceId: string;
  staffId?: string | null;
  date: string;
  time: string;
  notify: boolean;
}): Promise<ActionResult> {
  const auth = await requireOwner({ requireActive: true });
  if ("error" in auth) return { success: false, error: auth.error as string };
  const { supabase, shop } = auth.ctx;

  const customerName = (input.customerName || "").trim();
  if (customerName.length < 2 || customerName.length > 80) return { success: false, error: "Müşteri adı 2-80 karakter olmalıdır." };

  const phone = normalizeTrPhone(input.customerPhone);
  if (!phone) return { success: false, error: PHONE_ERROR };

  if (!isValidDateString(input.date) || !isValidTimeString(input.time)) {
    return { success: false, error: "Lütfen geçerli bir tarih ve saat seçin." };
  }
  if (!UUID_RE.test(input.serviceId)) return { success: false, error: "Hizmet seçiniz." };
  if (input.staffId && !UUID_RE.test(input.staffId)) return { success: false, error: "Geçersiz personel." };

  const { data: service } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .eq("id", input.serviceId)
    .eq("shop_id", shop.id)
    .single();
  if (!service) return { success: false, error: "Hizmet bulunamadı." };

  const scheduledAt = istanbulToUtc(input.date, input.time);
  const durationMs = (Number(service.duration_minutes) > 0 ? Number(service.duration_minutes) : 30) * 60 * 1000;

  if (input.staffId) {
    const { data: staff } = await supabase.from("staff").select("id").eq("id", input.staffId).eq("shop_id", shop.id).single();
    if (!staff) return { success: false, error: "Personel bulunamadı." };

    // Aynı personelin çakışan randevusu var mı?
    const windowStart = new Date(scheduledAt.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(scheduledAt.getTime() + durationMs).toISOString();
    const { data: sameStaff } = await supabase
      .from("appointments")
      .select("scheduled_at, service:services(duration_minutes)")
      .eq("shop_id", shop.id)
      .eq("staff_id", input.staffId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", windowStart)
      .lt("scheduled_at", windowEnd);

    const conflict = (sameStaff ?? []).some((a: any) => {
      const svc = Array.isArray(a.service) ? a.service[0] : a.service;
      const start = new Date(a.scheduled_at).getTime();
      const end = start + (Number(svc?.duration_minutes) > 0 ? Number(svc.duration_minutes) : 30) * 60 * 1000;
      return start < scheduledAt.getTime() + durationMs && end > scheduledAt.getTime();
    });
    if (conflict) return { success: false, error: "Seçilen personelin bu saatte başka bir randevusu var." };
  }

  // Müşteri: eski kayıtlar farklı telefon biçiminde olabilir
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("shop_id", shop.id)
    .in("phone", phoneLookupVariants(input.customerPhone))
    .limit(1);

  let customerId: string;
  if (existing && existing.length > 0) {
    customerId = existing[0].id;
  } else {
    const { data: created, error: cErr } = await supabase
      .from("customers")
      .insert({ shop_id: shop.id, name: customerName, phone })
      .select("id")
      .single();
    if (cErr || !created) {
      console.error("Müşteri oluşturulamadı:", cErr);
      return { success: false, error: "Müşteri kaydedilemedi." };
    }
    customerId = created.id;
  }

  const cancelToken = newCancelToken();
  const { error: aErr } = await supabase.from("appointments").insert({
    shop_id: shop.id,
    customer_id: customerId,
    service_id: service.id,
    staff_id: input.staffId || null,
    scheduled_at: scheduledAt.toISOString(),
    status: "confirmed",
    source: "manual",
    cancel_token: cancelToken,
  });
  if (aErr) {
    console.error("Randevu eklenemedi:", aErr);
    return { success: false, error: "Randevu kaydedilemedi." };
  }

  if (!input.notify || scheduledAt <= new Date()) return { success: true, notified: false };

  const result = await sendAppointmentConfirmation({
    phone,
    customerName,
    scheduledAt,
    shopName: shop.name,
    cancelToken,
  });
  if (!result.success) console.error("WhatsApp onay bildirimi gönderilemedi:", result.error);
  return { success: true, notified: result.success };
}

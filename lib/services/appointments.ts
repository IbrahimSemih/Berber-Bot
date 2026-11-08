// Randevu işlemleri (işletme tarafı). Çağıran önce requireOwner / requireOwnerFromRequest
// ile oturumu doğrular; onay ve manuel ekleme için requireActive ile çağrılmalıdır.
import type { OwnerContext } from "@/lib/owner";
import { computeIsLocked } from "@/shared/plan";
import { normalizeTrPhone, phoneLookupVariants, PHONE_ERROR } from "@/shared/validations";
import { isValidDateString, isValidTimeString, istanbulToUtc } from "@/shared/time";
import {
  newCancelToken,
  sendAppointmentCancellation,
  sendAppointmentConfirmation,
} from "@/lib/appointment-messages";
import { fail, UUID_RE, type ServiceResult } from "./result";

type OwnerScope = Pick<OwnerContext, "supabase" | "shop">;
export type AppointmentActionResult = ServiceResult<{ notified: boolean }>;

/** Bekleyen randevuyu onaylar ve müşteriye WhatsApp onay şablonunu gönderir. */
export async function confirmAppointment(ctx: OwnerScope, appointmentId: string): Promise<AppointmentActionResult> {
  if (!UUID_RE.test(appointmentId)) return fail("invalid", "Geçersiz randevu.");
  const { supabase, shop } = ctx;

  const { data: apt } = await supabase
    .from("appointments")
    .select("id, status, scheduled_at, cancel_token, customer:customers(name, phone)")
    .eq("id", appointmentId)
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (!apt) return fail("not_found", "Randevu bulunamadı.");
  if (apt.status !== "pending") return fail("conflict", "Yalnızca onay bekleyen randevular onaylanabilir.");

  const cancelToken = apt.cancel_token || newCancelToken();

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "confirmed", cancel_token: cancelToken })
    .eq("id", apt.id)
    .eq("shop_id", shop.id);

  if (updateError) {
    console.error("Randevu onaylanamadı:", updateError);
    return fail("error", "Randevu güncellenemedi.");
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
export async function cancelAppointment(ctx: OwnerScope, appointmentId: string): Promise<AppointmentActionResult> {
  if (!UUID_RE.test(appointmentId)) return fail("invalid", "Geçersiz randevu.");
  const { supabase, shop } = ctx;

  const { data: apt } = await supabase
    .from("appointments")
    .select("id, status, scheduled_at, customer:customers(name, phone), service:services(name)")
    .eq("id", appointmentId)
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (!apt) return fail("not_found", "Randevu bulunamadı.");
  if (apt.status === "cancelled") return fail("conflict", "Bu randevu zaten iptal edilmiş.");

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", apt.id)
    .eq("shop_id", shop.id);

  if (error) {
    console.error("Randevu iptal edilemedi:", error);
    return fail("error", "Randevu iptal edilemedi.");
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

export type ManualAppointmentInput = {
  customerName: string;
  customerPhone: string;
  serviceId: string;
  staffId?: string | null;
  date: string;
  time: string;
  notify: boolean;
};

/** Panelden manuel randevu ekleme (telefonla/yüz yüze alınan randevular). */
export async function createManualAppointment(
  ctx: OwnerScope,
  input: ManualAppointmentInput
): Promise<ServiceResult<{ notified: boolean; appointmentId: string }>> {
  const { supabase, shop } = ctx;

  const customerName = (typeof input.customerName === "string" ? input.customerName : "").trim();
  if (customerName.length < 2 || customerName.length > 80) return fail("invalid", "Müşteri adı 2-80 karakter olmalıdır.");

  const rawPhone = typeof input.customerPhone === "string" ? input.customerPhone : "";
  const phone = normalizeTrPhone(rawPhone);
  if (!phone) return fail("invalid", PHONE_ERROR);

  if (!isValidDateString(input.date) || !isValidTimeString(input.time)) {
    return fail("invalid", "Lütfen geçerli bir tarih ve saat seçin.");
  }
  if (typeof input.serviceId !== "string" || !UUID_RE.test(input.serviceId)) return fail("invalid", "Hizmet seçiniz.");
  const staffId = input.staffId || null;
  if (staffId && (typeof staffId !== "string" || !UUID_RE.test(staffId))) return fail("invalid", "Geçersiz personel.");

  const { data: service } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .eq("id", input.serviceId)
    .eq("shop_id", shop.id)
    .maybeSingle();
  if (!service) return fail("not_found", "Hizmet bulunamadı.");

  const scheduledAt = istanbulToUtc(input.date, input.time);
  const durationMs = (Number(service.duration_minutes) > 0 ? Number(service.duration_minutes) : 30) * 60 * 1000;

  if (staffId) {
    const { data: staff } = await supabase.from("staff").select("id").eq("id", staffId).eq("shop_id", shop.id).maybeSingle();
    if (!staff) return fail("not_found", "Personel bulunamadı.");

    // Aynı personelin çakışan randevusu var mı?
    const windowStart = new Date(scheduledAt.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(scheduledAt.getTime() + durationMs).toISOString();
    const { data: sameStaff } = await supabase
      .from("appointments")
      .select("scheduled_at, service:services(duration_minutes)")
      .eq("shop_id", shop.id)
      .eq("staff_id", staffId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", windowStart)
      .lt("scheduled_at", windowEnd);

    const conflict = (sameStaff ?? []).some((a: any) => {
      const svc = Array.isArray(a.service) ? a.service[0] : a.service;
      const start = new Date(a.scheduled_at).getTime();
      const end = start + (Number(svc?.duration_minutes) > 0 ? Number(svc.duration_minutes) : 30) * 60 * 1000;
      return start < scheduledAt.getTime() + durationMs && end > scheduledAt.getTime();
    });
    if (conflict) return fail("conflict", "Seçilen personelin bu saatte başka bir randevusu var.");
  }

  // Müşteri: eski kayıtlar farklı telefon biçiminde olabilir
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("shop_id", shop.id)
    .in("phone", phoneLookupVariants(rawPhone))
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
      return fail("error", "Müşteri kaydedilemedi.");
    }
    customerId = created.id;
  }

  const cancelToken = newCancelToken();
  const { data: inserted, error: aErr } = await supabase
    .from("appointments")
    .insert({
      shop_id: shop.id,
      customer_id: customerId,
      service_id: service.id,
      staff_id: staffId,
      scheduled_at: scheduledAt.toISOString(),
      status: "confirmed",
      source: "manual",
      cancel_token: cancelToken,
    })
    .select("id")
    .single();
  if (aErr || !inserted) {
    console.error("Randevu eklenemedi:", aErr);
    return fail("error", "Randevu kaydedilemedi.");
  }

  if (!input.notify || scheduledAt <= new Date()) {
    return { success: true, notified: false, appointmentId: inserted.id };
  }

  const result = await sendAppointmentConfirmation({
    phone,
    customerName,
    scheduledAt,
    shopName: shop.name,
    cancelToken,
  });
  if (!result.success) console.error("WhatsApp onay bildirimi gönderilemedi:", result.error);
  return { success: true, notified: result.success, appointmentId: inserted.id };
}

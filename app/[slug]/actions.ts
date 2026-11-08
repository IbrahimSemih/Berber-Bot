"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingLimiter, apiLimiter, phoneBookingLimiter, getIp } from "@/lib/rate-limit";
import { getShopUsageAndLimits } from "@/lib/plan-limits";
import { getAvailability, resolveWorkingHours, type AvailabilityResult } from "@/lib/booking";
import { bookingSchema, phoneLookupVariants } from "@/lib/validations";
import { formatTrDateTime, isValidDateString, isValidTimeString, istanbulToUtc } from "@/lib/time";
import { newCancelToken, sendAppointmentConfirmation } from "@/lib/appointment-messages";
import { notifyShop } from "@/lib/notify";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

/** Aynı numaranın bir dükkanda aynı anda sahip olabileceği en fazla ileri tarihli aktif randevu */
const MAX_ACTIVE_BOOKINGS_PER_PHONE = 2;

async function loadBookableShop(admin: ReturnType<typeof createAdminClient>, shopId: string) {
  const { data: shop } = await admin.from("shops").select("id, name, status").eq("id", shopId).single();
  if (!shop || shop.status === "banned") return null;
  return shop;
}

export async function getAvailableSlots(input: {
  shopId: string;
  serviceId: string;
  date: string;
  staffId?: string | null;
}): Promise<AvailabilityResult> {
  const empty: AvailabilityResult = { slots: [], closed: false, staffOnLeave: false };
  if (!isUuid(input.shopId) || !isUuid(input.serviceId) || !isValidDateString(input.date)) return empty;
  if (input.staffId && !isUuid(input.staffId)) return empty;

  const ip = getIp(undefined, headers());
  const { success } = await apiLimiter.limit(`slots_${ip}`);
  if (!success) return empty;

  const admin = createAdminClient();
  const shop = await loadBookableShop(admin, input.shopId);
  if (!shop) return empty;

  const [{ data: service }, { data: settings }] = await Promise.all([
    admin.from("services").select("duration_minutes").eq("id", input.serviceId).eq("shop_id", shop.id).eq("is_active", true).single(),
    admin.from("settings").select("working_hours, work_days, work_start, work_end").eq("shop_id", shop.id).maybeSingle(),
  ]);
  if (!service) return empty;

  return getAvailability(admin, {
    shopId: shop.id,
    date: input.date,
    serviceDurationMinutes: service.duration_minutes,
    staffId: input.staffId || null,
    workingHours: resolveWorkingHours(settings),
  });
}

export type CreateBookingResult =
  | { success: true; status: "pending" | "confirmed" }
  | { success: false; error: string; code?: "slot_taken" };

export async function createBooking(data: {
  shopId: string;
  serviceId: string;
  staffId?: string | null;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  privacyAccepted: boolean;
}): Promise<CreateBookingResult> {
  const ip = getIp(undefined, headers());
  const { success } = await bookingLimiter.limit(`booking_${ip}`);
  if (!success) {
    return { success: false, error: "Çok fazla randevu talebi gönderdiniz. Lütfen bir süre bekleyip tekrar deneyin." };
  }

  if (!isUuid(data.shopId) || !isUuid(data.serviceId) || (data.staffId && !isUuid(data.staffId))) {
    return { success: false, error: "Geçersiz randevu bilgisi." };
  }
  if (!isValidDateString(data.date) || !isValidTimeString(data.time)) {
    return { success: false, error: "Lütfen geçerli bir tarih ve saat seçin." };
  }
  if (data.privacyAccepted !== true) {
    return { success: false, error: "Devam etmek için Aydınlatma Metni'ni okuduğunuzu onaylayın." };
  }

  const parsed = bookingSchema.safeParse({ customerName: data.customerName, phone: data.customerPhone });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Lütfen bilgilerinizi kontrol edin." };
  }
  const customerName = parsed.data.customerName;
  const phone = parsed.data.phone;

  const { success: phoneAllowed } = await phoneBookingLimiter.limit(`booking_phone_${data.shopId}_${phone}`);
  if (!phoneAllowed) {
    return { success: false, error: "Bu telefon numarasıyla çok fazla randevu denemesi yapıldı. Lütfen daha sonra tekrar deneyin." };
  }

  const admin = createAdminClient();

  try {
    const shop = await loadBookableShop(admin, data.shopId);
    if (!shop) return { success: false, error: "Dükkan bulunamadı." };

    // 0. Abonelik ve plan limitleri
    const shopLimits = await getShopUsageAndLimits(admin, shop.id);
    if (shopLimits.isLocked) {
      return { success: false, error: "Bu dükkan şu anda online randevu kabul etmemektedir. Lütfen telefon ile iletişime geçiniz." };
    }
    if (!shopLimits.canAddAppointment) {
      return { success: false, error: "Bu dükkan aylık online randevu kapasitesini doldurmuştur. Lütfen telefon ile iletişime geçiniz." };
    }

    // 1. Hizmet, personel ve ayarlar bu dükkana mı ait?
    const [{ data: service }, { data: settings }] = await Promise.all([
      admin.from("services").select("id, name, duration_minutes").eq("id", data.serviceId).eq("shop_id", shop.id).eq("is_active", true).single(),
      admin.from("settings").select("*").eq("shop_id", shop.id).maybeSingle(),
    ]);
    if (!service) return { success: false, error: "Seçtiğiniz hizmet artık sunulmuyor. Lütfen sayfayı yenileyin." };

    if (data.staffId) {
      const { data: staff } = await admin.from("staff").select("id").eq("id", data.staffId).eq("shop_id", shop.id).eq("is_active", true).single();
      if (!staff) return { success: false, error: "Seçtiğiniz personel bulunamadı. Lütfen sayfayı yenileyin." };
    }

    // 2. Saat hâlâ müsait mi? (istemciye gösterilen listeyle aynı hesap)
    const availability = await getAvailability(admin, {
      shopId: shop.id,
      date: data.date,
      serviceDurationMinutes: service.duration_minutes,
      staffId: data.staffId || null,
      workingHours: resolveWorkingHours(settings),
    });
    if (!availability.slots.includes(data.time)) {
      return { success: false, code: "slot_taken", error: "Seçtiğiniz saat az önce doldu veya artık müsait değil. Lütfen başka bir saat seçin." };
    }

    const scheduledAt = istanbulToUtc(data.date, data.time).toISOString();

    // 3. Müşteriyi bul (eski kayıtlar farklı telefon biçiminde olabilir) veya oluştur
    const { data: existingCustomers } = await admin
      .from("customers")
      .select("id")
      .eq("shop_id", shop.id)
      .in("phone", phoneLookupVariants(data.customerPhone))
      .limit(1);

    let customerId: string;
    if (existingCustomers && existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;

      // Başkasının numarasıyla toplu sahte randevu açılmasını sınırla
      const { count: activeCount } = await admin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shop.id)
        .eq("customer_id", customerId)
        .in("status", ["pending", "confirmed"])
        .gt("scheduled_at", new Date().toISOString());
      if ((activeCount ?? 0) >= MAX_ACTIVE_BOOKINGS_PER_PHONE) {
        return {
          success: false,
          error: `Bu telefon numarasıyla zaten ${MAX_ACTIVE_BOOKINGS_PER_PHONE} aktif randevunuz var. Yeni randevu için mevcut randevunuzu iptal edin veya dükkanı arayın.`,
        };
      }
    } else {
      const { data: newCustomer, error: customerError } = await admin
        .from("customers")
        .insert({ shop_id: shop.id, name: customerName, phone })
        .select("id")
        .single();
      if (customerError || !newCustomer) {
        console.error("Müşteri kaydı oluşturulamadı:", customerError);
        return { success: false, error: "Randevu oluşturulamadı. Lütfen tekrar deneyin." };
      }
      customerId = newCustomer.id;
    }

    // 4. Randevu
    const autoConfirm = settings?.auto_confirm !== false;
    const status: "pending" | "confirmed" = autoConfirm ? "confirmed" : "pending";
    const cancelToken = newCancelToken();

    const { data: inserted, error: appointmentError } = await admin.from("appointments").insert({
      shop_id: shop.id,
      customer_id: customerId,
      service_id: service.id,
      staff_id: data.staffId || null,
      scheduled_at: scheduledAt,
      status,
      source: "manual",
      notes: "Web randevu sayfasından alındı",
      cancel_token: cancelToken,
    }).select("id, created_at").single();

    if (appointmentError || !inserted) {
      console.error("Randevu oluşturulamadı:", appointmentError);
      return { success: false, error: "Randevu oluşturulamadı. Lütfen tekrar deneyin." };
    }

    // 4b. Eşzamanlı istek kontrolü: aynı saate aynı anda iki randevu eklenmiş olabilir.
    // Yalnızca bizden önce eklenenler dolu sayılır; saat artık uygun değilse sonradan
    // gelen (bu) randevu geri alınır. İki istek de aynı sırayı gördüğü için biri kalır.
    const recheck = await getAvailability(admin, {
      shopId: shop.id,
      date: data.date,
      serviceDurationMinutes: service.duration_minutes,
      staffId: data.staffId || null,
      workingHours: resolveWorkingHours(settings),
      before: { id: inserted.id, createdAt: inserted.created_at },
    });
    if (!recheck.slots.includes(data.time)) {
      await admin.from("appointments").delete().eq("id", inserted.id);
      return { success: false, code: "slot_taken", error: "Seçtiğiniz saat az önce doldu. Lütfen başka bir saat seçin." };
    }

    // 5. Otomatik onay açıksa müşteriye WhatsApp onay mesajı
    if (status === "confirmed") {
      const result = await sendAppointmentConfirmation({
        phone,
        customerName,
        scheduledAt,
        shopName: shop.name,
        cancelToken,
      });
      if (!result.success) console.error("WhatsApp onay mesajı gönderilemedi:", result.error);
    }

    // 6. İşletmeye panel bildirimi
    if (settings?.notify_new !== false) {
      const when = formatTrDateTime(scheduledAt);
      await notifyShop(admin, shop.id, {
        type: "new_booking",
        message: `🔔 ${customerName} web üzerinden ${status === "pending" ? "yeni bir randevu talebi oluşturdu" : "randevu aldı"}. (${service.name} · ${when})`,
        push: {
          title: status === "pending" ? "Yeni randevu talebi" : "Yeni randevu",
          body: `${customerName} · ${service.name} · ${when}`,
          data: { type: "new_booking", appointmentId: inserted.id },
        },
      });
    }

    return { success: true, status };
  } catch (error) {
    console.error("createBooking hatası:", error);
    return { success: false, error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }
}

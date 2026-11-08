import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiLimiter, getIp } from "@/lib/rate-limit";
import { computeIsLocked } from "@/lib/plan-limits";
import { formatTrDateTime } from "@/lib/time";
import { sendAppointmentCancellation } from "@/lib/appointment-messages";

export const dynamic = "force-dynamic";

// Müşterinin WhatsApp'taki linkten randevusunu iptal etmesi (giriş gerektirmez; token gizlidir)
export async function POST(request: Request) {
  try {
    const { success } = await apiLimiter.limit(`cancel_${getIp(request)}`);
    if (!success) {
      return NextResponse.json({ error: "Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin." }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token || token.length > 64) {
      return NextResponse.json({ error: "Geçersiz bağlantı." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: appointment } = await supabaseAdmin
      .from("appointments_full")
      .select("*")
      .eq("cancel_token", token)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: "Randevu bulunamadı veya bağlantı geçersiz." }, { status: 404 });
    }
    if (appointment.status === "cancelled") {
      return NextResponse.json({ error: "Bu randevu zaten iptal edilmiş." }, { status: 400 });
    }
    if (appointment.status === "completed" || new Date(appointment.scheduled_at) <= new Date()) {
      return NextResponse.json({ error: "Geçmiş randevular iptal edilemez." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointment.id)
      .in("status", ["pending", "confirmed"])
      .select("id");

    if (updateError) {
      console.error("Cancel appointment error:", updateError);
      return NextResponse.json({ error: "İptal işlemi başarısız oldu." }, { status: 500 });
    }
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: "Bu randevu zaten iptal edilmiş." }, { status: 400 });
    }

    const [{ data: shop }, { data: settings }] = await Promise.all([
      supabaseAdmin.from("shops").select("id, status, subscription_status, trial_end, current_period_end").eq("id", appointment.shop_id).single(),
      supabaseAdmin.from("settings").select("notify_cancel").eq("shop_id", appointment.shop_id).maybeSingle(),
    ]);

    // Müşteriye WhatsApp iptal teyidi (aboneliği aktif dükkanlar için)
    if (appointment.customer_phone && shop && !computeIsLocked(shop)) {
      const result = await sendAppointmentCancellation({
        phone: appointment.customer_phone,
        customerName: appointment.customer_name,
        scheduledAt: appointment.scheduled_at,
        serviceName: appointment.service_name,
        shopName: appointment.shop_name,
      });
      if (!result.success) console.error("WhatsApp iptal bildirimi gönderilemedi:", result.error);
    }

    // İşletme sahibinin paneline bildirim
    if (settings?.notify_cancel !== false) {
      await supabaseAdmin.from("notifications").insert({
        shop_id: appointment.shop_id,
        type: "cancel",
        message: `❌ ${appointment.customer_name || "Bir müşteri"} randevusunu iptal etti. (${formatTrDateTime(appointment.scheduled_at)})`,
      });
    }

    return NextResponse.json({ success: true, message: "Randevunuz başarıyla iptal edildi." });
  } catch (error) {
    console.error("Cancel API error:", error);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeIsLocked } from "@/lib/plan-limits";
import { REMINDER_HOURS_BEFORE, sendAppointmentReminder } from "@/lib/appointment-messages";

export const dynamic = "force-dynamic";

// Bu görevi tetikleyen cron'un çalışma sıklığına göre güvenli örtüşme payı
const WINDOW_MINUTES = 20;

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function run() {
  const supabaseAdmin = createAdminClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() + (REMINDER_HOURS_BEFORE * 60 - WINDOW_MINUTES) * 60 * 1000);
  const windowEnd = new Date(now.getTime() + (REMINDER_HOURS_BEFORE * 60 + WINDOW_MINUTES) * 60 * 1000);

  const { data: appointments, error } = await supabaseAdmin
    .from("appointments_full")
    .select("*")
    .eq("status", "confirmed")
    .eq("reminder_sent", false)
    .gte("scheduled_at", windowStart.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  if (error) {
    console.error("Hatırlatma cron: randevular çekilemedi:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  const rows = appointments ?? [];
  if (rows.length === 0) return NextResponse.json({ checked: 0, sent: 0, failed: 0, skipped: 0 });

  const shopIds = Array.from(new Set(rows.map((a) => a.shop_id).filter(Boolean)));

  // Hatırlatmayı kapatmış veya aboneliği bitmiş dükkanlara mesaj gönderilmez
  const [{ data: shops }, { data: settingsRows }] = await Promise.all([
    supabaseAdmin.from("shops").select("id, status, subscription_status, trial_end, current_period_end").in("id", shopIds),
    supabaseAdmin.from("settings").select("shop_id, reminder_hours").in("shop_id", shopIds),
  ]);

  const shopMap = new Map((shops ?? []).map((s: any) => [s.id, s]));
  const reminderOff = new Set(
    (settingsRows ?? []).filter((s: any) => s.reminder_hours === 0).map((s: any) => s.shop_id)
  );

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const apt of rows) {
    const shop = shopMap.get(apt.shop_id);
    if (!apt.customer_phone || !shop || shop.status === "banned" || computeIsLocked(shop, now) || reminderOff.has(apt.shop_id)) {
      skipped++;
      continue;
    }

    // Aynı randevuya iki kez mesaj gitmesin: önce işaretle, başarısız olursa geri al
    const { data: claimed } = await supabaseAdmin
      .from("appointments")
      .update({ reminder_sent: true })
      .eq("id", apt.id)
      .eq("reminder_sent", false)
      .select("id");
    if (!claimed || claimed.length === 0) {
      skipped++;
      continue;
    }

    const result = await sendAppointmentReminder({
      phone: apt.customer_phone,
      customerName: apt.customer_name,
      scheduledAt: apt.scheduled_at,
      shopName: apt.shop_name,
      serviceName: apt.service_name,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      await supabaseAdmin.from("appointments").update({ reminder_sent: false }).eq("id", apt.id);
      console.error(`Hatırlatma gönderilemedi (randevu ${apt.id}):`, result.error);
    }
  }

  return NextResponse.json({ checked: rows.length, sent, failed, skipped });
}

// 15 dakikada bir harici cron servisi (cron-job.org / Upstash QStash) çağırır: Vercel
// Hobby planı günde birden sık cron'a izin vermediği için vercel.json'da DEĞİL.
// GET ve POST desteklenir; ikisinde de "Authorization: Bearer <CRON_SECRET>" gerekir.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

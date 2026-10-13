import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Randevudan kaç saat önce hatırlatma gönderilsin
const REMINDER_HOURS_BEFORE = 3;
// Bu görevi tetikleyen cron'un çalışma sıklığına göre güvenli örtüşme payı
const WINDOW_MINUTES = 20;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  let sent = 0;
  let failed = 0;

  for (const apt of appointments ?? []) {
    if (!apt.customer_phone) continue;

    const dateObj = new Date(apt.scheduled_at);
    const dateStr =
      dateObj.toLocaleDateString("tr-TR") +
      " saat " +
      dateObj.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

    // Meta'da onaylı "randevu_hatirlatma" şablonu: {{1}}=isim, {{2}}=tarih/saat, {{3}}=dükkan, {{4}}=hizmet
    const result = await sendWhatsAppTemplate(apt.customer_phone, "randevu_hatirlatma", [
      apt.customer_name || "Değerli Müşterimiz",
      dateStr,
      apt.shop_name || "Berber",
      apt.service_name || "randevu",
    ]);

    if (result.success) {
      sent++;
      await supabaseAdmin.from("appointments").update({ reminder_sent: true }).eq("id", apt.id);
    } else {
      failed++;
      console.error(`Hatırlatma gönderilemedi (randevu ${apt.id}):`, result.error);
    }
  }

  return NextResponse.json({ checked: appointments?.length ?? 0, sent, failed });
}

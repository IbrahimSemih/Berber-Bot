import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXPIRY_REMINDER_DAYS } from "@/lib/plan-limits";
import { sendExpiryReminderEmail } from "@/lib/email";
import { formatTrLongDate } from "@/lib/time";
import { SITE } from "@/lib/site-config";

export const dynamic = "force-dynamic";

// Günde bir kez çalışır (vercel.json). Otomatik yenileme olmadığı için deneme
// veya abonelik bitişine EXPIRY_REMINDER_DAYS gün kala sahibine e-posta gönderir.
function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

type ShopRow = {
  id: string;
  name: string;
  owner_id: string | null;
  status: string | null;
  subscription_status: string;
  trial_end: string | null;
  current_period_end: string | null;
  expiry_reminder_sent_for: string | null;
};

async function run() {
  const admin = createAdminClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + EXPIRY_REMINDER_DAYS * 24 * 60 * 60 * 1000);
  const columns = "id, name, owner_id, status, subscription_status, trial_end, current_period_end, expiry_reminder_sent_for";

  const [trialRes, activeRes] = await Promise.all([
    admin.from("shops").select(columns).eq("subscription_status", "trialing")
      .gt("trial_end", now.toISOString()).lte("trial_end", horizon.toISOString()),
    admin.from("shops").select(columns).eq("subscription_status", "active")
      .gt("current_period_end", now.toISOString()).lte("current_period_end", horizon.toISOString()),
  ]);

  if (trialRes.error || activeRes.error) {
    console.error("Abonelik hatırlatma cron hatası:", trialRes.error || activeRes.error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  const shops = [...(trialRes.data ?? []), ...(activeRes.data ?? [])] as ShopRow[];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const shop of shops) {
    const isTrial = shop.subscription_status === "trialing";
    const endIso = isTrial ? shop.trial_end : shop.current_period_end;
    if (!endIso || shop.status === "banned" || !shop.owner_id) { skipped++; continue; }

    // Aynı bitiş tarihi için ikinci kez gönderme
    if (shop.expiry_reminder_sent_for && new Date(shop.expiry_reminder_sent_for).getTime() === new Date(endIso).getTime()) {
      skipped++;
      continue;
    }

    const { data: userData } = await admin.auth.admin.getUserById(shop.owner_id);
    const email = userData?.user?.email;
    if (!email) { skipped++; continue; }

    const end = new Date(endIso);
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    const result = await sendExpiryReminderEmail(email, {
      shopName: shop.name,
      isTrial,
      endDate: formatTrLongDate(end),
      daysLeft,
      billingUrl: `${SITE.url}/settings/billing#plans`,
    });

    if (result.success) {
      sent++;
      await admin.from("shops").update({ expiry_reminder_sent_for: endIso }).eq("id", shop.id);
    } else {
      failed++;
      console.error(`Abonelik hatırlatması gönderilemedi (dükkan ${shop.id}):`, result.error);
    }
  }

  return NextResponse.json({ checked: shops.length, sent, skipped, failed });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

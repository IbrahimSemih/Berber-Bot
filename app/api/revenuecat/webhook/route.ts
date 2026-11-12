// RevenueCat webhook'u (mobile_app_plan.md §3.3). RevenueCat panelinde
// Authorization başlığı olarak REVENUECAT_WEBHOOK_AUTH değeri tanımlanır.
// - Tekrar gelen olaylar store_webhook_events.event_id ile atlanır
// - Dükkanın durumu olaydan değil, RevenueCat'teki güncel kayıttan türetilir
// - Satın alma ve yenilemeler payments tablosuna yazılır (20/B gelir takibi)
// - SANDBOX olayları reddedilmez (Apple incelemesi sandbox ile satın alır)
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { intervalFromProductId } from "@/lib/revenuecat";
import { syncShopStoreBilling } from "@/lib/services/store-billing";
import { UUID_RE } from "@/lib/services/result";

export const dynamic = "force-dynamic";

const UNIQUE_VIOLATION = "23505";
const PAYMENT_EVENTS = new Set(["INITIAL_PURCHASE", "RENEWAL", "NON_RENEWING_PURCHASE"]);

type RcEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  environment?: string;
  store?: string;
  product_id?: string;
  transaction_id?: string;
  price_in_purchased_currency?: number;
  currency?: string;
  cancel_reason?: string;
};

function isAuthorized(req: Request): boolean {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  const got = req.headers.get("authorization");
  if (!expected || !got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Olayın dükkan id'si: app_user_id (anonim kimlikse takma adlardan uygun olanı). */
function shopIdOf(event: RcEvent): string | null {
  const candidates = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])];
  return candidates.find((id): id is string => typeof id === "string" && UUID_RE.test(id)) ?? null;
}

function storeOf(event: RcEvent): "app_store" | "play_store" | null {
  if (event.store === "APP_STORE") return "app_store";
  if (event.store === "PLAY_STORE") return "play_store";
  return null;
}

export async function POST(req: Request) {
  if (!process.env.REVENUECAT_WEBHOOK_AUTH) {
    console.error("[revenuecat] REVENUECAT_WEBHOOK_AUTH tanımlı değil");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { event?: RcEvent };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const event = body.event;
  if (!event?.id || !event.type) return NextResponse.json({ error: "invalid event" }, { status: 400 });
  if (event.type === "TEST") return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const environment = event.environment === "SANDBOX" ? "sandbox" : "production";
  const shopId = shopIdOf(event);

  // ── Idempotency ───────────────────────────────────────────────────────────
  const { error: insertError } = await admin.from("store_webhook_events").insert({
    event_id: event.id,
    type: event.type,
    app_user_id: event.app_user_id ?? null,
    environment,
    payload: body,
  });
  if (insertError) {
    if (insertError.code !== UNIQUE_VIOLATION) {
      console.error("[revenuecat] olay kaydedilemedi:", insertError);
      return NextResponse.json({ error: "storage" }, { status: 500 }); // RevenueCat tekrar dener
    }
    const { data: existing } = await admin
      .from("store_webhook_events")
      .select("processed_at")
      .eq("event_id", event.id)
      .maybeSingle();
    if (existing?.processed_at) return NextResponse.json({ ok: true, duplicate: true });
    // Önceki deneme yarıda kaldıysa yeniden işle
  }

  const markProcessed = () =>
    admin.from("store_webhook_events").update({ processed_at: new Date().toISOString() }).eq("event_id", event.id);

  if (!shopId) {
    // Giriş yapmadan (anonim) satın alma olamaz; yine de kaydı tutup geç
    console.warn("[revenuecat] dükkan kimliği yok:", event.type, event.app_user_id);
    await markProcessed();
    return NextResponse.json({ ok: true, skipped: "no_shop" });
  }

  const { data: shop } = await admin.from("shops").select("id").eq("id", shopId).maybeSingle();
  if (!shop) {
    console.warn("[revenuecat] dükkan bulunamadı:", shopId);
    await markProcessed();
    return NextResponse.json({ ok: true, skipped: "unknown_shop" });
  }

  // ── Ödeme kaydı ───────────────────────────────────────────────────────────
  const provider = storeOf(event);
  if (PAYMENT_EVENTS.has(event.type) && event.transaction_id && provider) {
    const { error: paymentError } = await admin.from("payments").insert({
      shop_id: shopId,
      amount: event.price_in_purchased_currency ?? 0,
      currency: event.currency ?? "TRY",
      payment_id: event.transaction_id,
      status: "success",
      billing_interval: intervalFromProductId(event.product_id),
      provider,
      environment,
      product_id: event.product_id ?? null,
    });
    if (paymentError && paymentError.code !== UNIQUE_VIOLATION) {
      console.error("[revenuecat] ödeme kaydedilemedi:", paymentError);
      return NextResponse.json({ error: "storage" }, { status: 500 });
    }
  }

  // Apple/Google'ın kendi iade süreci
  if (event.type === "CANCELLATION" && event.cancel_reason === "CUSTOMER_SUPPORT" && event.transaction_id) {
    const { error: refundError } = await admin
      .from("payments")
      .update({ status: "refunded", refunded_at: new Date().toISOString() })
      .eq("payment_id", event.transaction_id)
      .eq("status", "success");
    if (refundError) console.error("[revenuecat] iade işaretlenemedi:", refundError);
  }

  // ── Dükkanın güncel abonelik durumu ───────────────────────────────────────
  const result = await syncShopStoreBilling(admin, shopId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

  await markProcessed();
  return NextResponse.json({ ok: true });
}

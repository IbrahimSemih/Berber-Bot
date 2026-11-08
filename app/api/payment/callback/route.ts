import { NextRequest, NextResponse } from "next/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanPrice, parseBillingInterval, PLANS } from "@/lib/plan-limits";
import { sendSubscriptionFailedEmail, sendSubscriptionSuccessEmail } from "@/lib/email";
import { addMonthsInIstanbul } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Postgres unique_violation hata kodu */
const UNIQUE_VIOLATION = "23505";

// Yönlendirmeleri req.url yerine uygulamanın gerçek adresinden üret: ngrok/proxy arkasında
// req.url "https://localhost:3000" gibi hatalı bir adres verebiliyor.
function appUrl(path: string, req: NextRequest) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).trim().replace(/\/$/, "");
  return new URL(path, base);
}

// basketId "<shopId>:<interval>" biçiminde gönderilir (eski ödemeler için yalnızca shopId olabilir)
function parseBasketId(basketId: string) {
  const [shopId, interval] = String(basketId).split(":");
  return { shopId, interval: parseBillingInterval(interval) };
}

async function ownerEmailFor(admin: ReturnType<typeof createAdminClient>, ownerId: string | null) {
  if (!ownerId) return null;
  const { data } = await admin.auth.admin.getUserById(ownerId);
  return data?.user?.email ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token");

    if (typeof token !== "string" || !token) {
      return NextResponse.redirect(appUrl("/settings/billing?error=missing_token", req), 303);
    }

    // Sonuç her zaman iyzico'dan sunucu tarafında doğrulanır; formdaki veriye güvenilmez
    const result: any = await retrieveCheckoutForm(token);
    const admin = createAdminClient();

    if (result.status === "success" && result.paymentStatus === "SUCCESS" && result.basketId) {
      const { shopId, interval } = parseBasketId(result.basketId);
      const paymentId = String(result.paymentId);
      const paidAmount = Number(result.paidPrice);

      // Tutar beklenen plan fiyatıyla uyuşmalı
      if (!Number.isFinite(paidAmount) || paidAmount + 0.001 < getPlanPrice("pro", interval)) {
        console.error("Ödeme tutarı beklenenden düşük:", { shopId, interval, paidAmount, paymentId });
        return NextResponse.redirect(appUrl("/settings/billing?error=amount_mismatch", req), 303);
      }

      // Aynı ödeme ikinci kez işlenmesin (kullanıcı sayfayı yenilerse / geri gelirse)
      const { data: existingPayment } = await admin
        .from("payments")
        .select("id")
        .eq("payment_id", paymentId)
        .in("status", ["success", "refunded"])
        .maybeSingle();
      if (existingPayment) {
        return NextResponse.redirect(appUrl("/settings/billing?success=true", req), 303);
      }

      const { data: shop } = await admin
        .from("shops")
        .select("id, name, owner_id, subscription_status, trial_end, current_period_end")
        .eq("id", shopId)
        .single();
      if (!shop) {
        console.error("Ödeme alındı ama dükkan bulunamadı:", { shopId, paymentId });
        return NextResponse.redirect(appUrl("/settings/billing?error=system_error", req), 303);
      }

      // Süresi dolmamış aktif abonelikte (veya devam eden denemede) yeni dönem mevcut bitişin üzerine eklenir
      const now = new Date();
      const currentEnd = shop.current_period_end ? new Date(shop.current_period_end) : null;
      const trialEnd = shop.trial_end ? new Date(shop.trial_end) : null;
      const periodStart =
        shop.subscription_status === "active" && currentEnd && currentEnd > now
          ? currentEnd
          : shop.subscription_status === "trialing" && trialEnd && trialEnd > now
            ? trialEnd
            : now;
      const periodEnd = addMonthsInIstanbul(periodStart, interval === "yearly" ? 12 : 1);

      // Fatura kesimi için ödeme anındaki fatura bilgilerinin kopyası
      const { data: billingProfile } = await admin
        .from("billing_profiles")
        .select("*")
        .eq("shop_id", shopId)
        .maybeSingle();

      // Ödeme kaydı abonelik uzatılmadan ÖNCE eklenir. payment_id üzerindeki unique index
      // (migrations/2026-11-08) aynı anda gelen iki callback'ten yalnızca birinin geçmesini sağlar.
      let { error: paymentInsertError } = await admin.from("payments").insert([{
        shop_id: shopId,
        amount: paidAmount,
        currency: "TRY",
        payment_id: paymentId,
        billing_interval: interval,
        status: "success",
        billing_snapshot: billingProfile ?? null,
      }]);
      if (paymentInsertError && paymentInsertError.code !== UNIQUE_VIOLATION) {
        // billing_snapshot kolonu henüz eklenmemişse kaydı onsuz dene
        console.error("Ödeme kaydı hatası:", paymentInsertError);
        ({ error: paymentInsertError } = await admin.from("payments").insert([{
          shop_id: shopId,
          amount: paidAmount,
          currency: "TRY",
          payment_id: paymentId,
          billing_interval: interval,
          status: "success",
        }]));
      }
      if (paymentInsertError?.code === UNIQUE_VIOLATION) {
        // Bu ödeme başka bir istekte zaten işlendi: aboneliği ikinci kez uzatma
        return NextResponse.redirect(appUrl("/settings/billing?success=true", req), 303);
      }
      if (paymentInsertError) {
        console.error("Ödeme kaydedilemedi (abonelik yine de uzatılıyor):", paymentInsertError, { shopId, paymentId });
      }

      const { error: shopUpdateError } = await admin
        .from("shops")
        .update({
          subscription_status: "active",
          current_period_end: periodEnd.toISOString(),
          plan_id: "pro",
        })
        .eq("id", shopId);
      if (shopUpdateError) console.error("Abonelik güncellenemedi:", shopUpdateError, { shopId, paymentId });

      const email = await ownerEmailFor(admin, shop.owner_id);
      if (email) {
        await sendSubscriptionSuccessEmail(
          email,
          shop.name,
          `${PLANS.pro.name} (${interval === "yearly" ? "Yıllık" : "Aylık"})`,
          `₺${paidAmount.toLocaleString("tr-TR")}`
        );
      }

      return NextResponse.redirect(appUrl("/settings/billing?success=true", req), 303);
    }

    // Ödeme başarısız
    const shopId = result.basketId ? parseBasketId(result.basketId).shopId : null;
    if (shopId) {
      await admin.from("payments").insert([{
        shop_id: shopId,
        amount: 0,
        currency: "TRY",
        payment_id: result.paymentId || "failed",
        status: "failure",
      }]);

      const { data: shop } = await admin.from("shops").select("name, owner_id").eq("id", shopId).single();
      const email = shop ? await ownerEmailFor(admin, shop.owner_id) : null;
      if (email && shop) {
        await sendSubscriptionFailedEmail(email, shop.name, PLANS.pro.name, result.errorMessage || undefined);
      }
    }
    return NextResponse.redirect(appUrl("/settings/billing?error=payment_failed", req), 303);
  } catch (error) {
    console.error("Iyzico callback error:", error);
    return NextResponse.redirect(appUrl("/settings/billing?error=system_error", req), 303);
  }
}

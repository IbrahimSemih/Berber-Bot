import { NextRequest, NextResponse } from "next/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { createClient } from "@supabase/supabase-js";
import { parseBillingInterval } from "@/lib/plan-limits";

// Service role key is required here to bypass RLS since this is a webhook from iyzico
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;
    
    if (!token) {
      return NextResponse.redirect(appUrl("/settings/billing?error=missing_token", req));
    }

    const result: any = await retrieveCheckoutForm(token);

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      const { shopId, interval } = parseBasketId(result.basketId);
      const amount = result.paidPrice;
      const paymentId = result.paymentId;

      // 1. Update shop subscription status
      const periodEnd = new Date();
      if (interval === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await supabase
        .from("shops")
        .update({
          subscription_status: 'active',
          current_period_end: periodEnd.toISOString(),
          plan_id: 'pro'
        })
        .eq("id", shopId);

      // 2. Insert payment record
      await supabase
        .from("payments")
        .insert([{
          shop_id: shopId,
          amount: amount,
          currency: 'TRY',
          payment_id: paymentId,
          billing_interval: interval,
          status: 'success'
        }]);

      return NextResponse.redirect(appUrl("/settings/billing?success=true", req));
    } else {
      // Payment failed
      const shopId = result.basketId ? parseBasketId(result.basketId).shopId : null;
      if (shopId) {
        await supabase
          .from("payments")
          .insert([{
            shop_id: shopId,
            amount: 0,
            currency: 'TRY',
            payment_id: result.paymentId || 'failed',
            status: 'failure'
          }]);
      }
      return NextResponse.redirect(appUrl("/settings/billing?error=payment_failed", req));
    }

  } catch (error) {
    console.error("Iyzico callback error:", error);
    return NextResponse.redirect(appUrl("/settings/billing?error=system_error", req));
  }
}

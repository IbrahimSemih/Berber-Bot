import { NextRequest, NextResponse } from "next/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { createClient } from "@supabase/supabase-js";

// Service role key is required here to bypass RLS since this is a webhook from iyzico
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;
    
    if (!token) {
      return NextResponse.redirect(new URL("/settings/billing?error=missing_token", req.url));
    }

    const result: any = await retrieveCheckoutForm(token);

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      const shopId = result.basketId; // We passed shopId as basketId
      const amount = result.paidPrice;
      const paymentId = result.paymentId;

      // 1. Update shop subscription status
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await supabase
        .from("shops")
        .update({
          subscription_status: 'active',
          current_period_end: nextMonth.toISOString(),
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
          status: 'success'
        }]);

      return NextResponse.redirect(new URL("/settings/billing?success=true", req.url));
    } else {
      // Payment failed
      const shopId = result.basketId;
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
      return NextResponse.redirect(new URL("/settings/billing?error=payment_failed", req.url));
    }

  } catch (error) {
    console.error("Iyzico callback error:", error);
    return NextResponse.redirect(new URL("/settings/billing?error=system_error", req.url));
  }
}

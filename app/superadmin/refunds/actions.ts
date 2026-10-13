"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySuperAdminToken } from "@/lib/auth";
import { refundPayment } from "@/lib/iyzico";

export async function refundPaymentAction(paymentRowId: string) {
  // Server Action'lar doğrudan çağrılabildiği için yetkiyi burada da doğruluyoruz
  const token = cookies().get("superadmin_auth")?.value;
  if (!token || !(await verifySuperAdminToken(token))) {
    return { success: false, error: "Yetkisiz işlem." };
  }

  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("id, shop_id, amount, currency, status, payment_id")
    .eq("id", paymentRowId)
    .single();

  if (!payment) return { success: false, error: "Ödeme bulunamadı." };
  if (payment.status !== "success") return { success: false, error: "Yalnızca başarılı ödemeler iade edilebilir." };
  if (!payment.payment_id || payment.payment_id === "failed") return { success: false, error: "Ödemenin iyzico kaydı bulunamadı." };

  const forwardedFor = headers().get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "85.34.78.112";

  let result: any;
  try {
    result = await refundPayment({
      paymentId: payment.payment_id,
      price: Number(payment.amount).toFixed(2),
      conversationId: payment.id,
      ip,
    });
  } catch (e: any) {
    console.error("İyzico iade hatası:", e);
    return { success: false, error: e?.message || "İyzico'ya ulaşılamadı." };
  }

  if (result?.status !== "success") {
    console.error("İyzico iade reddedildi:", result);
    return { success: false, error: result?.errorMessage || "İyzico iadeyi reddetti." };
  }

  const nowIso = new Date().toISOString();
  await admin.from("payments").update({ status: "refunded", refunded_at: nowIso }).eq("id", payment.id);

  // Tam iade: aboneliği hemen sonlandır, dükkan kilitlenir
  await admin
    .from("shops")
    .update({ subscription_status: "canceled", current_period_end: nowIso })
    .eq("id", payment.shop_id);

  revalidatePath("/superadmin/refunds");
  revalidatePath("/superadmin");
  return { success: true };
}

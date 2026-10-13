"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { YEARLY_REFUND_DAYS } from "@/lib/plan-limits";

export async function requestRefund(paymentRowId: string, reason: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadı." };

  const admin = createAdminClient();

  const { data: shop } = await admin.from("shops").select("id").eq("owner_id", user.id).single();
  if (!shop) return { success: false, error: "Dükkan bulunamadı." };

  const { data: payment } = await admin
    .from("payments")
    .select("id, status, billing_interval, created_at, refund_requested_at, refunded_at")
    .eq("id", paymentRowId)
    .eq("shop_id", shop.id)
    .single();

  if (!payment || payment.status !== "success") {
    return { success: false, error: "Ödeme bulunamadı." };
  }
  if (payment.billing_interval !== "yearly") {
    return { success: false, error: "Koşulsuz iade yalnızca yıllık planlar için geçerlidir." };
  }
  if (payment.refund_requested_at || payment.refunded_at) {
    return { success: false, error: "Bu ödeme için zaten bir iade talebi var." };
  }

  const ageDays = (Date.now() - new Date(payment.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > YEARLY_REFUND_DAYS) {
    return { success: false, error: `İade süresi (${YEARLY_REFUND_DAYS} gün) dolmuştur.` };
  }

  const { error } = await admin
    .from("payments")
    .update({ refund_requested_at: new Date().toISOString(), refund_reason: reason.trim().slice(0, 500) || null })
    .eq("id", payment.id);

  if (error) return { success: false, error: "Talep kaydedilemedi." };

  revalidatePath("/settings/billing");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/owner";
import { createAdminClient } from "@/lib/supabase/admin";
import { billingProfileSchema, normalizeTrPhone, type BillingProfileInput } from "@/lib/validations";

export async function saveBillingProfile(
  input: BillingProfileInput
): Promise<{ success: true } | { success: false; error: string; field?: string }> {
  // Fatura bilgisi, aboneliği bitmiş kullanıcının da ödeme yapabilmesi için kilitliyken kaydedilebilir
  const auth = await requireOwner();
  if ("error" in auth) return { success: false, error: auth.error as string };
  const { shop } = auth.ctx;

  const parsed = billingProfileSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { success: false, error: issue?.message || "Lütfen bilgileri kontrol edin.", field: issue?.path?.[0]?.toString() };
  }
  const d = parsed.data;
  const isCorporate = d.type === "corporate";

  const row = {
    shop_id: shop.id,
    type: d.type,
    full_name: d.full_name,
    company_name: isCorporate ? d.company_name : null,
    identity_number: isCorporate ? null : d.identity_number,
    tax_office: isCorporate ? d.tax_office : null,
    tax_number: isCorporate ? d.tax_number : null,
    phone: normalizeTrPhone(d.phone),
    address: d.address,
    city: d.city,
    district: d.district || null,
    zip_code: d.zip_code || null,
    updated_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  const { error } = await admin.from("billing_profiles").upsert(row, { onConflict: "shop_id" });
  if (error) {
    console.error("Fatura bilgileri kaydedilemedi:", error);
    return {
      success: false,
      error: error.code === "42P01" || /billing_profiles/.test(error.message)
        ? "Fatura bilgileri tablosu henüz oluşturulmamış. Lütfen yöneticinize bildirin."
        : "Fatura bilgileri kaydedilemedi.",
    };
  }

  revalidatePath("/settings/billing");
  return { success: true };
}

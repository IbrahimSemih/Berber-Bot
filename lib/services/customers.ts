import { createAdminClient } from "@/lib/supabase/admin";
import type { OwnerShop } from "@/lib/owner";
import { fail, UUID_RE, type ServiceResult } from "./result";

/**
 * KVKK silme talebi: müşterinin kişisel verileri (ad, telefon) anonimleştirilir.
 * Randevu geçmişi istatistikler için kalır ama artık kimseyle eşleşmez.
 * İleri tarihli aktif randevuları iptal edilir (silinen numaraya hatırlatma gitmesin).
 * Abonelik bitmiş olsa da çalışır: silme talebi yasal yükümlülüktür. RLS paywall'ı
 * kilitli dükkanda güncellemeye izin vermediği için sahiplik burada doğrulanıp
 * admin client kullanılır.
 */
export async function anonymizeCustomer(shop: Pick<OwnerShop, "id">, customerId: string): Promise<ServiceResult> {
  if (typeof customerId !== "string" || !UUID_RE.test(customerId)) return fail("invalid", "Geçersiz müşteri.");

  const admin = createAdminClient();

  const { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("shop_id", shop.id)
    .maybeSingle();
  if (!customer) return fail("not_found", "Müşteri bulunamadı.");

  const { error: cancelError } = await admin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("shop_id", shop.id)
    .eq("customer_id", customerId)
    .in("status", ["pending", "confirmed"])
    .gt("scheduled_at", new Date().toISOString());
  if (cancelError) return fail("error", "Müşterinin randevuları iptal edilemedi.");

  const { error: notesError } = await admin
    .from("appointments")
    .update({ notes: null })
    .eq("shop_id", shop.id)
    .eq("customer_id", customerId);
  if (notesError) return fail("error", "Randevu notları temizlenemedi.");

  const { error } = await admin
    .from("customers")
    .update({ name: "Silinmiş müşteri", phone: `silindi-${customerId}` })
    .eq("id", customerId)
    .eq("shop_id", shop.id);
  if (error) return fail("error", "Müşteri verileri silinemedi.");

  return { success: true };
}

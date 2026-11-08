import { createAdminClient } from "@/lib/supabase/admin";
import { fail, type ServiceResult } from "./result";

/**
 * Kullanıcıyı ve dükkanını siler. Çağıran, userId'nin oturumdaki kullanıcı olduğunu
 * doğrulamış olmalıdır. Mağaza (App Store / Google Play) aboneliği bununla iptal
 * olmaz; istemci silmeden önce kullanıcıyı uyarır.
 */
export async function deleteAccount(userId: string): Promise<ServiceResult> {
  const admin = createAdminClient();

  const { data: shops } = await admin.from("shops").select("id").eq("owner_id", userId);
  const shopIds = (shops ?? []).map((s) => s.id);

  // Sonuçlanmamış iade talebi varken hesap silinirse iade işlenemez
  if (shopIds.length > 0) {
    const { count: pendingRefunds } = await admin
      .from("payments")
      .select("id", { count: "exact", head: true })
      .in("shop_id", shopIds)
      .eq("status", "success")
      .not("refund_requested_at", "is", null)
      .is("refunded_at", null);
    if (pendingRefunds && pendingRefunds > 0) {
      return fail(
        "conflict",
        "Sonuçlanmamış bir iade talebiniz var. İade işlemi tamamlandıktan sonra hesabınızı silebilirsiniz."
      );
    }
  }

  // Dükkan ve bağlı veriler (randevu, müşteri, personel, push token...) silinir. Ödeme
  // kayıtları yasal saklama yükümlülüğü nedeniyle silinmez; shop_id NULL olur (ON DELETE SET NULL).
  if (shopIds.length > 0) {
    const { error: shopDeleteError } = await admin.from("shops").delete().in("id", shopIds);
    if (shopDeleteError) {
      console.error("Dükkan silinemedi:", shopDeleteError);
      return fail("error", "Dükkan verileri silinemedi. Lütfen destek ile iletişime geçin.");
    }
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Kullanıcı silinemedi:", error);
    return fail("error", "Hesap silinemedi. Lütfen destek ile iletişime geçin.");
  }

  return { success: true };
}

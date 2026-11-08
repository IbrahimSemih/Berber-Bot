"use server";

import { requireOwner } from "@/lib/owner";

// shopId parametreleri geriye dönük uyumluluk için duruyor; her zaman oturumdaki
// kullanıcının kendi dükkanı kullanılır. Bildirim işlemleri paywall'a takılmaz.

export async function markAsRead(notificationId: string) {
  const auth = await requireOwner();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, shop } = auth.ctx;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("shop_id", shop.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function markAllAsRead(_shopId: string) {
  const auth = await requireOwner();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, shop } = auth.ctx;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("shop_id", shop.id)
    .eq("is_read", false);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function clearAllNotifications(_shopId: string) {
  const auth = await requireOwner();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, shop } = auth.ctx;

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("shop_id", shop.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

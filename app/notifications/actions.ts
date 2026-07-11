"use server";

import { createClient } from "@/lib/supabase/server";

export async function markAsRead(notificationId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function markAllAsRead(shopId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("shop_id", shopId)
    .eq("is_read", false);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function clearAllNotifications(shopId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("shop_id", shopId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

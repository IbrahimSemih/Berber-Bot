"use server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount } from "@/lib/services/account";

export async function deleteAccountAction(userId: string) {
  // Kullanıcı yalnızca kendi hesabını silebilir
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || user.id !== userId) {
    return { success: false, error: "Yetkisiz işlem." };
  }

  const result = await deleteAccount(user.id);
  if (!result.success) return { success: false, error: result.error };

  // Çıkış: oturum çerezlerini temizle
  const cookieStore = cookies();
  cookieStore.getAll().forEach((cookie) => {
    cookieStore.delete(cookie.name);
  });

  return { success: true };
}

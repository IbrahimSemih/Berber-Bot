"use server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAccountAction(userId: string) {
  // Verify the caller is actually deleting their own account, not an arbitrary one.
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || user.id !== userId) {
    return { success: false, error: "Yetkisiz işlem." };
  }

  // We need the service role key to delete a user
  const supabaseAdmin = createAdminClient();

  // Clean up shop data first to be safe
  await supabaseAdmin.from("shops").delete().eq("owner_id", userId);

  // Delete user from auth layer
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }

  // Clear cookies to log out
  const cookieStore = cookies();
  cookieStore.getAll().forEach((cookie) => {
    cookieStore.delete(cookie.name);
  });

  return { success: true };
}

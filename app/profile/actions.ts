"use server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function deleteAccountAction(userId: string) {
  // We need the service role key to delete a user
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
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

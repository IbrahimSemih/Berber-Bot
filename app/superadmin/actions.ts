"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleShopStatus(shopId: string, currentStatus: string) {
  const supabase = createAdminClient();
  const newStatus = currentStatus === "banned" ? "active" : "banned";

  const { error } = await supabase
    .from("shops")
    .update({ status: newStatus })
    .eq("id", shopId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/superadmin/shops");
  revalidatePath("/superadmin");
  return { success: true };
}

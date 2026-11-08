"use server";

import { createClient } from "@/lib/supabase/server";
import { createShop, type CreateShopInput } from "@/lib/services/shop";

/** Dükkanı sunucuda oluşturur. Ayrıntılar: lib/services/shop.ts */
export async function createShopAction(input: CreateShopInput): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın." };

  const result = await createShop(user, input);
  return result.success ? { success: true } : { success: false, error: result.error };
}

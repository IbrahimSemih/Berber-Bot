"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getShopUsageAndLimits } from "@/lib/plan-limits";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getShopLimitsAction() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Yetkisiz erişim." };

  const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).single();
  if (!shop) return { error: "Dükkan bulunamadı." };

  try {
    const adminClient = createAdminClient();
    const limits = await getShopUsageAndLimits(adminClient, shop.id);
    return { data: limits };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Server Action'lar herkese açık POST uç noktalarıdır; middleware onları
// korumaz. İşletme sahibine ait her action, oturumu ve dükkanı buradan doğrular.
import { createClient } from "@/lib/supabase/server";
import { computeIsLocked } from "@/lib/plan-limits";

export type OwnerShop = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  status: string | null;
  subscription_status: string | null;
  trial_end: string | null;
  current_period_end: string | null;
};

export async function getOwnerContext() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, slug, owner_id, status, subscription_status, trial_end, current_period_end")
    .eq("owner_id", user.id)
    .single();
  if (!shop) return null;

  return { supabase, user, shop: shop as OwnerShop };
}

/** Oturum + dükkan + (isteğe bağlı) aktif abonelik kontrolü. Hata varsa mesaj döner. */
export async function requireOwner(options: { requireActive?: boolean } = {}) {
  const ctx = await getOwnerContext();
  if (!ctx) return { error: "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın." } as const;
  if (ctx.shop.status === "banned") return { error: "Hesabınız askıya alınmıştır." } as const;
  if (options.requireActive && computeIsLocked(ctx.shop)) {
    return { error: "Aboneliğinizin süresi dolmuş. Devam etmek için Fatura & Abonelik sayfasından ödeme yapın." } as const;
  }
  return { ctx } as const;
}

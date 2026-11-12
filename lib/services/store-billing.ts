// Mağaza (App Store / Google Play) aboneliğini dükkana işler. Hem RevenueCat
// webhook'u hem de mobil uygulamanın satın alma sonrası "senkronize et" isteği
// buradan geçer. Kaynak her zaman RevenueCat'teki güncel durumdur; istemcinin
// gönderdiği hiçbir abonelik bilgisine güvenilmez.
import type { SupabaseClient } from "@supabase/supabase-js";
import { deriveShopBilling, fetchSubscriber, isRevenueCatConfigured } from "@/lib/revenuecat";
import { isStoreProvider } from "@/lib/billing-config";
import { fail, type ServiceResult } from "./result";

export type ShopBillingState = {
  subscription_status: string;
  current_period_end: string | null;
  billing_provider: string | null;
  store_will_renew: boolean | null;
};

type ShopRow = ShopBillingState & { id: string };

/**
 * RevenueCat'ten dükkanın aboneliğini okuyup `shops` satırına yazar.
 * `admin` service role client olmalı (abonelik alanları istemciden korunur).
 */
export async function syncShopStoreBilling(
  admin: SupabaseClient,
  shopId: string
): Promise<ServiceResult<{ shop: ShopBillingState; changed: boolean }>> {
  if (!isRevenueCatConfigured()) return fail("error", "Mağaza aboneliği şu an doğrulanamıyor.");

  const { data: shop, error } = await admin
    .from("shops")
    .select("id, subscription_status, current_period_end, billing_provider, store_will_renew")
    .eq("id", shopId)
    .maybeSingle<ShopRow>();
  if (error) {
    console.error("[store-billing] dükkan okunamadı:", error);
    return fail("error", "Abonelik bilgisi okunamadı.");
  }
  if (!shop) return fail("not_found", "Dükkan bulunamadı.");

  let derived;
  try {
    derived = deriveShopBilling(await fetchSubscriber(shopId));
  } catch (err) {
    console.error("[store-billing] RevenueCat okunamadı:", err);
    return fail("error", "Mağaza aboneliği doğrulanamadı. Lütfen biraz sonra tekrar deneyin.");
  }

  const current: ShopBillingState = {
    subscription_status: shop.subscription_status,
    current_period_end: shop.current_period_end,
    billing_provider: shop.billing_provider,
    store_will_renew: shop.store_will_renew,
  };

  let next: Partial<ShopBillingState> | null = null;
  if (derived?.subscription_status === "active") {
    next = derived;
  } else if (isStoreProvider(shop.billing_provider) && shop.subscription_status === "active") {
    // Mağaza aboneliği bitti/iade edildi. iyzico ile ödenmiş aktif bir dönemi
    // ise mağaza durumu yüzünden kapatmayız (yalnızca kaynak mağazaysa).
    next = {
      subscription_status: "canceled",
      current_period_end: derived?.current_period_end ?? shop.current_period_end,
      store_will_renew: false,
    };
  }

  if (!next) return { success: true, shop: current, changed: false };

  const { data: updated, error: updateError } = await admin
    .from("shops")
    .update(next)
    .eq("id", shopId)
    .select("subscription_status, current_period_end, billing_provider, store_will_renew")
    .single<ShopBillingState>();
  if (updateError) {
    console.error("[store-billing] dükkan güncellenemedi:", updateError);
    return fail("error", "Abonelik bilgisi kaydedilemedi.");
  }
  return { success: true, shop: updated, changed: true };
}

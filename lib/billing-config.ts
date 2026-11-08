// Abonelik satış kanalı. Şirket kurulana kadar web'de (iyzico) satış kapalı;
// abonelikler mobil uygulamadan App Store / Google Play ile alınır
// (mobile_app_plan.md). iyzico kodu silinmedi: WEB_BILLING_ENABLED=true ile açılır.

/** Sunucu tarafı. Varsayılan: kapalı. */
export function isWebBillingEnabled(): boolean {
  return process.env.WEB_BILLING_ENABLED === "true";
}

/** Mağaza sayfaları (uygulama yayınlanınca doldurulur; boşsa "yakında" gösterilir). */
export const STORE_LINKS = {
  appStore: process.env.NEXT_PUBLIC_APP_STORE_URL || "",
  playStore: process.env.NEXT_PUBLIC_PLAY_STORE_URL || "",
};

export type BillingProvider = "iyzico" | "app_store" | "play_store";

export function isStoreProvider(provider: string | null | undefined): provider is "app_store" | "play_store" {
  return provider === "app_store" || provider === "play_store";
}

export function providerLabel(provider: string | null | undefined): string {
  if (provider === "app_store") return "App Store";
  if (provider === "play_store") return "Google Play";
  return "Kart (iyzico)";
}

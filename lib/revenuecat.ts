// RevenueCat (App Store / Google Play abonelikleri). Mobil uygulama
// app_user_id olarak dükkan id'sini kullanır (Purchases.logIn(shop.id)).
// Olay sırasına güvenmek yerine her seferinde RevenueCat'teki güncel durum
// okunur ve dükkana yazılır (mobile_app_plan.md §3.3).

/** RevenueCat panelindeki entitlement kimliği */
export const PRO_ENTITLEMENT = "pro";

const API_URL = "https://api.revenuecat.com/v1/subscribers";
const TIMEOUT_MS = 8000;

export type StoreName = "app_store" | "play_store";

type RcEntitlement = {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  product_identifier: string;
  purchase_date?: string;
};

type RcSubscription = {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  store: string;
  unsubscribe_detected_at?: string | null;
  billing_issues_detected_at?: string | null;
  is_sandbox?: boolean;
  refunded_at?: string | null;
};

export type RcSubscriber = {
  entitlements?: Record<string, RcEntitlement>;
  subscriptions?: Record<string, RcSubscription>;
};

export function isRevenueCatConfigured(): boolean {
  return !!process.env.REVENUECAT_SECRET_KEY;
}

/** RevenueCat'ten abonenin güncel durumunu okur. Abone yoksa RevenueCat boş kayıt döner. */
export async function fetchSubscriber(appUserId: string): Promise<RcSubscriber> {
  const key = process.env.REVENUECAT_SECRET_KEY;
  if (!key) throw new Error("REVENUECAT_SECRET_KEY tanımlı değil");
  const res = await fetch(`${API_URL}/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RevenueCat ${res.status}: ${await res.text().catch(() => "")}`);
  const json = (await res.json()) as { subscriber?: RcSubscriber };
  return json.subscriber ?? {};
}

/** Dükkana yazılacak abonelik alanları. null: mağaza aboneliği hiç yok (dokunma). */
export type StoreBilling = {
  subscription_status: "active" | "canceled";
  current_period_end: string | null;
  plan_id: "pro";
  billing_provider: StoreName;
  store_will_renew: boolean;
};

function laterOf(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return new Date(a) >= new Date(b) ? a : b;
}

/**
 * RevenueCat abone kaydından dükkanın abonelik alanlarını türetir (saf fonksiyon).
 * Ödeme sorunu (grace period) süresince erişim devam eder; süre bitince
 * `canceled` olur ve computeIsLocked dükkanı kilitler.
 */
export function deriveShopBilling(subscriber: RcSubscriber, now: Date = new Date()): StoreBilling | null {
  const ent = subscriber.entitlements?.[PRO_ENTITLEMENT];
  if (!ent) return null;

  const sub = subscriber.subscriptions?.[ent.product_identifier];
  const store = sub?.store;
  // Promosyon / Stripe gibi kaynaklar şimdilik kullanılmıyor
  if (store !== "app_store" && store !== "play_store") return null;

  const end = laterOf(laterOf(ent.expires_date, ent.grace_period_expires_date), sub?.grace_period_expires_date);
  const active = end === null || new Date(end) > now; // null: süresiz
  const willRenew = active && !sub?.unsubscribe_detected_at && !sub?.refunded_at;

  return {
    subscription_status: active ? "active" : "canceled",
    current_period_end: end,
    plan_id: "pro",
    billing_provider: store,
    store_will_renew: willRenew,
  };
}

/** Ürün kimliğinden faturalama aralığı (App Store: pro_yearly, Play: pro:yearly). */
export function intervalFromProductId(productId: string | null | undefined): "monthly" | "yearly" {
  return /year|annual/i.test(productId ?? "") ? "yearly" : "monthly";
}

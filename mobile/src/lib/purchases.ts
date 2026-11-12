// Uygulama içi abonelik (RevenueCat → App Store / Google Play). app_user_id
// dükkan id'sidir: abonelik dükkana bağlı olur, aynı dükkana iOS, Android ve
// web'den girişte geçerlidir. Abonelik durumu sunucuda RevenueCat'ten okunur
// (/api/mobile/v1/billing/sync ve webhook); istemci yalnızca satın almayı başlatır.
import { Platform } from "react-native";
import Purchases, { PURCHASES_ERROR_CODE, type PurchasesPackage } from "react-native-purchases";
import type { BillingSyncResponse } from "@shared/api-types";
import { apiFetch } from "./api";

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

/** Bu platformda satın alma yapılabilir mi (anahtar tanımlı, web değil). */
export const purchasesAvailable = Platform.OS !== "web" && !!API_KEY;

let configuredFor: string | null = null;

/** SDK'yı bu dükkan için hazırlar; farklı dükkanla girilmişse kimliği değiştirir. */
export async function ensurePurchases(shopId: string): Promise<void> {
  if (!purchasesAvailable) throw new Error("Uygulama içi satın alma bu sürümde kullanılamıyor.");
  if (configuredFor === shopId) return;
  if (configuredFor === null) {
    Purchases.configure({ apiKey: API_KEY!, appUserID: shopId });
  } else {
    await Purchases.logIn(shopId);
  }
  configuredFor = shopId;
}

/** Çıkışta: sonraki kullanıcı önceki dükkanın aboneliğini görmesin. */
export async function resetPurchases(): Promise<void> {
  if (!configuredFor) return;
  configuredFor = null;
  try {
    await Purchases.logOut();
  } catch {
    // Anonim kullanıcıda logOut hata verir; önemi yok
  }
}

export type PlanPackages = { monthly: PurchasesPackage | null; annual: PurchasesPackage | null };

/** RevenueCat'teki "default" offering'in aylık ve yıllık paketleri. */
export async function loadPackages(shopId: string): Promise<PlanPackages> {
  await ensurePurchases(shopId);
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  return { monthly: current?.monthly ?? null, annual: current?.annual ?? null };
}

/** Kullanıcı satın almayı kendisi iptal ettiyse true (hata gösterilmez). */
export function isPurchaseCancelled(err: unknown): boolean {
  const e = err as { code?: string; userCancelled?: boolean | null };
  return e?.userCancelled === true || e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export function purchaseErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      return "İnternet bağlantısı yok. Bağlantınızı kontrol edip tekrar deneyin.";
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return "Ödemeniz onay bekliyor. Onaylandığında aboneliğiniz otomatik başlar.";
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return "Bu abonelik zaten satın alınmış. \"Satın alımları geri yükle\"yi deneyin.";
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return "Bu cihazda satın alma yapılamıyor. Mağaza hesabınızı kontrol edin.";
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return "Mağazaya şu an ulaşılamıyor. Lütfen biraz sonra tekrar deneyin.";
    default:
      return "Satın alma tamamlanamadı. Lütfen tekrar deneyin.";
  }
}

export async function purchase(shopId: string, pkg: PurchasesPackage): Promise<void> {
  await ensurePurchases(shopId);
  await Purchases.purchasePackage(pkg);
}

export async function restore(shopId: string): Promise<boolean> {
  await ensurePurchases(shopId);
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active.pro;
}

/** Mağazanın abonelik yönetim sayfası (iptal, plan değişikliği). */
export async function openManageSubscription(shopId: string): Promise<void> {
  await ensurePurchases(shopId);
  await Purchases.showManageSubscriptions();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Satın alma sonrası sunucunun aboneliği işlemesini bekler. Mağaza onayı
 * RevenueCat'e birkaç saniyede düşebilir; ~12 sn boyunca tekrar dener.
 * Abonelik aktifse true.
 */
export async function syncAfterPurchase(): Promise<boolean> {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await apiFetch<BillingSyncResponse>("/billing/sync", { method: "POST" });
      if (res.shop.subscription_status === "active") return true;
    } catch {
      // ağ hatası: tekrar dene
    }
    await sleep(2000);
  }
  return false;
}

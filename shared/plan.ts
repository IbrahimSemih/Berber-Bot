// Plan, fiyat ve kilit kuralları. Web (middleware, randevu akışı, cron'lar) ve
// mobil uygulama aynı kuralları kullansın diye saf TypeScript olarak burada durur.
// Supabase sorgusu yapan kısım (getShopUsageAndLimits) lib/plan-limits.ts'te kalır.

export const PLANS = {
  starter: {
    id: "starter",
    name: "Başlangıç",
    price: 199,
    yearlyPrice: 1990,
    maxAppointments: 200,
    maxStaff: 1,
  },
  pro: {
    id: "pro",
    name: "Profesyonel",
    price: 349,
    yearlyPrice: 3490,
    maxAppointments: Infinity,
    maxStaff: Infinity,
  },
  franchise: {
    id: "franchise",
    name: "Franchise",
    price: 799,
    yearlyPrice: 7990,
    maxAppointments: Infinity,
    maxStaff: Infinity,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export type BillingInterval = "monthly" | "yearly";

// Yıllık plan: 12 ay yerine 10 ay öde (2 ay bedava). Yıllık ödemede ilk 30 gün koşulsuz iade.
export const YEARLY_REFUND_DAYS = 30;

// Ücretsiz deneme süresi (gün). Değiştirirseniz supabase-schema.sql içindeki
// protect_shop_billing_fields trigger'ındaki '7 days' değerini de güncelleyin.
export const TRIAL_DAYS = 7;

// Onaylı randevudan kaç saat önce müşteriye WhatsApp hatırlatması gider
// (settings.reminder_hours = 0 ise gönderilmez)
export const REMINDER_HOURS_BEFORE = 3;

// Abonelik bitişinden kaç gün önce sahibine hatırlatma e-postası gönderilsin
export const EXPIRY_REMINDER_DAYS = 3;

export type ShopBillingFields = {
  status?: string | null;
  subscription_status?: string | null;
  trial_end?: string | null;
  current_period_end?: string | null;
};

/**
 * Dükkanın paneli/randevu sayfası kilitli mi? Middleware, randevu akışı,
 * cron'lar ve mobil uygulama aynı kuralı kullansın diye tek yerde tutuluyor.
 * Veritabanındaki owns_active_shop() fonksiyonu bu kuralın SQL karşılığıdır.
 */
export function computeIsLocked(shop: ShopBillingFields, now: Date = new Date()): boolean {
  const isTrialing = shop.subscription_status === "trialing";
  const isActive = shop.subscription_status === "active";
  if (!isActive && !isTrialing) return true;

  if (isTrialing) {
    return !shop.trial_end || new Date(shop.trial_end) <= now;
  }
  // Aktif ama bitiş tarihi yoksa (eski kayıtlar) erişim açık kalır
  return !!shop.current_period_end && new Date(shop.current_period_end) <= now;
}

/** Erişimin biteceği an (deneme veya ücretli dönem sonu) */
export function getAccessEndDate(shop: ShopBillingFields): Date | null {
  const value = shop.subscription_status === "trialing" ? shop.trial_end : shop.current_period_end;
  return value ? new Date(value) : null;
}

export function parseBillingInterval(value: string | null | undefined): BillingInterval {
  return value === "yearly" ? "yearly" : "monthly";
}

export function getPlanPrice(planId: PlanId, interval: BillingInterval) {
  return interval === "yearly" ? PLANS[planId].yearlyPrice : PLANS[planId].price;
}

/** JSON'da Infinity yazılamaz; sınırsız limitler API'de null olarak gider. */
export function limitToJson(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

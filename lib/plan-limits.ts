import { SupabaseClient } from "@supabase/supabase-js";
import { istanbulToUtc, todayInIstanbul } from "@/lib/time";

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
  }
} as const;

export type PlanId = keyof typeof PLANS;

export type BillingInterval = "monthly" | "yearly";

// Yıllık plan: 12 ay yerine 10 ay öde (2 ay bedava). Yıllık ödemede ilk 30 gün koşulsuz iade.
export const YEARLY_REFUND_DAYS = 30;

// Ücretsiz deneme süresi (gün). Değiştirirseniz supabase-schema.sql içindeki
// protect_shop_billing_fields trigger'ındaki '7 days' değerini de güncelleyin.
export const TRIAL_DAYS = 7;

// Abonelik bitişinden kaç gün önce sahibine hatırlatma e-postası gönderilsin
export const EXPIRY_REMINDER_DAYS = 3;

export type ShopBillingFields = {
  status?: string | null;
  subscription_status?: string | null;
  trial_end?: string | null;
  current_period_end?: string | null;
};

/**
 * Dükkanın paneli/randevu sayfası kilitli mi? Middleware, randevu akışı ve
 * cron'lar aynı kuralı kullansın diye tek yerde tutuluyor.
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

export async function getShopUsageAndLimits(supabase: SupabaseClient, shopId: string) {
  // 1. Get shop details
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("plan_id, subscription_status, trial_end, current_period_end")
    .eq("id", shopId)
    .single();

  if (shopError || !shop) throw new Error("Dükkan bulunamadı.");

  const planId = (shop.plan_id || "pro") as PlanId;
  const plan = PLANS[planId] || PLANS.pro;

  // 2. Check lock status (Trial expired or subscription failed)
  const now = new Date();
  const isLocked = computeIsLocked(shop, now);

  // 3. Current month's appointment count (Türkiye saatine göre ay sınırları)
  const today = todayInIstanbul(now);
  const [year, month] = today.split("-").map(Number);
  const monthStartStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonthStartStr = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const startOfMonth = istanbulToUtc(monthStartStr, "00:00").toISOString();
  const endOfMonth = new Date(istanbulToUtc(nextMonthStartStr, "00:00").getTime() - 1).toISOString();

  const { count: appointmentCount } = await supabase
    .from("appointments")
    .select("*", { count: 'exact', head: true })
    .eq("shop_id", shopId)
    .gte("created_at", startOfMonth)
    .lte("created_at", endOfMonth);

  // 4. Current staff count
  const { count: staffCount } = await supabase
    .from("staff")
    .select("*", { count: 'exact', head: true })
    .eq("shop_id", shopId);

  const currentAppointments = appointmentCount || 0;
  const currentStaff = staffCount || 0;

  return {
    isLocked,
    plan,
    usage: {
      appointments: currentAppointments,
      staff: currentStaff,
    },
    limits: {
      appointments: plan.maxAppointments,
      staff: plan.maxStaff,
    },
    canAddAppointment: plan.maxAppointments === Infinity || currentAppointments < plan.maxAppointments,
    canAddStaff: plan.maxStaff === Infinity || currentStaff < plan.maxStaff,
  };
}

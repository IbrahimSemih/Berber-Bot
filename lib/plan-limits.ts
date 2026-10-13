import { SupabaseClient } from "@supabase/supabase-js";

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
  const isTrialing = shop.subscription_status === 'trialing';
  const isActive = shop.subscription_status === 'active';
  const now = new Date();
  
  const trialEnd = shop.trial_end ? new Date(shop.trial_end) : null;
  const currentPeriodEnd = shop.current_period_end ? new Date(shop.current_period_end) : null;
  
  const isTrialExpired = isTrialing && trialEnd && trialEnd < now;
  const isActiveExpired = isActive && currentPeriodEnd && currentPeriodEnd < now;
  
  const isLocked = (!isActive && !isTrialing) || isTrialExpired || isActiveExpired;

  // 3. Current month's appointment count
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

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

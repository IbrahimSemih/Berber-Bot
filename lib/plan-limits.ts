import { SupabaseClient } from "@supabase/supabase-js";
import { istanbulToUtc, todayInIstanbul } from "@/shared/time";
import { PLANS, computeIsLocked, type PlanId } from "@/shared/plan";

// Saf plan kuralları shared/plan.ts içinde (web ve mobil ortak). Bu dosya onları
// yeniden export eder ve Supabase sorgusu gerektiren kullanım hesabını tutar.
export * from "@/shared/plan";

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

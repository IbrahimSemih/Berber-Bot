import { createAdminClient } from "@/lib/supabase/admin";
import SuperAdminAnalyticsClient, {
  type PlatformAnalyticsData,
} from "./SuperAdminAnalyticsClient";

export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, number> = {
  starter: 199,
  pro: 349,
  business: 799,
};

const PLAN_COLORS: Record<string, string> = {
  starter: "#4a9eff",
  pro: "#c8f060",
  business: "#c77dff",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#4caf7d",
  trialing: "#4a9eff",
  past_due: "#ffaa33",
  canceled: "#ff5f57",
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Başlangıç",
  pro: "Pro",
  business: "İşletme",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  trialing: "Deneme",
  past_due: "Ödeme Gecikmiş",
  canceled: "İptal",
};

const MONTH_NAMES = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const DAY_NAMES = ["Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export default async function SuperAdminAnalyticsPage() {
  const supabase = createAdminClient();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // ─── Fetch all data in parallel ─────────────────────────────────────────────
  const [
    { count: totalShops },
    { data: allShops },
    { data: allAppointments },
  ] = await Promise.all([
    supabase.from("shops").select("*", { count: "exact", head: true }),
    supabase.from("shops").select("id, name, slug, created_at, status, plan_id, subscription_status"),
    supabase
      .from("appointments")
      .select("id, shop_id, scheduled_at, status, source, service:services(price)")
      .gte("scheduled_at", sixMonthsAgo.toISOString())
      .order("scheduled_at"),
  ]);

  const shops = allShops ?? [];
  const appointments = ((allAppointments ?? []) as unknown as Array<{
    id: string;
    shop_id: string;
    scheduled_at: string;
    status: string;
    source: string;
    service: { price: number }[] | null;
  }>).map((a) => ({
    ...a,
    service: Array.isArray(a.service) ? (a.service[0] ?? null) : a.service,
  }));

  // ─── Stat Cards ─────────────────────────────────────────────────────────────

  // New shops this month / last month
  const newShopsThisMonth = shops.filter(
    (s) => new Date(s.created_at) >= thisMonthStart
  ).length;

  const newShopsLastMonth = shops.filter((s) => {
    const d = new Date(s.created_at);
    return d >= lastMonthStart && d <= lastMonthEnd;
  }).length;

  // Appointments this month / last month
  const appointmentsThisMonth = appointments.filter(
    (a) => new Date(a.scheduled_at) >= thisMonthStart
  );
  const appointmentsLastMonth = appointments.filter((a) => {
    const d = new Date(a.scheduled_at);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  // MRR calculation
  const activeShops = shops.filter(
    (s) => s.subscription_status === "active" || s.subscription_status === "trialing"
  );
  const estimatedMRR = activeShops.reduce(
    (sum, s) => sum + (PLAN_PRICES[s.plan_id] || 290),
    0
  );

  // Last month MRR approximation (shops that existed last month with active status)
  const shopsLastMonth = shops.filter(
    (s) => new Date(s.created_at) <= lastMonthEnd &&
      (s.subscription_status === "active" || s.subscription_status === "trialing")
  );
  const lastMonthMRR = shopsLastMonth.reduce(
    (sum, s) => sum + (PLAN_PRICES[s.plan_id] || 290),
    0
  );

  // Active subscriptions
  const totalActiveSubscriptions = activeShops.length;

  // ─── Shop Growth Trend (last 6 months) ─────────────────────────────────────
  const shopGrowthTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const count = shops.filter((s) => {
      const d = new Date(s.created_at);
      return d >= monthDate && d <= monthEnd;
    }).length;
    shopGrowthTrend.push({
      label: MONTH_NAMES[monthDate.getMonth()],
      value: count,
    });
  }

  // ─── Appointment Volume Trend (last 6 months) ──────────────────────────────
  const appointmentVolumeTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const count = appointments.filter((a) => {
      const d = new Date(a.scheduled_at);
      return d >= monthDate && d <= monthEnd;
    }).length;
    appointmentVolumeTrend.push({
      label: MONTH_NAMES[monthDate.getMonth()],
      value: count,
    });
  }

  // ─── Plan Distribution ─────────────────────────────────────────────────────
  const planCounts = new Map<string, number>();
  shops.forEach((s) => {
    const plan = s.plan_id || "pro";
    planCounts.set(plan, (planCounts.get(plan) || 0) + 1);
  });
  const planDistribution = Array.from(planCounts.entries()).map(([plan, count]) => ({
    label: PLAN_LABELS[plan] || plan,
    value: count,
    color: PLAN_COLORS[plan] || "#5a5752",
  }));

  // ─── Subscription Status Distribution ──────────────────────────────────────
  const statusCounts = new Map<string, number>();
  shops.forEach((s) => {
    const status = s.subscription_status || "trialing";
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });
  const subscriptionStatusDistribution = Array.from(statusCounts.entries()).map(
    ([status, count]) => ({
      label: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || "#5a5752",
    })
  );

  // ─── Source Analysis ───────────────────────────────────────────────────────
  const whatsappCount = appointments.filter((a) => a.source === "whatsapp").length;
  const manualCount = appointments.filter((a) => a.source === "manual").length;

  // ─── Weekday Distribution ──────────────────────────────────────────────────
  const weekdayCounts = new Array(7).fill(0);
  appointments.forEach((a) => {
    const day = new Date(a.scheduled_at).getDay();
    weekdayCounts[day]++;
  });
  // Reorder to start from Monday
  const weekdayDistribution = [1, 2, 3, 4, 5, 6, 0].map((dayIndex) => ({
    label: DAY_NAMES[dayIndex],
    value: weekdayCounts[dayIndex],
  }));

  // ─── Cancellation Rate ────────────────────────────────────────────────────
  const cancelledThisMonth = appointmentsThisMonth.filter(
    (a) => a.status === "cancelled"
  ).length;
  const cancellationRate =
    appointmentsThisMonth.length > 0
      ? (cancelledThisMonth / appointmentsThisMonth.length) * 100
      : 0;

  const cancelledLastMonth = appointmentsLastMonth.filter(
    (a) => a.status === "cancelled"
  ).length;
  const lastMonthCancellationRate =
    appointmentsLastMonth.length > 0
      ? (cancelledLastMonth / appointmentsLastMonth.length) * 100
      : 0;

  // ─── Churn Rate ────────────────────────────────────────────────────────────
  // Shops that canceled in the last 30 days / total shops with active/trialing
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const canceledShops = shops.filter(
    (s) => s.subscription_status === "canceled"
  ).length;
  const totalNonCanceled = shops.filter(
    (s) => s.subscription_status !== "canceled"
  ).length;
  const churnRate =
    totalNonCanceled + canceledShops > 0
      ? (canceledShops / (totalNonCanceled + canceledShops)) * 100
      : 0;

  // ─── Avg Appointments Per Shop ─────────────────────────────────────────────
  const avgAppointmentsPerShop =
    (totalShops || 0) > 0
      ? appointmentsThisMonth.length / (totalShops || 1)
      : 0;

  // ─── Top Shops Performance ─────────────────────────────────────────────────
  const shopAppointmentMap = new Map<
    string,
    { count: number; revenue: number }
  >();
  appointments.forEach((a) => {
    const existing = shopAppointmentMap.get(a.shop_id) || {
      count: 0,
      revenue: 0,
    };
    existing.count++;
    if (a.status === "confirmed" || a.status === "completed") {
      existing.revenue += a.service?.price ?? 0;
    }
    shopAppointmentMap.set(a.shop_id, existing);
  });

  const topShops = shops
    .map((s) => {
      const stats = shopAppointmentMap.get(s.id) || { count: 0, revenue: 0 };
      return {
        name: s.name,
        appointmentCount: stats.count,
        revenue: stats.revenue,
        createdAt: s.created_at,
        status: s.status || "active",
        subscriptionStatus: s.subscription_status || "trialing",
      };
    })
    .sort((a, b) => b.appointmentCount - a.appointmentCount)
    .slice(0, 10);

  // ─── Assemble Data ─────────────────────────────────────────────────────────
  const analyticsData: PlatformAnalyticsData = {
    totalShops: totalShops || 0,
    newShopsThisMonth,
    newShopsLastMonth,
    totalAppointmentsThisMonth: appointmentsThisMonth.length,
    totalAppointmentsLastMonth: appointmentsLastMonth.length,
    estimatedMRR,
    lastMonthMRR,
    shopGrowthTrend,
    appointmentVolumeTrend,
    planDistribution,
    subscriptionStatusDistribution,
    sourceAnalysis: { whatsapp: whatsappCount, manual: manualCount },
    weekdayDistribution,
    topShops,
    cancellationRate,
    lastMonthCancellationRate,
    churnRate,
    avgAppointmentsPerShop,
    totalActiveSubscriptions,
  };

  return <SuperAdminAnalyticsClient data={analyticsData} />;
}

import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, number> = {
  starter: 199,
  pro: 349,
  business: 799,
};

export default async function SuperAdminDashboard() {
  const supabase = createAdminClient();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch data in parallel
  const [
    { count: totalShops },
    { count: totalAppointments },
    { data: recentShops },
    { data: allShops },
    { count: appointmentsThisMonth },
    { count: appointmentsLastMonth },
    { count: appointmentsLast7Days },
  ] = await Promise.all([
    supabase.from("shops").select("*", { count: "exact", head: true }),
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("shops").select("id, name, created_at, status, subscription_status, plan_id").order("created_at", { ascending: false }).limit(5),
    supabase.from("shops").select("id, plan_id, subscription_status, created_at"),
    supabase.from("appointments").select("*", { count: "exact", head: true }).gte("scheduled_at", thisMonthStart.toISOString()),
    supabase.from("appointments").select("*", { count: "exact", head: true }).gte("scheduled_at", lastMonthStart.toISOString()).lte("scheduled_at", lastMonthEnd.toISOString()),
    supabase.from("appointments").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo.toISOString()),
  ]);

  const shops = allShops ?? [];

  // MRR from actual plan prices
  const activeShops = shops.filter(
    (s) => s.subscription_status === "active" || s.subscription_status === "trialing"
  );
  const estimatedMRR = activeShops.reduce(
    (sum, s) => sum + (PLAN_PRICES[s.plan_id] || 290),
    0
  );

  // New shops this month
  const newShopsThisMonth = shops.filter(
    (s) => new Date(s.created_at) >= thisMonthStart
  ).length;

  // Active subscriptions
  const activeSubscriptions = activeShops.length;

  // Appointment growth
  const aptThisMonth = appointmentsThisMonth || 0;
  const aptLastMonth = appointmentsLastMonth || 0;
  const aptGrowth = aptLastMonth > 0
    ? Math.round(((aptThisMonth - aptLastMonth) / aptLastMonth) * 100)
    : aptThisMonth > 0 ? 100 : 0;

  return (
    <div className="p-6 sm:p-10 max-w-6xl w-full mx-auto relative z-10">
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-bold mb-2">Genel Bakış</h1>
        <p className="text-sm font-medium" style={{ color: "var(--text2)" }}>Sistemin genel istatistikleri ve son durum özeti.</p>
      </div>

      {/* ─── Main Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {[
          { label: "Toplam Dükkan", value: totalShops || 0, icon: "🏪", subtitle: `${newShopsThisMonth} yeni bu ay` },
          { label: "Toplam Randevu", value: (totalAppointments || 0).toLocaleString("tr-TR"), icon: "📅", subtitle: `Son 7 gün: ${appointmentsLast7Days || 0}` },
          { label: "Tahmini MRR", value: `${estimatedMRR.toLocaleString("tr-TR")} ₺`, icon: "💰", accent: true, subtitle: `${activeSubscriptions} aktif abonelik` },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border relative overflow-hidden group" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, var(--accent-dim2), transparent 70%)" }} />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "var(--bg3)" }}>{stat.icon}</div>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-1 relative z-10" style={{ color: "var(--text3)" }}>{stat.label}</div>
            <div className="text-4xl font-heading font-black relative z-10" style={{ color: stat.accent ? "var(--accent)" : "var(--text)" }}>{stat.value}</div>
            {stat.subtitle && <div className="text-[11px] mt-2 font-medium relative z-10" style={{ color: "var(--text3)" }}>{stat.subtitle}</div>}
          </div>
        ))}
      </div>

      {/* ─── Secondary Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <MiniStatCard icon="🆕" label="Yeni Dükkan (Bu Ay)" value={newShopsThisMonth} />
        <MiniStatCard icon="✅" label="Aktif Abonelik" value={activeSubscriptions} />
        <MiniStatCard
          icon="📈"
          label="Randevu Büyümesi"
          value={`${aptGrowth >= 0 ? "+" : ""}${aptGrowth}%`}
          color={aptGrowth >= 0 ? "var(--green)" : "var(--red)"}
        />
        <MiniStatCard icon="📅" label="Son 7 Gün Randevu" value={appointmentsLast7Days || 0} />
      </div>

      {/* ─── Quick Link to Analytics ─── */}
      <Link
        href="/superadmin/analytics"
        className="block mb-8 p-5 rounded-2xl border group relative overflow-hidden transition-all"
        style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--accent-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "var(--accent-dim)" }}>
              📈
            </div>
            <div>
              <div className="text-sm font-heading font-bold">Platform Analitiği</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>Detaylı büyüme trendleri, plan dağılımı, churn rate ve daha fazlası</div>
            </div>
          </div>
          <span className="text-lg group-hover:translate-x-1 transition-transform" style={{ color: "var(--text3)" }}>→</span>
        </div>
      </Link>

      {/* ─── Recent Shops Table ─── */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-heading font-bold text-lg">Son Eklenen Dükkanlar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: "var(--bg3)", color: "var(--text2)" }}>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b" style={{ borderColor: "var(--border)" }}>Dükkan Adı</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b" style={{ borderColor: "var(--border)" }}>Durum</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b" style={{ borderColor: "var(--border)" }}>Abonelik</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b" style={{ borderColor: "var(--border)" }}>Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {recentShops && recentShops.length > 0 ? (
                recentShops.map((shop) => (
                  <tr key={shop.id} className="transition-colors hover:bg-white/5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-6 py-5 text-sm font-medium">{shop.name}</td>
                    <td className="px-6 py-5 text-sm">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold" style={{ 
                        background: shop.status === 'banned' ? 'rgba(255, 95, 87, 0.1)' : 'var(--accent-dim)',
                        color: shop.status === 'banned' ? 'var(--red)' : 'var(--accent)'
                      }}>
                        {shop.status === 'banned' ? 'Banlı' : 'Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <SubscriptionBadge status={shop.subscription_status} />
                    </td>
                    <td className="px-6 py-5 text-sm font-medium" style={{ color: "var(--text2)" }}>
                      {new Date(shop.created_at).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm font-medium" style={{ color: "var(--text3)" }}>
                    Henüz kayıtlı dükkan yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sub Components ───────────────────────────────────────────────────────────

function MiniStatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-3 border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: "var(--bg3)" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: "var(--text3)" }}>{label}</div>
        <div className="font-heading font-black text-lg" style={{ color: color || "var(--text)" }}>{value}</div>
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(76, 175, 125, 0.1)", color: "#4caf7d", label: "Aktif" },
  trialing: { bg: "rgba(74, 158, 255, 0.1)", color: "#4a9eff", label: "Deneme" },
  past_due: { bg: "rgba(255, 170, 51, 0.1)", color: "#ffaa33", label: "Gecikmiş" },
  canceled: { bg: "rgba(255, 95, 87, 0.1)", color: "#ff5f57", label: "İptal" },
};

function SubscriptionBadge({ status }: { status: string | null }) {
  const style = STATUS_STYLES[status || "trialing"] || STATUS_STYLES.trialing;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: style.bg, color: style.color }}>
      {style.label}
    </span>
  );
}

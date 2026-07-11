"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { StatCard, Card, CardHeader, PageHeader } from "@/components/ui";
import BarChart from "@/components/charts/BarChart";
import AreaChart from "@/components/charts/AreaChart";
import DonutChart from "@/components/charts/DonutChart";

interface RawAppointment {
  id: string;
  scheduled_at: string;
  status: string;
  source: string;
  service_id: string;
  staff_id: string | null;
  service: { name: string; price: number } | null;
  staff: { name: string } | null;
}

interface WeeklyData {
  label: string;
  value: number;
  value2: number;
}

interface MonthlyRevenue {
  label: string;
  value: number;
}

interface ServiceDist {
  label: string;
  value: number;
  color: string;
}

interface StaffPerf {
  name: string;
  count: number;
  revenue: number;
}

const DONUT_COLORS = [
  "#c8f060", "#4a9eff", "#ff5f57", "#ffaa33", "#c77dff",
  "#4caf7d", "#ff6b9d", "#ffd93d", "#6bcb77", "#4d96ff",
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [allApts, setAllApts] = useState<RawAppointment[]>([]);

  // Computed stats
  const [thisMonthCount, setThisMonthCount] = useState(0);
  const [lastMonthCount, setLastMonthCount] = useState(0);
  const [thisMonthRevenue, setThisMonthRevenue] = useState(0);
  const [lastMonthRevenue, setLastMonthRevenue] = useState(0);
  const [noShowRate, setNoShowRate] = useState(0);
  const [lastNoShowRate, setLastNoShowRate] = useState(0);
  const [avgDaily, setAvgDaily] = useState(0);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlyRevData, setMonthlyRevData] = useState<MonthlyRevenue[]>([]);
  const [serviceDist, setServiceDist] = useState<ServiceDist[]>([]);
  const [sourceData, setSourceData] = useState<{ whatsapp: number; manual: number }>({ whatsapp: 0, manual: 0 });
  const [staffPerf, setStaffPerf] = useState<StaffPerf[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).single();
    if (!shop) {
      setLoading(false);
      return;
    }

    // Fetch last 6 months of appointments
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status, source, service_id, staff_id, service:services(name, price), staff:staff(name)")
      .eq("shop_id", shop.id)
      .gte("scheduled_at", sixMonthsAgo.toISOString())
      .order("scheduled_at");

    const apts = (appointments as unknown as RawAppointment[]) ?? [];
    setAllApts(apts);
    computeStats(apts);
    setLoading(false);
  }

  function computeStats(apts: RawAppointment[]) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // --- This month vs last month ---
    const thisMonth = apts.filter((a) => new Date(a.scheduled_at) >= thisMonthStart);
    const lastMonth = apts.filter((a) => {
      const d = new Date(a.scheduled_at);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const tmCount = thisMonth.length;
    const lmCount = lastMonth.length;
    setThisMonthCount(tmCount);
    setLastMonthCount(lmCount);

    // Revenue
    const tmRev = thisMonth
      .filter((a) => a.status === "confirmed" || a.status === "completed")
      .reduce((sum, a) => sum + (a.service?.price ?? 0), 0);
    const lmRev = lastMonth
      .filter((a) => a.status === "confirmed" || a.status === "completed")
      .reduce((sum, a) => sum + (a.service?.price ?? 0), 0);
    setThisMonthRevenue(tmRev);
    setLastMonthRevenue(lmRev);

    // No-show rate
    const tmCancelled = thisMonth.filter((a) => a.status === "cancelled").length;
    const lmCancelled = lastMonth.filter((a) => a.status === "cancelled").length;
    setNoShowRate(tmCount > 0 ? (tmCancelled / tmCount) * 100 : 0);
    setLastNoShowRate(lmCount > 0 ? (lmCancelled / lmCount) * 100 : 0);

    // Avg daily (this month)
    const dayOfMonth = now.getDate();
    setAvgDaily(dayOfMonth > 0 ? Math.round((tmCount / dayOfMonth) * 10) / 10 : 0);

    // --- Weekly data (last 4 weeks) ---
    computeWeekly(apts, now);

    // --- Monthly revenue (last 6 months) ---
    computeMonthlyRevenue(apts, now);

    // --- Service distribution ---
    computeServiceDist(apts);

    // --- Source analysis ---
    const whatsappCount = apts.filter((a) => a.source === "whatsapp").length;
    const manualCount = apts.filter((a) => a.source === "manual").length;
    setSourceData({ whatsapp: whatsappCount, manual: manualCount });

    // --- Staff performance ---
    computeStaffPerf(apts);
  }

  function computeWeekly(apts: RawAppointment[], now: Date) {
    const weeks: WeeklyData[] = [];
    const dayNames = ["Pzr", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

    // Get start of current week (Monday)
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Show current week day by day
    for (let d = 0; d < 7; d++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(dayStart.getDate() + d);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayApts = apts.filter((a) => {
        const dt = new Date(a.scheduled_at);
        return dt >= dayStart && dt <= dayEnd;
      });

      const confirmed = dayApts.filter((a) => a.status === "confirmed" || a.status === "completed").length;
      const cancelled = dayApts.filter((a) => a.status === "cancelled").length;

      weeks.push({
        label: dayNames[dayStart.getDay()],
        value: confirmed,
        value2: cancelled,
      });
    }

    setWeeklyData(weeks);
  }

  function computeMonthlyRevenue(apts: RawAppointment[], now: Date) {
    const months: MonthlyRevenue[] = [];
    const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthApts = apts.filter((a) => {
        const d = new Date(a.scheduled_at);
        return d >= monthDate && d <= monthEnd && (a.status === "confirmed" || a.status === "completed");
      });

      const rev = monthApts.reduce((sum, a) => sum + (a.service?.price ?? 0), 0);
      months.push({
        label: monthNames[monthDate.getMonth()],
        value: rev,
      });
    }

    setMonthlyRevData(months);
  }

  function computeServiceDist(apts: RawAppointment[]) {
    const serviceMap = new Map<string, number>();

    apts.forEach((a) => {
      const name = a.service?.name ?? "Bilinmiyor";
      serviceMap.set(name, (serviceMap.get(name) ?? 0) + 1);
    });

    const sorted = Array.from(serviceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    setServiceDist(
      sorted.map(([label, value], i) => ({
        label,
        value,
        color: DONUT_COLORS[i % DONUT_COLORS.length],
      }))
    );
  }

  function computeStaffPerf(apts: RawAppointment[]) {
    const staffMap = new Map<string, { count: number; revenue: number }>();

    apts
      .filter((a) => a.status === "confirmed" || a.status === "completed")
      .forEach((a) => {
        const name = a.staff?.name ?? "Atanmamış";
        const existing = staffMap.get(name) ?? { count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += a.service?.price ?? 0;
        staffMap.set(name, existing);
      });

    const sorted = Array.from(staffMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    setStaffPerf(sorted);
  }

  function pctChange(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? "+100%" : "—";
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${Math.round(change)}% geçen aya göre`;
  }

  if (loading) {
    return (
      <AdminLayout>
        <PageHeader title="Analitik" />
        <div className="p-7">
          <div className="flex items-center justify-center py-20">
            <div className="text-sm" style={{ color: "var(--text3)" }}>Veriler yükleniyor...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader title="Analitik">
        <span className="hidden sm:inline text-sm" style={{ color: "var(--text3)" }}>
          Son 6 aylık veriler
        </span>
      </PageHeader>

      <div className="p-4 sm:p-7 space-y-6">
        {/* ─── Stat Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Bu Ay Randevu"
            value={thisMonthCount}
            change={pctChange(thisMonthCount, lastMonthCount)}
            changeDir={thisMonthCount >= lastMonthCount ? "up" : "down"}
            icon="📅"
          />
          <StatCard
            label="İptal Oranı"
            value={`%${Math.round(noShowRate)}`}
            change={pctChange(noShowRate, lastNoShowRate)}
            changeDir={noShowRate <= lastNoShowRate ? "up" : "down"}
            icon="🚫"
          />
          <StatCard
            label="Bu Ay Gelir"
            value={`₺${thisMonthRevenue.toLocaleString("tr-TR")}`}
            change={pctChange(thisMonthRevenue, lastMonthRevenue)}
            changeDir={thisMonthRevenue >= lastMonthRevenue ? "up" : "down"}
            icon="💰"
          />
          <StatCard
            label="Günlük Ortalama"
            value={avgDaily}
            change="Bu ay ortalaması"
            icon="📊"
          />
        </div>

        {/* ─── Charts Row 1 ─── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Appointments */}
          <Card>
            <CardHeader title="Bu Hafta Randevular" />
            <div className="p-4 sm:p-5">
              <BarChart
                data={weeklyData}
                height={240}
                barColor="var(--accent)"
                barColor2="var(--red)"
                label1="Onaylı"
                label2="İptal"
              />
            </div>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card>
            <CardHeader title="Aylık Gelir Trendi" />
            <div className="p-4 sm:p-5">
              <AreaChart
                data={monthlyRevData}
                height={240}
                color="var(--accent)"
                formatValue={(v) => `₺${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}${v >= 1000 ? "K" : ""}`}
              />
            </div>
          </Card>
        </div>

        {/* ─── Charts Row 2 ─── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Service Distribution */}
          <Card>
            <CardHeader title="Hizmet Dağılımı" />
            <div className="p-4 sm:p-6 flex justify-center">
              <DonutChart
                data={serviceDist}
                centerLabel="Toplam"
                centerValue={allApts.length.toString()}
              />
            </div>
          </Card>

          {/* Source Analysis */}
          <Card>
            <CardHeader title="Kaynak Analizi" />
            <div className="p-4 sm:p-5 space-y-5">
              <div className="space-y-4">
                {/* WhatsApp */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💬</span>
                      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>WhatsApp</span>
                    </div>
                    <span className="text-sm font-bold font-syne" style={{ color: "var(--accent)" }}>
                      {sourceData.whatsapp}
                      <span className="text-xs font-normal ml-1" style={{ color: "var(--text3)" }}>
                        ({allApts.length > 0 ? Math.round((sourceData.whatsapp / allApts.length) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg3)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${allApts.length > 0 ? (sourceData.whatsapp / allApts.length) * 100 : 0}%`,
                        background: "linear-gradient(90deg, var(--accent), #a8d040)",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Manual */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">✏️</span>
                      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>Manuel</span>
                    </div>
                    <span className="text-sm font-bold font-syne" style={{ color: "var(--blue)" }}>
                      {sourceData.manual}
                      <span className="text-xs font-normal ml-1" style={{ color: "var(--text3)" }}>
                        ({allApts.length > 0 ? Math.round((sourceData.manual / allApts.length) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg3)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${allApts.length > 0 ? (sourceData.manual / allApts.length) * 100 : 0}%`,
                        background: "linear-gradient(90deg, var(--blue), #3a7acc)",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text3)" }}>Toplam Randevu</span>
                  <span className="font-bold font-syne">{allApts.length}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ─── Staff Performance ─── */}
        {staffPerf.length > 0 && (
          <Card>
            <CardHeader title="Personel Performansı" />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr style={{ background: "var(--bg3)" }}>
                    {["Personel", "Randevu Sayısı", "Toplam Gelir", "Ort. Gelir/Randevu"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide"
                        style={{ color: "var(--text3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffPerf.map((sp, i) => (
                    <tr key={sp.name} className="transition-colors"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-syne flex-shrink-0"
                            style={{
                              background: DONUT_COLORS[i % DONUT_COLORS.length] + "20",
                              color: DONUT_COLORS[i % DONUT_COLORS.length],
                            }}>
                            {sp.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium">{sp.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-syne font-bold">{sp.count}</td>
                      <td className="px-5 py-3.5 text-sm font-syne font-bold" style={{ color: "var(--accent)" }}>
                        ₺{sp.revenue.toLocaleString("tr-TR")}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text2)" }}>
                        ₺{sp.count > 0 ? Math.round(sp.revenue / sp.count).toLocaleString("tr-TR") : 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

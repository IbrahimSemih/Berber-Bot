"use client";

import BarChart from "@/components/charts/BarChart";
import AreaChart from "@/components/charts/AreaChart";
import DonutChart from "@/components/charts/DonutChart";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartData {
  label: string;
  value: number;
}

interface ChartData2 {
  label: string;
  value: number;
  value2?: number;
}

interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface ShopPerformance {
  name: string;
  appointmentCount: number;
  revenue: number;
  createdAt: string;
  status: string;
  subscriptionStatus: string;
}

export interface PlatformAnalyticsData {
  // Stat cards
  totalShops: number;
  newShopsThisMonth: number;
  newShopsLastMonth: number;
  totalAppointmentsThisMonth: number;
  totalAppointmentsLastMonth: number;
  estimatedMRR: number;
  lastMonthMRR: number;

  // Charts
  shopGrowthTrend: ChartData[];
  appointmentVolumeTrend: ChartData[];
  planDistribution: DonutData[];
  subscriptionStatusDistribution: DonutData[];
  sourceAnalysis: { whatsapp: number; manual: number };
  weekdayDistribution: ChartData2[];

  // Table
  topShops: ShopPerformance[];

  // Mini stats
  cancellationRate: number;
  lastMonthCancellationRate: number;
  churnRate: number;
  avgAppointmentsPerShop: number;
  totalActiveSubscriptions: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  starter: "#4a9eff",
  pro: "#c8f060",
  business: "#c77dff",
  Bilinmiyor: "#5a5752",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#4caf7d",
  trialing: "#4a9eff",
  past_due: "#ffaa33",
  canceled: "#ff5f57",
  Bilinmiyor: "#5a5752",
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

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "—";
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${Math.round(change)}% geçen aya göre`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuperAdminAnalyticsClient({ data }: { data: PlatformAnalyticsData }) {
  const [shopSort, setShopSort] = useState<"appointments" | "revenue">("appointments");

  const sortedShops = [...data.topShops].sort((a, b) =>
    shopSort === "appointments"
      ? b.appointmentCount - a.appointmentCount
      : b.revenue - a.revenue
  );

  const totalSource = data.sourceAnalysis.whatsapp + data.sourceAnalysis.manual;

  return (
    <div className="p-6 sm:p-10 max-w-7xl w-full mx-auto relative z-10">
      {/* ─── Page Header ─── */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Platform Analitiği</h1>
        <p className="text-sm font-medium" style={{ color: "var(--text2)" }}>
          Tüm platformun genel istatistikleri, büyüme trendleri ve performans metrikleri.
        </p>
      </div>

      {/* ─── Top Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Toplam Dükkan"
          value={data.totalShops}
          icon="🏪"
        />
        <StatCard
          label="Yeni Dükkan (Bu Ay)"
          value={data.newShopsThisMonth}
          change={pctChange(data.newShopsThisMonth, data.newShopsLastMonth)}
          changeDir={data.newShopsThisMonth >= data.newShopsLastMonth ? "up" : "down"}
          icon="🆕"
        />
        <StatCard
          label="Randevu (Bu Ay)"
          value={data.totalAppointmentsThisMonth.toLocaleString("tr-TR")}
          change={pctChange(data.totalAppointmentsThisMonth, data.totalAppointmentsLastMonth)}
          changeDir={data.totalAppointmentsThisMonth >= data.totalAppointmentsLastMonth ? "up" : "down"}
          icon="📅"
        />
        <StatCard
          label="Tahmini MRR"
          value={`₺${data.estimatedMRR.toLocaleString("tr-TR")}`}
          change={pctChange(data.estimatedMRR, data.lastMonthMRR)}
          changeDir={data.estimatedMRR >= data.lastMonthMRR ? "up" : "down"}
          icon="💰"
          accent
        />
      </div>

      {/* ─── Mini Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MiniStat label="Aktif Abonelik" value={data.totalActiveSubscriptions} icon="✅" />
        <MiniStat label="Ort. Randevu/Dükkan" value={data.avgAppointmentsPerShop.toFixed(1)} icon="📊" />
        <MiniStat
          label="İptal Oranı"
          value={`%${data.cancellationRate.toFixed(1)}`}
          icon="🚫"
          color={data.cancellationRate > 20 ? "var(--red)" : data.cancellationRate > 10 ? "var(--orange)" : "var(--green)"}
        />
        <MiniStat
          label="Churn Rate"
          value={`%${data.churnRate.toFixed(1)}`}
          icon="📉"
          color={data.churnRate > 10 ? "var(--red)" : data.churnRate > 5 ? "var(--orange)" : "var(--green)"}
        />
      </div>

      {/* ─── Growth Charts Row ─── */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Shop Growth Trend */}
        <Card>
          <CardHeader title="Dükkan Büyüme Trendi" subtitle="Son 6 ay" />
          <div className="p-4 sm:p-5">
            <AreaChart
              data={data.shopGrowthTrend}
              height={240}
              color="var(--accent)"
              gradientId="shopGrowthGrad"
            />
          </div>
        </Card>

        {/* Appointment Volume Trend */}
        <Card>
          <CardHeader title="Aylık Randevu Hacmi" subtitle="Son 6 ay" />
          <div className="p-4 sm:p-5">
            <BarChart
              data={data.appointmentVolumeTrend}
              height={240}
              barColor="var(--blue)"
            />
          </div>
        </Card>
      </div>

      {/* ─── Distribution Charts Row ─── */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Plan Distribution */}
        <Card>
          <CardHeader title="Plan Dağılımı" />
          <div className="p-4 sm:p-6 flex justify-center">
            <DonutChart
              data={data.planDistribution}
              centerLabel="Toplam"
              centerValue={data.totalShops.toString()}
            />
          </div>
        </Card>

        {/* Subscription Status Distribution */}
        <Card>
          <CardHeader title="Abonelik Durumu" />
          <div className="p-4 sm:p-6 flex justify-center">
            <DonutChart
              data={data.subscriptionStatusDistribution}
              centerLabel="Dükkan"
              centerValue={data.totalShops.toString()}
            />
          </div>
        </Card>
      </div>

      {/* ─── Source & Weekday Row ─── */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Source Analysis */}
        <Card>
          <CardHeader title="Kaynak Analizi" subtitle="Platform geneli" />
          <div className="p-4 sm:p-5 space-y-5">
            <div className="space-y-4">
              {/* WhatsApp */}
              <SourceBar
                icon="💬"
                label="WhatsApp"
                count={data.sourceAnalysis.whatsapp}
                total={totalSource}
                color="var(--accent)"
                gradientEnd="#a8d040"
              />
              {/* Manual */}
              <SourceBar
                icon="✏️"
                label="Manuel"
                count={data.sourceAnalysis.manual}
                total={totalSource}
                color="var(--blue)"
                gradientEnd="#3a7acc"
              />
            </div>
            <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--text3)" }}>Toplam Randevu</span>
                <span className="font-bold font-heading">{totalSource.toLocaleString("tr-TR")}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Weekday Distribution */}
        <Card>
          <CardHeader title="Haftalık Yoğunluk" subtitle="En çok randevu alınan günler" />
          <div className="p-4 sm:p-5">
            <BarChart
              data={data.weekdayDistribution}
              height={240}
              barColor="var(--accent)"
            />
          </div>
        </Card>
      </div>

      {/* ─── Top Shops Table ─── */}
      <Card>
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h3 className="font-heading font-bold text-base">En Aktif Dükkanlar</h3>
            <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>Tüm zamanlar — en yüksek performans gösteren dükkanlar</p>
          </div>
          <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--bg3)" }}>
            <button
              onClick={() => setShopSort("appointments")}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: shopSort === "appointments" ? "var(--accent)" : "transparent",
                color: shopSort === "appointments" ? "#0a0a0a" : "var(--text3)",
              }}
            >
              Randevu
            </button>
            <button
              onClick={() => setShopSort("revenue")}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: shopSort === "revenue" ? "var(--accent)" : "transparent",
                color: shopSort === "revenue" ? "#0a0a0a" : "var(--text3)",
              }}
            >
              Gelir
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr style={{ background: "var(--bg3)", color: "var(--text2)" }}>
                {["#", "Dükkan", "Durum", "Plan", "Randevu", "Gelir", "Kayıt Tarihi"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedShops.length > 0 ? (
                sortedShops.map((shop, i) => (
                  <tr
                    key={shop.name + i}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-4 text-sm font-heading font-bold" style={{ color: "var(--text3)" }}>
                      {i + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black font-heading flex-shrink-0"
                          style={{
                            background: "var(--accent-dim)",
                            color: "var(--accent)",
                          }}
                        >
                          {shop.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium">{shop.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          background:
                            shop.status === "banned"
                              ? "rgba(255, 95, 87, 0.1)"
                              : "var(--accent-dim)",
                          color:
                            shop.status === "banned" ? "var(--red)" : "var(--accent)",
                        }}
                      >
                        {shop.status === "banned" ? "Banlı" : "Aktif"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: `${PLAN_COLORS[shop.subscriptionStatus] || PLAN_COLORS["Bilinmiyor"]}15`,
                          color: PLAN_COLORS[shop.subscriptionStatus] || PLAN_COLORS["Bilinmiyor"],
                        }}
                      >
                        {STATUS_LABELS[shop.subscriptionStatus] || shop.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-heading font-bold">
                      {shop.appointmentCount.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-5 py-4 text-sm font-heading font-bold" style={{ color: "var(--accent)" }}>
                      ₺{shop.revenue.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: "var(--text2)" }}>
                      {new Date(shop.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm" style={{ color: "var(--text3)" }}>
                    Henüz veri yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  change,
  changeDir,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  change?: string;
  changeDir?: "up" | "down";
  icon: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden group border"
      style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none" style={{ background: "radial-gradient(circle at top right, var(--accent-dim2), transparent 70%)" }} />
      <div className="absolute top-4 right-4 text-xl opacity-40">{icon}</div>
      <div className="text-[11px] font-bold uppercase tracking-widest mb-2 relative z-10" style={{ color: "var(--text3)" }}>
        {label}
      </div>
      <div className="font-heading font-black text-3xl relative z-10" style={{ color: accent ? "var(--accent)" : "var(--text)" }}>
        {value}
      </div>
      {change && (
        <div
          className="text-xs mt-1.5 relative z-10"
          style={{ color: changeDir === "up" ? "#4caf7d" : changeDir === "down" ? "#ff5f57" : "var(--text3)" }}
        >
          {change}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3 border"
      style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: "var(--bg3)" }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text3)" }}>
          {label}
        </div>
        <div className="font-heading font-black text-lg" style={{ color: color || "var(--text)" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
      <div>
        <h3 className="font-heading font-bold text-sm">{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function SourceBar({
  icon,
  label,
  count,
  total,
  color,
  gradientEnd,
}: {
  icon: string;
  label: string;
  count: number;
  total: number;
  color: string;
  gradientEnd: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</span>
        </div>
        <span className="text-sm font-bold font-heading" style={{ color }}>
          {count.toLocaleString("tr-TR")}
          <span className="text-xs font-normal ml-1" style={{ color: "var(--text3)" }}>
            ({Math.round(pct)}%)
          </span>
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg3)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${gradientEnd})`,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

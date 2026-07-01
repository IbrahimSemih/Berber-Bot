"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { StatCard, Card, CardHeader, PageHeader, Button, StatusBadge, SourceBadge, Avatar } from "@/components/ui";
import { formatTime } from "@/lib/utils";
import AddAppointmentModal from "@/components/AddAppointmentModal";
import { confirmAppointmentAndNotify } from "@/app/appointments/actions";

interface Apt {
  id: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  source: "whatsapp" | "manual";
  customer: { id: string; name: string | null; phone: string } | null;
  service: { id: string; name: string; price: number; duration_minutes: number } | null;
}

export default function DashboardPage() {
  const [apts, setApts] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);

  const supabase = createClient();

  async function load() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).single();
    if (!shop) {
      setLoading(false);
      return; // Or show error
    }

    const shopId = shop.id;
    setCurrentShopId(shopId);

    const today = new Date().toISOString().split("T")[0];

    // Bugünkü randevular
    const { data } = await supabase
      .from("appointments")
      .select("*, customer:customers(*), service:services(*)")
      .eq("shop_id", shopId)
      .gte("scheduled_at", `${today}T00:00:00`)
      .lte("scheduled_at", `${today}T23:59:59`)
      .order("scheduled_at");

    setApts((data as Apt[]) ?? []);

    // Toplam müşteri
    const { count } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shopId);
    setTotalCustomers(count ?? 0);

    // Bu ay ciro
    const monthStart = new Date();
    monthStart.setDate(1);
    const { data: revenue } = await supabase
      .from("appointments")
      .select("service:services(price)")
      .eq("shop_id", shopId)
      .gte("scheduled_at", monthStart.toISOString())
      .eq("status", "confirmed");
    const total = (revenue ?? []).reduce((sum: number, a: any) => sum + (a.service?.price ?? 0), 0);
    setMonthRevenue(total);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!currentShopId) return;

    const channel = supabase
      .channel("appointments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `shop_id=eq.${currentShopId}` }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentShopId]);

  async function confirm(id: string) {
    if (!currentShopId) return;
    try {
      await confirmAppointmentAndNotify(id, currentShopId);
    } catch (e) {
      console.error(e);
    }
    load();
  }

  async function cancel(id: string) {
    if (!currentShopId) return;
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id).eq("shop_id", currentShopId);
    load();
  }

  const pendingCount = apts.filter((a) => a.status === "pending").length;

  return (
    <AdminLayout>
      <PageHeader title="Dashboard">
        <span className="text-sm" style={{ color: "var(--text3)" }}>
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
        <Button onClick={() => setShowModal(true)}>+ Randevu Ekle</Button>
      </PageHeader>

      <div className="p-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Bugünkü Randevular" value={apts.length} change="Bugün" icon="📅" />
          <StatCard label="Bekleyen Onay" value={pendingCount} change={pendingCount > 0 ? "Onay bekliyor" : "Hepsi onaylı"} icon="⏳" />
          <StatCard label="Toplam Müşteri" value={totalCustomers} icon="👥" />
          <StatCard label="Bu Ay Ciro" value={`₺${monthRevenue.toLocaleString("tr-TR")}`} icon="💰" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader title="Bugünkü Randevular" action={
              <button onClick={load} className="text-xs px-2 py-1 rounded" style={{ color: "var(--text3)", background: "var(--bg3)" }}>
                Yenile ↻
              </button>
            } />
            {loading ? (
              <div className="p-10 text-center text-sm" style={{ color: "var(--text3)" }}>Yükleniyor...</div>
            ) : apts.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: "var(--text3)" }}>Bugün randevu yok</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[600px]">
                  <thead>
                    <tr style={{ background: "var(--bg3)" }}>
                      {["Müşteri", "Saat", "Hizmet", "Durum", "Kaynak", "İşlem"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide"
                          style={{ color: "var(--text3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apts.map((apt, i) => (
                      <tr key={apt.id} className="border-b transition-colors" style={{ borderColor: "var(--border)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={apt.customer?.name ?? apt.customer?.phone ?? "?"} index={i} />
                            <div>
                              <div className="text-sm font-medium">{apt.customer?.name ?? "İsimsiz"}</div>
                              <div className="text-xs" style={{ color: "var(--text3)" }}>{apt.customer?.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-heading font-bold text-sm">{formatTime(apt.scheduled_at)}</td>
                        <td className="px-4 py-3 text-sm">{apt.service?.name ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                        <td className="px-4 py-3"><SourceBadge source={apt.source} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {apt.status === "pending" && <Button size="sm" onClick={() => confirm(apt.id)}>Onayla</Button>}
                            {apt.status !== "cancelled" && <Button size="sm" variant="danger" onClick={() => cancel(apt.id)}>İptal</Button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader title="Günün Akışı" />
            <div className="p-4 flex flex-col">
              {apts.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: "var(--text3)" }}>Bugün randevu yok</div>
              ) : apts.map((apt) => (
                <div key={apt.id} className="flex gap-3 py-3 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <div className="text-xs font-heading font-bold w-10 flex-shrink-0 pt-0.5" style={{ color: "var(--text3)" }}>
                    {formatTime(apt.scheduled_at)}
                  </div>
                  <div className="w-0.5 rounded flex-shrink-0 min-h-[36px]"
                    style={{ background: apt.status === "confirmed" ? "#4caf7d" : apt.status === "pending" ? "#ffaa33" : "#555" }} />
                  <div>
                    <div className="text-sm font-medium">{apt.customer?.name ?? apt.customer?.phone}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{apt.service?.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {showModal && currentShopId && (
        <AddAppointmentModal
          shopId={currentShopId}
          onClose={() => setShowModal(false)}
          onAdd={() => { setShowModal(false); load(); }}
        />
      )}
    </AdminLayout>
  );
}

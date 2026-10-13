"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  StatCard, StatCardSkeleton, TableSkeleton, Skeleton, EmptyState,
  Card, CardHeader, PageHeader, Button, StatusBadge, SourceBadge, Avatar,
} from "@/components/ui";
import { formatTime } from "@/lib/utils";
import AddAppointmentModal from "@/components/AddAppointmentModal";
import { confirmAppointmentAndNotify } from "@/app/appointments/actions";
import { toast } from "react-hot-toast";
import { Calendar, CalendarX2, Clock, Users, Wallet, Plus, RefreshCw, Copy, ExternalLink, Link2, Check, X } from "lucide-react";

interface Apt {
  id: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  source: "whatsapp" | "manual";
  customer: { id: string; name: string | null; phone: string } | null;
  service: { id: string; name: string; price: number; duration_minutes: number } | null;
}

type RowAction = { id: string; type: "confirm" | "cancel" } | null;

export default function DashboardPage() {
  const [apts, setApts] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [shopUrl, setShopUrl] = useState<string>("");
  const [acting, setActing] = useState<RowAction>(null);

  const supabase = createClient();

  useEffect(() => {
    if (shopSlug) {
      setShopUrl(`${window.location.origin}/${shopSlug}`);
    }
  }, [shopSlug]);

  async function load() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: shop } = await supabase.from("shops").select("id, slug").eq("owner_id", user.id).single();
    if (!shop) {
      setLoading(false);
      return; // Or show error
    }

    const shopId = shop.id;
    setCurrentShopId(shopId);
    setShopSlug(shop.slug);

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
    if (!currentShopId || acting) return;
    setActing({ id, type: "confirm" });
    try {
      const result = await confirmAppointmentAndNotify(id, currentShopId);
      if (result.success) {
        toast.success(result.notified ? "Randevu onaylandı, müşteriye bildirim gönderildi." : "Randevu onaylandı.");
      } else {
        toast.error(result.error || "Randevu onaylanamadı.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Randevu onaylanırken bir hata oluştu.");
    }
    await load();
    setActing(null);
  }

  async function cancel(id: string) {
    if (!currentShopId || acting) return;
    setActing({ id, type: "cancel" });
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id).eq("shop_id", currentShopId);
    if (error) {
      toast.error("Randevu iptal edilemedi.");
    } else {
      toast.success("Randevu iptal edildi.");
    }
    await load();
    setActing(null);
  }

  function copyShopUrl() {
    navigator.clipboard.writeText(shopUrl);
    toast.success("Link kopyalandı!");
  }

  const pendingCount = apts.filter((a) => a.status === "pending").length;
  const isActing = (id: string, type: "confirm" | "cancel") => acting?.id === id && acting.type === type;
  const isRowBusy = (id: string) => acting?.id === id;

  const renderActions = (apt: Apt, fullWidth = false) => (
    <div className={fullWidth ? "grid grid-cols-2 gap-2" : "flex gap-2"}>
      {apt.status === "pending" && (
        <Button size="sm" loading={isActing(apt.id, "confirm")} disabled={isRowBusy(apt.id)} onClick={() => confirm(apt.id)}
          className={fullWidth ? "w-full" : ""}>
          {!isActing(apt.id, "confirm") && <Check size={13} aria-hidden />}
          Onayla
        </Button>
      )}
      {apt.status !== "cancelled" && (
        <Button size="sm" variant="danger" loading={isActing(apt.id, "cancel")} disabled={isRowBusy(apt.id)} onClick={() => cancel(apt.id)}
          className={fullWidth && apt.status !== "pending" ? "w-full col-span-2" : fullWidth ? "w-full" : ""}>
          {!isActing(apt.id, "cancel") && <X size={13} aria-hidden />}
          İptal
        </Button>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <PageHeader title="Dashboard">
        <span className="hidden sm:inline text-sm" style={{ color: "var(--text3)" }}>
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
        <Button onClick={() => setShowModal(true)}><Plus size={15} aria-hidden /> Randevu Ekle</Button>
      </PageHeader>

      <div className="p-4 sm:p-7 relative">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[520px] h-[520px] pointer-events-none -z-0"
          style={{ background: "radial-gradient(circle, rgba(200,240,96,0.06) 0%, transparent 70%)" }} aria-hidden />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none -z-0"
          style={{ background: "radial-gradient(circle, rgba(200,240,96,0.04) 0%, transparent 70%)" }} aria-hidden />

        <div className="relative z-10">
          {/* Public booking link */}
          {loading && !shopUrl ? (
            <Skeleton className="h-[76px] w-full rounded-xl mb-6" />
          ) : shopUrl && (
            <div className="mb-6 rounded-xl p-px"
              style={{ background: "linear-gradient(120deg, var(--accent) 0%, rgba(200,240,96,0.25) 40%, var(--border) 100%)" }}>
              <div className="rounded-[11px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                style={{ background: "var(--bg2)" }}>
                <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                  style={{ background: "rgba(200,240,96,0.08)" }} aria-hidden />
                <div className="flex items-start gap-3 relative">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-dim2)" }}>
                    <Link2 size={16} aria-hidden />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Halka Açık Randevu Sayfanız</span>
                      <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
                        style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                        <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: "var(--accent)" }} /> Canlı
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--text3)" }}>Müşterileriniz bu link üzerinden kendi randevularını alabilirler.</div>
                  </div>
                </div>
                <div className="flex gap-2 items-center relative min-w-0">
                  <a href={`/${shopSlug}`} target="_blank" rel="noreferrer"
                    className="text-xs sm:text-sm font-medium truncate flex-1 sm:flex-none sm:max-w-[260px] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors hover:bg-[var(--bg3)]"
                    style={{ color: "var(--accent)", background: "var(--bg3)", border: "1px solid var(--border)" }}>
                    <span className="truncate">{shopUrl.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink size={12} className="flex-shrink-0" aria-hidden />
                  </a>
                  <Button size="sm" onClick={copyShopUrl}><Copy size={13} aria-hidden /> Kopyala</Button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {loading ? (
              <>
                <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard label="Bugünkü Randevular" value={apts.length} change="Bugün" icon={Calendar} />
                <StatCard label="Bekleyen Onay" value={pendingCount} change={pendingCount > 0 ? "Onay bekliyor" : "Hepsi onaylı"} changeDir={pendingCount > 0 ? undefined : "up"} icon={Clock} />
                <StatCard label="Toplam Müşteri" value={totalCustomers} icon={Users} />
                <StatCard label="Bu Ay Ciro" value={`₺${monthRevenue.toLocaleString("tr-TR")}`} icon={Wallet} />
              </>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader title="Bugünkü Randevular" action={
                <button onClick={load} disabled={loading}
                  className="text-xs px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors duration-150 hover:bg-[var(--bg4)] disabled:opacity-60"
                  style={{ color: "var(--text3)", background: "var(--bg3)" }}>
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} aria-hidden />
                  Yenile
                </button>
              } />
              {loading ? (
                <TableSkeleton rows={4} cols={6} />
              ) : apts.length === 0 ? (
                <EmptyState
                  icon={CalendarX2}
                  title="Bugün için kayıtlı randevu bulunmuyor"
                  description="Yeni bir randevu ekleyebilir veya müşterilerinizin halka açık sayfanızdan randevu almasını bekleyebilirsiniz."
                  actionButton={<Button onClick={() => setShowModal(true)}><Plus size={15} aria-hidden /> Randevu Ekle</Button>}
                />
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse min-w-[600px]">
                      <thead>
                        <tr style={{ background: "var(--bg3)" }}>
                          {["Müşteri", "Saat", "Hizmet", "Durum", "Kaynak", "İşlem"].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide transition-colors duration-150"
                              style={{ color: "var(--text3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {apts.map((apt, i) => (
                          <tr key={apt.id}
                            className="border-b transition-colors duration-150 hover:bg-[var(--bg3)]"
                            style={{ borderColor: "var(--border)", opacity: isRowBusy(apt.id) ? 0.7 : 1 }}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={apt.customer?.name ?? apt.customer?.phone ?? "?"} index={i} />
                                <div>
                                  <div className="text-sm font-medium">{apt.customer?.name ?? "İsimsiz"}</div>
                                  <div className="text-xs" style={{ color: "var(--text3)" }}>{apt.customer?.phone}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-heading font-bold text-sm tabular-nums">{formatTime(apt.scheduled_at)}</td>
                            <td className="px-4 py-3 text-sm">{apt.service?.name ?? "—"}</td>
                            <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                            <td className="px-4 py-3"><SourceBadge source={apt.source} /></td>
                            <td className="px-4 py-3">{renderActions(apt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="flex flex-col gap-3 p-4 md:hidden">
                    {apts.map((apt, i) => (
                      <div key={apt.id} className="rounded-xl p-4 border transition-colors duration-150"
                        style={{ background: "var(--bg3)", borderColor: "var(--border)", opacity: isRowBusy(apt.id) ? 0.7 : 1 }}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={apt.customer?.name ?? apt.customer?.phone ?? "?"} index={i} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{apt.customer?.name ?? "İsimsiz"}</div>
                              <div className="text-xs truncate" style={{ color: "var(--text3)" }}>{apt.customer?.phone}</div>
                            </div>
                          </div>
                          <div className="font-heading font-bold text-base tabular-nums flex-shrink-0 inline-flex items-center gap-1" style={{ color: "var(--accent)" }}>
                            <Clock size={13} aria-hidden /> {formatTime(apt.scheduled_at)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-sm truncate" style={{ color: "var(--text2)" }}>{apt.service?.name ?? "—"}</span>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <StatusBadge status={apt.status} />
                            <SourceBadge source={apt.source} />
                          </div>
                        </div>
                        {apt.status !== "cancelled" && renderActions(apt, true)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader title="Günün Akışı" />
              <div className="p-4 flex flex-col">
                {loading ? (
                  <div className="flex flex-col gap-3 py-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-3 py-2">
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="w-0.5 min-h-[36px]" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-2.5 w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : apts.length === 0 ? (
                  <EmptyState icon={Calendar} title="Akış boş" description="Bugün planlanmış bir randevu yok." />
                ) : apts.map((apt) => (
                  <div key={apt.id} className="flex gap-3 py-3 border-b last:border-0 transition-colors duration-150" style={{ borderColor: "var(--border)" }}>
                    <div className="text-xs font-heading font-bold w-10 flex-shrink-0 pt-0.5 tabular-nums" style={{ color: "var(--text3)" }}>
                      {formatTime(apt.scheduled_at)}
                    </div>
                    <div className="w-0.5 rounded flex-shrink-0 min-h-[36px]"
                      style={{ background: apt.status === "confirmed" ? "#4caf7d" : apt.status === "pending" ? "#ffaa33" : "#555" }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{apt.customer?.name ?? apt.customer?.phone}</div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text3)" }}>{apt.service?.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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

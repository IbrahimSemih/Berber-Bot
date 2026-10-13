"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, PageHeader, Button, StatusBadge, SourceBadge, Avatar, Badge, TableSkeleton, EmptyState } from "@/components/ui";
import { formatTime, relativeDay, formatPrice } from "@/lib/utils";
import AddAppointmentModal from "@/components/AddAppointmentModal";
import { confirmAppointmentAndNotify } from "./actions";
import { toast } from "react-hot-toast";
import { Plus, Check, X, CalendarX2, Clock, Scissors, User, AlertTriangle } from "lucide-react";

type Filter = "all" | "pending" | "confirmed" | "cancelled";

interface StaffMember {
  id: string;
  name: string;
}

interface Apt {
  id: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  source: "whatsapp" | "manual";
  staff_id: string | null;
  staff: { id: string; name: string } | null;
  customer: { id: string; name: string | null; phone: string } | null;
  service: { id: string; name: string; price: number; duration_minutes: number } | null;
}

type RowAction = { id: string; type: "confirm" | "cancel" } | null;

const TABLE_HEADERS = ["Müşteri", "Tarih & Saat", "Hizmet", "Personel", "Süre", "Ücret", "Durum", "Kaynak", "İşlem"];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Apt[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [acting, setActing] = useState<RowAction>(null);

  const supabase = createClient();

  async function load(shopId?: string) {
    const id = shopId || currentShopId;
    if (!id) return;

    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*, customer:customers(*), service:services(*), staff:staff(*)")
      .eq("shop_id", id)
      .order("scheduled_at", { ascending: false });

    setAppointments((data as Apt[]) ?? []);
    setLoading(false);
  }

  async function loadStaff(shopId: string) {
    const { data } = await supabase
      .from("staff")
      .select("id, name")
      .eq("shop_id", shopId)
      .eq("is_active", true);
    setStaffList(data ?? []);
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).single();
      if (!shop) { setLoading(false); return; }

      setCurrentShopId(shop.id);
      load(shop.id);
      loadStaff(shop.id);
    }
    init();
  }, []);

  useEffect(() => {
    if (!currentShopId) return;

    const channel = supabase
      .channel("appointments-realtime-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `shop_id=eq.${currentShopId}` }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentShopId]);

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

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

  async function assignStaff(appointmentId: string, staffId: string) {
    if (!currentShopId) return;
    setAssigningId(appointmentId);
    const { error } = await supabase
      .from("appointments")
      .update({ staff_id: staffId || null })
      .eq("id", appointmentId)
      .eq("shop_id", currentShopId);
    if (error) toast.error("Personel atanamadı.");
    else toast.success("Personel atandı.");
    await load();
    setAssigningId(null);
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Tümü" },
    { key: "pending", label: "Bekleyen" },
    { key: "confirmed", label: "Onaylı" },
    { key: "cancelled", label: "İptal" },
  ];

  const emptyCopy: Record<Filter, { title: string; description: string }> = {
    all: { title: "Henüz randevu yok", description: "İlk randevunuzu ekleyin ya da müşterilerinizin halka açık sayfanızdan randevu almasını bekleyin." },
    pending: { title: "Bekleyen randevu yok", description: "Onay bekleyen bir randevu bulunmuyor." },
    confirmed: { title: "Onaylı randevu yok", description: "Henüz onaylanmış bir randevu bulunmuyor." },
    cancelled: { title: "İptal edilen randevu yok", description: "İptal edilmiş bir randevu bulunmuyor." },
  };

  const isActing = (id: string, type: "confirm" | "cancel") => acting?.id === id && acting.type === type;
  const isRowBusy = (id: string) => acting?.id === id;

  const renderStaffCell = (apt: Apt, compact = false) => {
    if (apt.staff) return <Badge color="blue">{apt.staff.name}</Badge>;
    if (apt.status === "cancelled") return <span className="text-xs" style={{ color: "var(--text3)" }}>—</span>;
    return (
      <select
        className={`text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer font-dm transition-colors duration-150 focus:border-[var(--accent-dim2)] ${compact ? "w-full" : "min-w-[120px]"}`}
        style={{ background: "var(--bg2)", border: "1px solid var(--border2)", color: assigningId === apt.id ? "var(--text3)" : "var(--orange)" }}
        value=""
        disabled={assigningId === apt.id}
        onChange={(e) => { if (e.target.value) assignStaff(apt.id, e.target.value); }}
        aria-label="Personel ata"
      >
        <option value="">{assigningId === apt.id ? "Atanıyor..." : "Personel atanmadı"}</option>
        {staffList.map((st) => (
          <option key={st.id} value={st.id}>{st.name}</option>
        ))}
      </select>
    );
  };

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

  const filterButtons = filters.map((f) => (
    <Button key={f.key} size="sm" variant={filter === f.key ? "primary" : "ghost"} onClick={() => setFilter(f.key)}>
      {f.label}
    </Button>
  ));

  return (
    <AdminLayout>
      <PageHeader title="Randevular">
        <div className="hidden sm:flex gap-1.5">{filterButtons}</div>
        <Button onClick={() => setShowModal(true)}><Plus size={15} aria-hidden /> <span className="hidden sm:inline">Yeni Randevu</span><span className="sm:hidden">Ekle</span></Button>
      </PageHeader>

      <div className="p-4 sm:p-7 relative">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[520px] h-[520px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(200,240,96,0.06) 0%, transparent 70%)" }} aria-hidden />

        <div className="relative z-10">
          {/* Mobile filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 sm:hidden -mx-4 px-4">{filterButtons}</div>

          <Card>
            {loading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={CalendarX2}
                title={emptyCopy[filter].title}
                description={emptyCopy[filter].description}
                actionButton={filter === "all" ? <Button onClick={() => setShowModal(true)}><Plus size={15} aria-hidden /> Yeni Randevu</Button> : undefined}
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: "var(--bg3)" }}>
                        {TABLE_HEADERS.map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide transition-colors duration-150"
                            style={{ color: "var(--text3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((apt, i) => (
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
                          <td className="px-4 py-3">
                            <div className="font-syne font-bold text-sm tabular-nums">{formatTime(apt.scheduled_at)}</div>
                            <div className="text-xs" style={{ color: "var(--text3)" }}>{relativeDay(apt.scheduled_at)}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">{apt.service?.name ?? "—"}</td>
                          <td className="px-4 py-3">{renderStaffCell(apt)}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: "var(--text3)" }}>{apt.service?.duration_minutes ? `${apt.service.duration_minutes} dk` : "—"}</td>
                          <td className="px-4 py-3 font-syne font-bold text-sm tabular-nums" style={{ color: "var(--accent)" }}>
                            {apt.service ? formatPrice(apt.service.price) : "—"}
                          </td>
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
                  {filtered.map((apt, i) => (
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
                        <div className="text-right flex-shrink-0">
                          <div className="font-syne font-bold text-base tabular-nums inline-flex items-center gap-1" style={{ color: "var(--accent)" }}>
                            <Clock size={13} aria-hidden /> {formatTime(apt.scheduled_at)}
                          </div>
                          <div className="text-[11px]" style={{ color: "var(--text3)" }}>{relativeDay(apt.scheduled_at)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0" style={{ color: "var(--text2)" }}>
                          <Scissors size={12} className="flex-shrink-0" style={{ color: "var(--text3)" }} aria-hidden />
                          <span className="truncate">{apt.service?.name ?? "—"}</span>
                          {apt.service?.duration_minutes && <span style={{ color: "var(--text3)" }}>· {apt.service.duration_minutes} dk</span>}
                        </div>
                        <div className="text-right font-syne font-bold tabular-nums" style={{ color: "var(--accent)" }}>
                          {apt.service ? formatPrice(apt.service.price) : "—"}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {apt.staff ? (
                            <><User size={12} style={{ color: "var(--text3)" }} aria-hidden /><Badge color="blue">{apt.staff.name}</Badge></>
                          ) : apt.status !== "cancelled" ? (
                            <><AlertTriangle size={12} className="flex-shrink-0" style={{ color: "var(--orange)" }} aria-hidden />{renderStaffCell(apt, true)}</>
                          ) : null}
                        </div>
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

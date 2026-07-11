"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, PageHeader, Button, StatusBadge, SourceBadge, Avatar, Badge, Select } from "@/components/ui";
import { formatTime, relativeDay, formatPrice } from "@/lib/utils";
import AddAppointmentModal from "@/components/AddAppointmentModal";
import { confirmAppointmentAndNotify } from "./actions";

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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Apt[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

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

  async function assignStaff(appointmentId: string, staffId: string) {
    if (!currentShopId) return;
    setAssigningId(appointmentId);
    await supabase
      .from("appointments")
      .update({ staff_id: staffId || null })
      .eq("id", appointmentId)
      .eq("shop_id", currentShopId);
    await load();
    setAssigningId(null);
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Tümü" },
    { key: "pending", label: "Bekleyen" },
    { key: "confirmed", label: "Onaylı" },
    { key: "cancelled", label: "İptal" },
  ];

  return (
    <AdminLayout>
      <PageHeader title="Randevular">
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <Button key={f.key} size="sm" variant={filter === f.key ? "primary" : "ghost"} onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowModal(true)}>+ Yeni Randevu</Button>
      </PageHeader>

      <div className="p-7">
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--bg3)" }}>
                {["Müşteri", "Tarih & Saat", "Hizmet", "Personel", "Süre", "Ücret", "Durum", "Kaynak", "İşlem"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--text3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-16 text-sm" style={{ color: "var(--text3)" }}>Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-sm" style={{ color: "var(--text3)" }}>Randevu bulunamadı</td></tr>
              ) : filtered.map((apt, i) => (
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
                  <td className="px-4 py-3">
                    <div className="font-syne font-bold text-sm">{formatTime(apt.scheduled_at)}</div>
                    <div className="text-xs" style={{ color: "var(--text3)" }}>{relativeDay(apt.scheduled_at)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{apt.service?.name ?? "—"}</td>
                  {/* Personel kolonu */}
                  <td className="px-4 py-3">
                    {apt.staff ? (
                      <Badge color="blue">{apt.staff.name}</Badge>
                    ) : apt.status !== "cancelled" ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer font-dm min-w-[120px]"
                          style={{
                            background: "var(--bg3)",
                            border: "1px solid var(--border2)",
                            color: "var(--text)",
                          }}
                          value=""
                          disabled={assigningId === apt.id}
                          onChange={(e) => {
                            if (e.target.value) assignStaff(apt.id, e.target.value);
                          }}
                        >
                          <option value="">
                            {assigningId === apt.id ? "Atanıyor..." : "⚠️ Atanmadı"}
                          </option>
                          {staffList.map((st) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text3)" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text3)" }}>{apt.service?.duration_minutes ? `${apt.service.duration_minutes} dk` : "—"}</td>
                  <td className="px-4 py-3 font-syne font-bold text-sm" style={{ color: "var(--accent)" }}>
                    {apt.service ? formatPrice(apt.service.price) : "—"}
                  </td>
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
        </Card>
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

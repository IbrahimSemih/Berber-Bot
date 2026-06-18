"use client";
import { useState, useEffect } from "react";
import { supabase, DEFAULT_SHOP_ID } from "@/lib/supabase";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, PageHeader, Button, StatusBadge, SourceBadge, Avatar } from "@/components/ui";
import { formatTime, relativeDay, formatPrice } from "@/lib/utils";
import AddAppointmentModal from "@/components/AddAppointmentModal";

type Filter = "all" | "pending" | "confirmed" | "cancelled";

interface Apt {
  id: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  source: "whatsapp" | "manual";
  customer: { id: string; name: string | null; phone: string } | null;
  service: { id: string; name: string; price: number; duration_minutes: number } | null;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Apt[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*, customer:customers(*), service:services(*)")
      .eq("shop_id", DEFAULT_SHOP_ID)
      .order("scheduled_at", { ascending: false });

    setAppointments((data as Apt[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("appointments-realtime-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `shop_id=eq.${DEFAULT_SHOP_ID}` }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  async function confirm(id: string) {
    await supabase.from("appointments").update({ status: "confirmed" }).eq("id", id).eq("shop_id", DEFAULT_SHOP_ID);
    load();
  }

  async function cancel(id: string) {
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id).eq("shop_id", DEFAULT_SHOP_ID);
    load();
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
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--bg3)" }}>
                {["Müşteri", "Tarih & Saat", "Hizmet", "Süre", "Ücret", "Durum", "Kaynak", "İşlem"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--text3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-sm" style={{ color: "var(--text3)" }}>Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-sm" style={{ color: "var(--text3)" }}>Randevu bulunamadı</td></tr>
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
        </Card>
      </div>

      {showModal && (
        <AddAppointmentModal
          onClose={() => setShowModal(false)}
          onAdd={() => { setShowModal(false); load(); }}
        />
      )}
    </AdminLayout>
  );
}

"use client";
import { useState, useEffect } from "react";
import { Button, Input, Select } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface Service { id: string; name: string; price: number; duration_minutes: number; }
interface Staff { id: string; name: string; }
interface Props { shopId: string; onClose: () => void; onAdd: () => void; }

export default function AddAppointmentModal({ shopId, onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [serviceId, setServiceId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [staffId, setStaffId] = useState("");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    supabase.from("services").select("*").eq("shop_id", shopId).eq("is_active", true).then(({ data }) => {
      setServices(data ?? []);
      if (data?.[0]) setServiceId(data[0].id);
    });

    supabase.from("staff").select("*").eq("shop_id", shopId).eq("is_active", true).then(({ data }) => {
      setStaffList(data ?? []);
    });
  }, [shopId, supabase]);

  const times: string[] = [];
  for (let h = 9; h < 20; h++) {
    times.push(`${String(h).padStart(2, "0")}:00`);
    times.push(`${String(h).padStart(2, "0")}:30`);
  }

  async function handleAdd() {
    if (!name.trim()) { setError("Müşteri adı zorunlu."); return; }
    if (!serviceId) { setError("Hizmet seçiniz."); return; }
    setSaving(true);
    setError("");

    try {
      // Müşteriyi upsert et
      const cleanPhone = phone.replace(/\s/g, "") || "+900000000000";
      const { data: customer, error: cErr } = await supabase
        .from("customers")
        .upsert({ shop_id: shopId, name, phone: cleanPhone }, { onConflict: "shop_id,phone" })
        .select()
        .single();
      if (cErr) throw cErr;

      // Randevuyu kaydet
      const { error: aErr } = await supabase.from("appointments").insert({
        shop_id: shopId,
        customer_id: customer.id,
        service_id: serviceId,
        staff_id: staffId || null,
        scheduled_at: `${date}T${time}:00`,
        status: "confirmed",
        source: "manual",
      });
      if (aErr) throw aErr;

      onAdd();
    } catch (e: any) {
      setError(e.message ?? "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rounded-2xl p-7 w-[480px] max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}>
        <h2 className="font-syne font-black text-xl mb-1">Yeni Randevu Ekle</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>Müşteri adına manuel randevu oluştur</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Müşteri Adı *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmet Yılmaz" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>WhatsApp Numarası</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Tarih</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Saat</label>
              <Select value={time} onChange={(e) => setTime(e.target.value)}>
                {times.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Hizmet *</label>
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — ₺{s.price}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Personel</label>
            <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">Fark Etmez / Atanmadı</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </Select>
          </div>
          {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,95,87,0.1)", color: "var(--red)" }}>{error}</div>}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button onClick={handleAdd} disabled={saving}>{saving ? "Kaydediliyor..." : "Randevu Oluştur"}</Button>
        </div>
      </div>
    </div>
  );
}

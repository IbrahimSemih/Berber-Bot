"use client";
import { useState, useEffect } from "react";
import { Button, Input, Select } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { createAppointmentByOwner } from "@/app/(panel)/appointments/actions";
import { todayInIstanbul } from "@/lib/time";
import { toast } from "react-hot-toast";

interface Service { id: string; name: string; price: number; duration_minutes: number; }
interface Staff { id: string; name: string; }
interface Props { shopId: string; onClose: () => void; onAdd: () => void; }

export default function AddAppointmentModal({ shopId, onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(() => todayInIstanbul());
  const [time, setTime] = useState("09:00");
  const [serviceId, setServiceId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [staffId, setStaffId] = useState("");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("services").select("*").eq("shop_id", shopId).eq("is_active", true).order("name").then(({ data }) => {
      setServices(data ?? []);
      if (data?.[0]) setServiceId(data[0].id);
    });

    supabase.from("staff").select("*").eq("shop_id", shopId).eq("is_active", true).order("name").then(({ data }) => {
      setStaffList(data ?? []);
    });
  }, [shopId]);

  const times: string[] = [];
  for (let h = 7; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  async function handleAdd() {
    if (!name.trim()) { setError("Müşteri adı zorunlu."); return; }
    if (!phone.trim()) { setError("Telefon numarası zorunlu (onay ve hatırlatma mesajları için)."); return; }
    if (!serviceId) { setError("Hizmet seçiniz."); return; }
    setSaving(true);
    setError("");

    try {
      const result = await createAppointmentByOwner({
        customerName: name,
        customerPhone: phone,
        serviceId,
        staffId: staffId || null,
        date,
        time,
        notify,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success(result.notified ? "Randevu oluşturuldu, müşteriye WhatsApp bildirimi gönderildi." : "Randevu oluşturuldu.");
      onAdd();
    } catch (e) {
      console.error(e);
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rounded-2xl p-6 sm:p-7 w-full max-w-[480px] max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}>
        <h2 className="font-heading font-black text-xl mb-1">Yeni Randevu Ekle</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>Telefonla veya yüz yüze alınan randevuyu kaydedin</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Müşteri Adı *</label>
            <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Ahmet Yılmaz" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Cep Telefonu (WhatsApp) *</label>
            <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="532 123 45 67" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Tarih</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Saat</label>
              <Select value={time} onChange={(e) => setTime(e.target.value)}>
                {times.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Hizmet *</label>
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} · {s.duration_minutes} dk · ₺{s.price}</option>
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
          <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: "var(--text2)" }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
            Müşteriye WhatsApp ile onay mesajı gönder
          </label>
          {error && <div role="alert" className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,95,87,0.1)", color: "var(--red)" }}>{error}</div>}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button onClick={handleAdd} loading={saving}>{saving ? "Kaydediliyor..." : "Randevu Oluştur"}</Button>
        </div>
      </div>
    </div>
  );
}

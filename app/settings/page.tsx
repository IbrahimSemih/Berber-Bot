"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardHeader, PageHeader, Button, Toggle, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Service, Settings, WorkingHour } from "@/types";

const DAYS = [
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" },
  { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
  { value: 0, label: "Pazar" },
];

export default function SettingsPage() {
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [wpNumber, setWpNumber] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(
    DAYS.map(d => ({
      day: d.value,
      is_open: d.value !== 0,
      start: "09:00",
      end: "20:00"
    }))
  );
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [notifyNew, setNotifyNew] = useState(true);
  const [notifyCancel, setNotifyCancel] = useState(false);
  const [reminder, setReminder] = useState(true);
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).single();
      if (!shop) { setLoading(false); return; }
      
      const shopId = shop.id;
      setCurrentShopId(shopId);

      // Fetch settings
      const { data: settingsData } = await supabase.from("settings").select("*").eq("shop_id", shopId).limit(1).single();
      if (settingsData) {
        setSettingsId(settingsData.id);
        setShopName(settingsData.shop_name || "");
        setWpNumber(settingsData.whatsapp_number || "");
        
        // Migrate old work_days to new working_hours if working_hours is missing
        if (settingsData.working_hours) {
          setWorkingHours(settingsData.working_hours);
        } else if (settingsData.work_days) {
          setWorkingHours(DAYS.map(d => ({
            day: d.value,
            is_open: settingsData.work_days.includes(d.value),
            start: settingsData.work_start || "09:00",
            end: settingsData.work_end || "20:00"
          })));
        }

        setAutoConfirm(settingsData.auto_confirm ?? true);
        setNotifyNew(settingsData.notify_new ?? true);
        setNotifyCancel(settingsData.notify_cancel ?? false);
        setReminder(settingsData.reminder_hours === 24);
      }

      // Fetch services
      const { data: servicesData } = await supabase.from("services").select("*").eq("shop_id", shopId).order("created_at", { ascending: true });
      if (servicesData) {
        setServices(servicesData);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const updateWorkingHour = (dayValue: number, field: keyof WorkingHour, value: string | boolean) => {
    setWorkingHours(prev => prev.map(wh => 
      wh.day === dayValue ? { ...wh, [field]: value } : wh
    ));
  };

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const addService = () => {
    if (!currentShopId) return;
    const newService: Service = {
      id: `new-${Date.now()}`,
      shop_id: currentShopId,
      name: "Yeni Hizmet",
      duration_minutes: 30,
      price: 100,
    };
    setServices([...services, newService]);
  };

  const removeService = async (index: number) => {
    const serviceToRemove = services[index];
    if (!serviceToRemove.id.startsWith("new-")) {
      await supabase.from("services").delete().eq("id", serviceToRemove.id);
    }
    setServices(services.filter((_, i) => i !== index));
  };

  async function save() {
    if (!currentShopId) return;
    setSaving(true);
    
    // Save settings
    const settingsPayload = {
      shop_name: shopName,
      whatsapp_number: wpNumber,
      working_hours: workingHours,
      auto_confirm: autoConfirm,
      notify_new: notifyNew,
      notify_cancel: notifyCancel,
      reminder_hours: reminder ? 24 : 0,
    };

    if (settingsId) {
      const { error } = await supabase.from("settings").update(settingsPayload).eq("id", settingsId);
      if (error) {
        alert("Ayarlar güncellenirken hata oluştu (SQL kolonlarını eklediniz mi?): " + error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("settings").insert([{ ...settingsPayload, shop_id: currentShopId }]);
      if (error) {
        alert("Ayarlar eklenirken hata oluştu: " + error.message);
        setSaving(false);
        return;
      }
    }

    // Save services
    const servicesToUpdate = services
      .filter(s => !s.id.startsWith("new-"))
      .map(s => ({
        id: s.id,
        shop_id: currentShopId,
        name: s.name,
        duration_minutes: Number(s.duration_minutes),
        price: Number(s.price),
      }));

    const servicesToInsert = services
      .filter(s => s.id.startsWith("new-"))
      .map(s => ({
        shop_id: currentShopId,
        name: s.name,
        duration_minutes: Number(s.duration_minutes),
        price: Number(s.price),
      }));

    if (servicesToUpdate.length > 0) {
      const { error } = await supabase.from("services").upsert(servicesToUpdate);
      if (error) {
        alert("Mevcut hizmetler güncellenirken hata oluştu: " + error.message);
        setSaving(false);
        return;
      }
    }

    if (servicesToInsert.length > 0) {
      const { error } = await supabase.from("services").insert(servicesToInsert);
      if (error) {
        alert("Yeni hizmetler eklenirken hata oluştu: " + error.message);
        setSaving(false);
        return;
      }
    }
      
      // Reload services to get proper IDs for newly inserted ones
      const { data: newServices } = await supabase.from("services").select("*").eq("shop_id", currentShopId).order("created_at", { ascending: true });
      if (newServices) {
        setServices(newServices);
      }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-7">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader title="Ayarlar">
        <Button onClick={save} disabled={saving}>
          {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi!" : "Kaydet"}
        </Button>
      </PageHeader>

      <div className="p-7 max-w-2xl flex flex-col gap-5">
        {/* Shop info */}
        <Card>
          <CardHeader title="Dükkan Bilgileri" />
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Dükkan Adı</label>
              <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>WhatsApp Numarası</label>
                <Input value={wpNumber} disabled placeholder="Bota bağlandığınızda otomatik dolar" />
              </div>
            </div>
          </div>
        </Card>

        {/* Working Hours & Days */}
        <Card>
          <CardHeader title="Çalışma Günleri & Saatleri" />
          <div className="p-5 flex flex-col gap-2">
            <div className="grid grid-cols-[90px_1fr_1fr] sm:grid-cols-[auto_1fr_1fr] gap-2 sm:gap-4 mb-2 px-1 sm:px-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text3)" }}>
              <div className="w-[90px] sm:w-32">Gün</div>
              <div>Açılış</div>
              <div>Kapanış</div>
            </div>
            
            {DAYS.map(day => {
              const wh = workingHours.find(w => w.day === day.value) || { is_open: false, start: "09:00", end: "20:00" };
              return (
                <div key={day.value} className="grid grid-cols-[90px_1fr_1fr] sm:grid-cols-[auto_1fr_1fr] gap-2 sm:gap-4 items-center p-1 sm:p-2 rounded-lg transition-colors border"
                  style={{ 
                    borderColor: "var(--border)",
                    background: wh.is_open ? "var(--bg)" : "var(--bg3)",
                    opacity: wh.is_open ? 1 : 0.6
                  }}>
                  <div className="w-[90px] sm:w-32 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
                    <Toggle checked={wh.is_open} onChange={(val) => updateWorkingHour(day.value, "is_open", val)} />
                    <span className="text-[11px] sm:text-sm font-medium">{day.label}</span>
                  </div>
                  <div>
                    <Input 
                      type="time" 
                      value={wh.start} 
                      onChange={(e) => updateWorkingHour(day.value, "start", e.target.value)}
                      disabled={!wh.is_open}
                    />
                  </div>
                  <div>
                    <Input 
                      type="time" 
                      value={wh.end} 
                      onChange={(e) => updateWorkingHour(day.value, "end", e.target.value)}
                      disabled={!wh.is_open}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader title="Hizmetler & Fiyatlar" />
          <div className="p-5 flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr style={{ background: "var(--bg3)" }}>
                    {["Hizmet", "Fiyat (₺)", ""].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide"
                        style={{ color: "var(--text3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.map((s, i) => (
                    <tr key={s.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3">
                        <Input value={s.name} onChange={(e) => updateService(i, "name", e.target.value)} />
                      </td>
                      <td className="px-4 py-3 w-28">
                        <Input type="number" value={s.price} onChange={(e) => updateService(i, "price", e.target.value)} />
                      </td>
                      <td className="px-4 py-3 w-16 text-center">
                        <button onClick={() => removeService(i)} className="text-red-500 hover:text-red-700 p-2">
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm" style={{ color: "var(--text3)" }}>
                        Henüz hiç hizmet eklenmemiş.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <Button onClick={addService} variant="ghost" className="self-start">
              + Yeni Hizmet Ekle
            </Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader title="Bildirimler & Otomasyon" />
          <div className="px-5">
            {[
              { label: "Otomatik hatırlatma mesajı", desc: "Randevudan 24 saat önce müşteriye WhatsApp gönder", value: reminder, set: setReminder },
              { label: "Yeni randevu bildirimi", desc: "WhatsApp'tan randevu alındığında seni bildir", value: notifyNew, set: setNotifyNew },
              { label: "İptal bildirimi", desc: "Müşteri randevuyu iptal ettiğinde haber ver", value: notifyCancel, set: setNotifyCancel },
              { label: "Bot otomatik onay", desc: "Randevuları senin onayın olmadan otomatik kabul et", value: autoConfirm, set: setAutoConfirm },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-4 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{item.desc}</div>
                </div>
                <Toggle checked={item.value} onChange={item.set} />
              </div>
            ))}
          </div>
        </Card>

      </div>
    </AdminLayout>
  );
}

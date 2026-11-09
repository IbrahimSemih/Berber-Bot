"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import BookingLinkCard from "@/components/BookingLinkCard";
import { Card, CardHeader, PageHeader, Button, Toggle, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Service, WorkingHour } from "@/types";
import { normalizeTrPhone, PHONE_ERROR } from "@/lib/validations";
import { instagramHandle } from "@/lib/utils";
import { REMINDER_HOURS_BEFORE } from "@/lib/booking";
import { toast } from "react-hot-toast";

const DAYS = [
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" },
  { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
  { value: 0, label: "Pazar" },
];

const DURATION_OPTIONS = [10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 105, 120, 150, 180, 240];

export default function SettingsPage() {
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
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
  const [notifyCancel, setNotifyCancel] = useState(true);
  const [reminder, setReminder] = useState(true);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [supabase] = useState(() => createClient());

  async function loadServices(shopId: string) {
    const { data: servicesData } = await supabase
      .from("services")
      .select("*")
      .eq("shop_id", shopId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    setServices(servicesData ?? []);
  }

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: shop } = await supabase.from("shops").select("id, name, slug").eq("owner_id", user.id).single();
      if (!shop) { setLoading(false); return; }

      const shopId = shop.id;
      setCurrentShopId(shopId);
      setShopSlug(shop.slug);
      setShopName(shop.name || "");

      const { data: settingsData } = await supabase.from("settings").select("*").eq("shop_id", shopId).limit(1).maybeSingle();
      if (settingsData) {
        setSettingsId(settingsData.id);
        setPhone(settingsData.whatsapp_number || "");
        setAddress(settingsData.address || "");
        setInstagram(settingsData.instagram || "");

        // Eski work_days kayıtlarını working_hours biçimine taşı
        if (Array.isArray(settingsData.working_hours) && settingsData.working_hours.length > 0) {
          setWorkingHours(settingsData.working_hours);
        } else if (settingsData.work_days) {
          setWorkingHours(DAYS.map(d => ({
            day: d.value,
            is_open: settingsData.work_days.includes(d.value),
            start: (settingsData.work_start || "09:00").slice(0, 5),
            end: (settingsData.work_end || "20:00").slice(0, 5)
          })));
        }

        setAutoConfirm(settingsData.auto_confirm ?? true);
        setNotifyNew(settingsData.notify_new ?? true);
        setNotifyCancel(settingsData.notify_cancel ?? true);
        setReminder(settingsData.reminder_hours !== 0);
      }

      await loadServices(shopId);
      setLoading(false);
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (!window.confirm(`"${serviceToRemove.name}" hizmeti kaldırılsın mı? Geçmiş randevular korunur, yeni randevuda bu hizmet görünmez.`)) return;
      // Silmek yerine pasife alıyoruz: hizmete bağlı geçmiş randevular ve ciro raporları kaybolmasın
      const { error } = await supabase.from("services").update({ is_active: false }).eq("id", serviceToRemove.id);
      if (error) {
        toast.error("Hizmet kaldırılamadı: " + error.message);
        return;
      }
      toast.success("Hizmet kaldırıldı.");
    }
    setServices(services.filter((_, i) => i !== index));
  };

  function validate(): string | null {
    const name = shopName.trim();
    if (name.length < 2 || name.length > 80) return "Dükkan adı 2-80 karakter olmalıdır.";
    if (phone.trim() && !normalizeTrPhone(phone)) return `İletişim telefonu: ${PHONE_ERROR}`;
    if (instagram.trim() && !instagramHandle(instagram)) return "Instagram kullanıcı adı geçersiz.";
    for (const wh of workingHours) {
      if (wh.is_open && (!wh.start || !wh.end || wh.end <= wh.start)) {
        const label = DAYS.find(d => d.value === wh.day)?.label;
        return `${label}: kapanış saati açılış saatinden sonra olmalıdır.`;
      }
    }
    for (const s of services) {
      if (!s.name.trim()) return "Hizmet adları boş bırakılamaz.";
      const price = Number(s.price);
      if (!Number.isFinite(price) || price < 0) return `"${s.name}" için geçerli bir fiyat girin.`;
      const duration = Number(s.duration_minutes);
      if (!Number.isInteger(duration) || duration < 5 || duration > 480) return `"${s.name}" için süre 5-480 dakika olmalıdır.`;
    }
    return null;
  }

  async function save() {
    if (!currentShopId) return;
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);

    try {
      // Dükkan adı (randevu sayfasında görünen ad)
      const { error: shopError } = await supabase.from("shops").update({ name: shopName.trim() }).eq("id", currentShopId);
      if (shopError) throw new Error("Dükkan adı güncellenemedi: " + shopError.message);

      const basePayload = {
        shop_name: shopName.trim(),
        whatsapp_number: phone.trim() ? normalizeTrPhone(phone) : null,
        working_hours: workingHours,
        auto_confirm: autoConfirm,
        notify_new: notifyNew,
        notify_cancel: notifyCancel,
        reminder_hours: reminder ? REMINDER_HOURS_BEFORE : 0,
      };
      const contactPayload = {
        address: address.trim() || null,
        instagram: instagram.trim() ? instagramHandle(instagram) : null,
      };

      const writeSettings = (payload: Record<string, unknown>) =>
        settingsId
          ? supabase.from("settings").update(payload).eq("id", settingsId)
          : supabase.from("settings").insert([{ ...payload, shop_id: currentShopId }]).select("id").single();

      let { error: settingsError } = await writeSettings({ ...basePayload, ...contactPayload });
      // Veritabanına adres/instagram kolonları henüz eklenmemişse diğer ayarları yine de kaydet
      if (settingsError && (settingsError.code === "PGRST204" || /address|instagram/.test(settingsError.message))) {
        ({ error: settingsError } = await writeSettings(basePayload));
        if (!settingsError) {
          toast("Adres ve Instagram için veritabanı güncellemesi gerekiyor; diğer ayarlar kaydedildi.", { icon: "⚠️" });
        }
      }
      if (settingsError) throw new Error("Ayarlar kaydedilemedi: " + settingsError.message);

      if (!settingsId) {
        const { data: created } = await supabase.from("settings").select("id").eq("shop_id", currentShopId).maybeSingle();
        if (created) setSettingsId(created.id);
      }

      // Hizmetler
      const servicesToUpdate = services
        .filter(s => !s.id.startsWith("new-"))
        .map(s => ({
          id: s.id,
          shop_id: currentShopId,
          name: s.name.trim(),
          duration_minutes: Number(s.duration_minutes),
          price: Number(s.price),
        }));

      const servicesToInsert = services
        .filter(s => s.id.startsWith("new-"))
        .map(s => ({
          shop_id: currentShopId,
          name: s.name.trim(),
          duration_minutes: Number(s.duration_minutes),
          price: Number(s.price),
          is_active: true,
        }));

      if (servicesToUpdate.length > 0) {
        const { error } = await supabase.from("services").upsert(servicesToUpdate);
        if (error) throw new Error("Hizmetler güncellenemedi: " + error.message);
      }
      if (servicesToInsert.length > 0) {
        const { error } = await supabase.from("services").insert(servicesToInsert);
        if (error) throw new Error("Yeni hizmetler eklenemedi: " + error.message);
      }

      await loadServices(currentShopId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e?.message || "Kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-7">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1.5";

  return (
    <AdminLayout>
      <PageHeader title="Ayarlar">
        <Button onClick={save} disabled={saving}>
          {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi!" : "Kaydet"}
        </Button>
      </PageHeader>

      <div className="p-4 sm:p-7 max-w-2xl flex flex-col gap-5">
        {shopSlug && <BookingLinkCard initialSlug={shopSlug} shopName={shopName} />}

        {/* Shop info */}
        <Card>
          <CardHeader title="Dükkan Bilgileri" />
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className={labelClass} style={{ color: "var(--text3)" }}>Dükkan Adı</label>
              <Input value={shopName} maxLength={80} onChange={(e) => setShopName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: "var(--text3)" }}>İletişim Telefonu</label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="532 123 45 67" />
              </div>
              <div>
                <label className={labelClass} style={{ color: "var(--text3)" }}>Instagram</label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@berberiniz" />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: "var(--text3)" }}>Adres</label>
              <Input value={address} maxLength={300} onChange={(e) => setAddress(e.target.value)} placeholder="Mahalle, cadde, no, ilçe / il" />
            </div>
            <p className="text-xs" style={{ color: "var(--text3)" }}>
              Bu bilgiler randevu sayfanızda müşterilerinize gösterilir. WhatsApp bildirimleri BerberBot&apos;un resmi bildirim numarasından gönderilir.
            </p>
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
          <CardHeader title="Hizmetler, Süreler & Fiyatlar" />
          <div className="p-5 flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[520px]">
                <thead>
                  <tr style={{ background: "var(--bg3)" }}>
                    {["Hizmet", "Süre", "Fiyat (₺)", ""].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide"
                        style={{ color: "var(--text3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.map((s, i) => (
                    <tr key={s.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3">
                        <Input value={s.name} maxLength={80} onChange={(e) => updateService(i, "name", e.target.value)} />
                      </td>
                      <td className="px-4 py-3 w-32">
                        <select
                          value={Number(s.duration_minutes)}
                          onChange={(e) => updateService(i, "duration_minutes", Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: "var(--bg)", border: "1px solid var(--border2)", color: "var(--text)" }}
                          aria-label="Hizmet süresi"
                        >
                          {Array.from(new Set([...DURATION_OPTIONS, Number(s.duration_minutes)]))
                            .filter((d) => Number.isFinite(d) && d > 0)
                            .sort((a, b) => a - b)
                            .map((d) => <option key={d} value={d}>{d} dk</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 w-28">
                        <Input type="number" min={0} value={s.price} onChange={(e) => updateService(i, "price", e.target.value)} />
                      </td>
                      <td className="px-4 py-3 w-16 text-center">
                        <button onClick={() => removeService(i)} className="text-[var(--red)] hover:text-[#8F2E28] p-2" aria-label={`${s.name} hizmetini kaldır`}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm" style={{ color: "var(--text3)" }}>
                        Henüz hiç hizmet eklenmemiş.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-xs" style={{ color: "var(--text3)" }}>
              Süre, online randevuda dolu saatlerin hesaplanmasında kullanılır: 45 dakikalık bir hizmet takvimde 45 dakika yer kaplar.
            </p>

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
              { label: "Otomatik onay", desc: "Online randevuları onayınızı beklemeden kabul et ve müşteriye WhatsApp onay mesajı gönder", value: autoConfirm, set: setAutoConfirm },
              { label: "WhatsApp hatırlatma mesajı", desc: `Onaylı randevulardan ${REMINDER_HOURS_BEFORE} saat önce müşteriye WhatsApp hatırlatması gönder`, value: reminder, set: setReminder },
              { label: "Yeni randevu bildirimi", desc: "Online randevu alındığında panelde bildirim göster", value: notifyNew, set: setNotifyNew },
              { label: "İptal bildirimi", desc: "Müşteri randevusunu iptal ettiğinde panelde bildirim göster", value: notifyCancel, set: setNotifyCancel },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 py-4 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
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

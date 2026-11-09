// Dükkan ayarları (web: app/settings). İletişim, çalışma saatleri, otomatik onay ve bildirimler.
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { REMINDER_HOURS_BEFORE } from "@shared/plan";
import { timeToMinutes } from "@shared/time";
import { instagramHandle, normalizeTrPhone, PHONE_ERROR } from "@shared/validations";
import { useAuth } from "@/lib/auth";
import { dbErrorMessage, formatPhone } from "@/lib/format";
import { qk, resolveWorkingHours, useSettings, type Settings, type WorkingHour } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { PickerSheet, timeOptions } from "@/components/sheets";
import { AppText, Button, Card, Divider, ErrorBanner, Input, Loading, SelectField, SwitchRow } from "@/components/ui";
import { useToast } from "@/components/toast";
import { colors, spacing } from "@/theme";

const DAY_LABELS: Record<number, string> = { 1: "Pazartesi", 2: "Salı", 3: "Çarşamba", 4: "Perşembe", 5: "Cuma", 6: "Cumartesi", 0: "Pazar" };
const TIMES = timeOptions("00:00", "23:45");

type Form = {
  shopName: string;
  phone: string;
  instagram: string;
  address: string;
  hours: WorkingHour[];
  autoConfirm: boolean;
  reminder: boolean;
  notifyNew: boolean;
  notifyCancel: boolean;
};

function toForm(shopName: string, s: Settings | null): Form {
  return {
    shopName,
    phone: s?.whatsapp_number ? formatPhone(s.whatsapp_number) : "",
    instagram: s?.instagram ?? "",
    address: s?.address ?? "",
    hours: resolveWorkingHours(s),
    autoConfirm: s?.auto_confirm ?? true,
    reminder: s ? s.reminder_hours !== 0 : true,
    notifyNew: s?.notify_new ?? true,
    notifyCancel: s?.notify_cancel ?? true,
  };
}

export default function ShopSettingsScreen() {
  const settings = useSettings();
  if (settings.isLoading) return <Loading />;
  if (settings.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl, gap: spacing.md }}>
        <ErrorBanner message="Ayarlar yüklenemedi." />
        <Button title="Tekrar dene" variant="secondary" onPress={() => void settings.refetch()} />
      </View>
    );
  }
  return <SettingsForm settings={settings.data ?? null} />;
}

function SettingsForm({ settings }: { settings: Settings | null }) {
  const { shop, refreshShop } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<Form>(() => toForm(shop?.name ?? "", settings));
  const [picker, setPicker] = useState<{ day: number; field: "start" | "end" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setHour = (day: number, patch: Partial<WorkingHour>) =>
    setForm((f) => ({ ...f, hours: f.hours.map((h) => (h.day === day ? { ...h, ...patch } : h)) }));

  function validate(): string | null {
    const name = form.shopName.trim();
    if (name.length < 2 || name.length > 80) return "Dükkan adı 2-80 karakter olmalıdır.";
    if (form.phone.trim() && !normalizeTrPhone(form.phone)) return `İletişim telefonu: ${PHONE_ERROR}`;
    if (form.instagram.trim() && !instagramHandle(form.instagram)) return "Instagram kullanıcı adı geçersiz.";
    if (!form.hours.some((h) => h.is_open)) return "En az bir gün açık olmalıdır.";
    for (const h of form.hours) {
      if (h.is_open && timeToMinutes(h.end) <= timeToMinutes(h.start)) {
        return `${DAY_LABELS[h.day]}: kapanış saati açılış saatinden sonra olmalıdır.`;
      }
    }
    return null;
  }

  async function save() {
    if (!shop) return;
    const invalid = validate();
    if (invalid) return setError(invalid);
    setSaving(true);
    setError(null);
    try {
      const name = form.shopName.trim();
      if (name !== shop.name) {
        const { error: shopError } = await supabase.from("shops").update({ name }).eq("id", shop.id);
        if (shopError) throw shopError;
      }
      const payload = {
        shop_name: name,
        whatsapp_number: form.phone.trim() ? normalizeTrPhone(form.phone) : null,
        address: form.address.trim() || null,
        instagram: form.instagram.trim() ? instagramHandle(form.instagram) : null,
        working_hours: form.hours,
        auto_confirm: form.autoConfirm,
        reminder_hours: form.reminder ? REMINDER_HOURS_BEFORE : 0,
        notify_new: form.notifyNew,
        notify_cancel: form.notifyCancel,
      };
      const { error: settingsError } = settings
        ? await supabase.from("settings").update(payload).eq("id", settings.id)
        : await supabase.from("settings").insert({ ...payload, shop_id: shop.id });
      if (settingsError) throw settingsError;

      queryClient.invalidateQueries({ queryKey: qk.settings(shop.id) });
      if (name !== shop.name) await refreshShop();
      toast("Ayarlar kaydedildi.");
      router.back();
    } catch (e: any) {
      setError(dbErrorMessage(e, "Ayarlar kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  const pickerHour = picker ? form.hours.find((h) => h.day === picker.day) : null;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
      <Card style={{ gap: spacing.md }}>
        <AppText variant="heading">Dükkan bilgileri</AppText>
        <Input label="Dükkan adı" value={form.shopName} onChangeText={(v) => set("shopName", v)} maxLength={80} />
        <Input label="İletişim telefonu" value={form.phone} onChangeText={(v) => set("phone", v)} placeholder="532 123 45 67" keyboardType="phone-pad" />
        <Input label="Instagram" value={form.instagram} onChangeText={(v) => set("instagram", v)} placeholder="@berberiniz" autoCapitalize="none" />
        <Input label="Adres" value={form.address} onChangeText={(v) => set("address", v)} placeholder="Mahalle, cadde, no, ilçe / il" maxLength={300} multiline />
        <AppText variant="small">Bu bilgiler online randevu sayfanızda görünür.</AppText>
      </Card>

      <Card>
        <AppText variant="heading">Çalışma saatleri</AppText>
        {form.hours.map((h, i) => (
          <View key={h.day}>
            {i > 0 ? <Divider /> : null}
            <SwitchRow title={DAY_LABELS[h.day]} subtitle={h.is_open ? `${h.start} – ${h.end}` : "Kapalı"} value={h.is_open} onValueChange={(v) => setHour(h.day, { is_open: v })} />
            {h.is_open ? (
              <View style={{ flexDirection: "row", gap: spacing.md, paddingBottom: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <SelectField value={h.start} placeholder="Açılış" onPress={() => setPicker({ day: h.day, field: "start" })} />
                </View>
                <View style={{ flex: 1 }}>
                  <SelectField value={h.end} placeholder="Kapanış" onPress={() => setPicker({ day: h.day, field: "end" })} />
                </View>
              </View>
            ) : null}
          </View>
        ))}
      </Card>

      <Card>
        <AppText variant="heading">Randevu ve bildirimler</AppText>
        <SwitchRow
          title="Otomatik onay"
          subtitle="Online randevuları onayınızı beklemeden kabul et ve müşteriye WhatsApp onay mesajı gönder"
          value={form.autoConfirm}
          onValueChange={(v) => set("autoConfirm", v)}
        />
        <Divider />
        <SwitchRow
          title="WhatsApp hatırlatma"
          subtitle={`Onaylı randevulardan ${REMINDER_HOURS_BEFORE} saat önce müşteriye hatırlatma gönder`}
          value={form.reminder}
          onValueChange={(v) => set("reminder", v)}
        />
        <Divider />
        <SwitchRow title="Yeni randevu bildirimi" subtitle="Online randevu alındığında bildirim" value={form.notifyNew} onValueChange={(v) => set("notifyNew", v)} />
        <Divider />
        <SwitchRow title="İptal bildirimi" subtitle="Müşteri randevusunu iptal ettiğinde bildirim" value={form.notifyCancel} onValueChange={(v) => set("notifyCancel", v)} />
      </Card>

      <ErrorBanner message={error} />
      <Button title="Kaydet" onPress={save} loading={saving} />

      <PickerSheet
        visible={!!picker}
        title={picker ? `${DAY_LABELS[picker.day]} · ${picker.field === "start" ? "Açılış" : "Kapanış"}` : ""}
        options={TIMES}
        selected={pickerHour ? pickerHour[picker!.field] : null}
        onSelect={(v) => picker && setHour(picker.day, { [picker.field]: v })}
        onClose={() => setPicker(null)}
      />
    </ScrollView>
  );
}

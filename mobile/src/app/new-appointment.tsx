// Manuel randevu ekleme (web: components/AddAppointmentModal) → POST /api/mobile/v1/appointments
import { useMemo, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { isValidDateString, todayInIstanbul } from "@shared/time";
import { normalizeTrPhone, PHONE_ERROR } from "@shared/validations";
import type { CreateAppointmentRequest, CreateAppointmentResponse } from "@shared/api-types";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice, relativeDayLabel } from "@/lib/format";
import { useServices, useStaff } from "@/lib/queries";
import { CalendarSheet, PickerSheet, timeOptions } from "@/components/sheets";
import { AppText, Button, ErrorBanner, Input, Screen, SelectField, SwitchRow } from "@/components/ui";
import { useToast } from "@/components/toast";

type Sheet = "date" | "time" | "service" | "staff" | null;

export default function NewAppointmentScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const { shop } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const services = useServices();
  const staff = useStaff();

  const today = todayInIstanbul();
  const initialDate = typeof params.date === "string" && isValidDateString(params.date) && params.date >= today ? params.date : today;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string>("");
  const [notify, setNotify] = useState(true);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceList = services.data ?? [];
  const activeStaff = (staff.data ?? []).filter((s) => s.is_active);
  const service = serviceList.find((s) => s.id === (serviceId ?? serviceList[0]?.id));
  const staffName = activeStaff.find((s) => s.id === staffId)?.name;
  const times = useMemo(() => timeOptions(), []);

  async function handleSave() {
    if (name.trim().length < 2) return setError("Müşteri adını girin.");
    if (!normalizeTrPhone(phone)) return setError(PHONE_ERROR);
    if (!time) return setError("Saat seçin.");
    if (!service) return setError("Hizmet seçin.");
    setSaving(true);
    setError(null);
    try {
      const body: CreateAppointmentRequest = {
        customerName: name.trim(),
        customerPhone: phone,
        serviceId: service.id,
        staffId: staffId || null,
        date,
        time,
        notify,
      };
      const r = await apiFetch<CreateAppointmentResponse>("/appointments", { method: "POST", body });
      if (shop) {
        queryClient.invalidateQueries({ queryKey: ["appointments", shop.id] });
        queryClient.invalidateQueries({ queryKey: ["customers", shop.id] });
      }
      toast(r.notified ? "Randevu eklendi, müşteriye WhatsApp onayı gönderildi." : "Randevu eklendi.");
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={["bottom"]}>
      <Input label="Müşteri Adı" value={name} onChangeText={setName} placeholder="Ahmet Yılmaz" maxLength={80} autoCapitalize="words" />
      <Input label="Telefon" value={phone} onChangeText={setPhone} placeholder="532 123 45 67" keyboardType="phone-pad" autoComplete="tel" />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SelectField label="Tarih" value={relativeDayLabel(date)} placeholder="Tarih" onPress={() => setSheet("date")} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField label="Saat" value={time} placeholder="Seçin" onPress={() => setSheet("time")} />
        </View>
      </View>
      <SelectField
        label="Hizmet"
        value={service ? `${service.name} · ${service.duration_minutes} dk · ${formatPrice(service.price)}` : null}
        placeholder={services.isLoading ? "Yükleniyor..." : "Hizmet ekleyin (Daha fazla → Hizmetler)"}
        onPress={() => setSheet("service")}
      />
      <SelectField label="Personel (isteğe bağlı)" value={staffName ?? "Fark etmez"} placeholder="Fark etmez" onPress={() => setSheet("staff")} />
      <SwitchRow
        title="Müşteriye WhatsApp onayı gönder"
        subtitle="Randevu bilgisi ve iptal bağlantısı müşterinin WhatsApp'ına gider."
        value={notify}
        onValueChange={setNotify}
      />
      <ErrorBanner message={error} />
      <Button title="Randevu Oluştur" onPress={handleSave} loading={saving} />
      <AppText variant="small" style={{ textAlign: "center" }}>
        Aynı personelin o saatte başka randevusu varsa kayıt yapılmaz.
      </AppText>

      <CalendarSheet visible={sheet === "date"} title="Tarih" value={date} minDate={today} onSelect={setDate} onClose={() => setSheet(null)} />
      <PickerSheet visible={sheet === "time"} title="Saat" options={times} selected={time} onSelect={setTime} onClose={() => setSheet(null)} />
      <PickerSheet
        visible={sheet === "service"}
        title="Hizmet"
        options={serviceList.map((s) => ({ value: s.id, label: s.name, sublabel: `${s.duration_minutes} dk · ${formatPrice(s.price)}` }))}
        selected={service?.id}
        onSelect={setServiceId}
        onClose={() => setSheet(null)}
      />
      <PickerSheet
        visible={sheet === "staff"}
        title="Personel"
        options={[{ value: "", label: "Fark etmez" }, ...activeStaff.map((s) => ({ value: s.id, label: s.name }))]}
        selected={staffId}
        onSelect={setStaffId}
        onClose={() => setSheet(null)}
      />
    </Screen>
  );
}

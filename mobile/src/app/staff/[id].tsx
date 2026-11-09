// Personel ekle/düzenle + izinler (web: StaffModal + StaffLeaveModal). id = "new" → yeni personel.
import { useState } from "react";
import { View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { formatTrLongDate, istanbulToUtc, todayInIstanbul } from "@shared/time";
import { normalizeTrPhone, PHONE_ERROR } from "@shared/validations";
import { useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { dbErrorMessage, formatPhone } from "@/lib/format";
import { qk, useStaff, useStaffLeaves, type StaffLeave } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { CalendarSheet } from "@/components/sheets";
import { AppText, Button, Card, Divider, EmptyState, ErrorBanner, Input, ListRow, Loading, Screen, SelectField } from "@/components/ui";
import { useToast } from "@/components/toast";
import { spacing } from "@/theme";

const dateLabel = (d: string) => formatTrLongDate(istanbulToUtc(d, "12:00"));

export default function StaffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { shop } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const staff = useStaff();
  const member = staff.data?.find((s) => s.id === id);
  const leaves = useStaffLeaves(isNew ? null : (id ?? null));

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(isNew);

  const [leaveStart, setLeaveStart] = useState(() => todayInIstanbul());
  const [leaveEnd, setLeaveEnd] = useState(() => todayInIstanbul());
  const [sheet, setSheet] = useState<"start" | "end" | null>(null);
  const [addingLeave, setAddingLeave] = useState(false);

  // Mevcut personelin bilgilerini forma bir kez yükle
  if (!initialized && member) {
    setName(member.name);
    setPhone(member.phone ? formatPhone(member.phone) : "");
    setInitialized(true);
  }

  const invalidateStaff = () => shop && queryClient.invalidateQueries({ queryKey: qk.staff(shop.id) });

  async function save() {
    if (!shop) return;
    const cleanName = name.trim();
    if (cleanName.length < 1 || cleanName.length > 60) return setError("Ad 1-60 karakter olmalıdır.");
    const cleanPhone = phone.trim() ? normalizeTrPhone(phone) : null;
    if (phone.trim() && !cleanPhone) return setError(PHONE_ERROR);
    setSaving(true);
    setError(null);
    const payload = { name: cleanName, phone: cleanPhone };
    const { error: dbError } = isNew
      ? await supabase.from("staff").insert({ ...payload, shop_id: shop.id, is_active: true })
      : await supabase.from("staff").update(payload).eq("id", id).eq("shop_id", shop.id);
    setSaving(false);
    if (dbError) return setError(dbErrorMessage(dbError, "Personel kaydedilemedi."));
    invalidateStaff();
    toast(isNew ? "Personel eklendi." : "Personel güncellendi.");
    router.back();
  }

  async function remove() {
    if (!shop || !member) return;
    const ok = await confirmAction({
      title: `${member.name} silinsin mi?`,
      message: "Geçmiş randevular silinmez, personel bilgisi boş görünür. Sadece geçici olarak çalışmıyorsa silmek yerine pasife alın.",
      confirmText: "Sil",
      destructive: true,
    });
    if (!ok) return;
    const { error: dbError } = await supabase.from("staff").delete().eq("id", member.id).eq("shop_id", shop.id);
    if (dbError) return toast(dbErrorMessage(dbError, "Personel silinemedi."), "error");
    invalidateStaff();
    toast("Personel silindi.");
    router.back();
  }

  async function addLeave() {
    if (!shop || !member) return;
    if (leaveEnd < leaveStart) return toast("Bitiş tarihi başlangıçtan önce olamaz.", "error");
    setAddingLeave(true);
    const { error: dbError } = await supabase
      .from("staff_leaves")
      .insert({ shop_id: shop.id, staff_id: member.id, start_date: leaveStart, end_date: leaveEnd });
    setAddingLeave(false);
    if (dbError) return toast(dbErrorMessage(dbError, "İzin eklenemedi."), "error");
    queryClient.invalidateQueries({ queryKey: qk.leaves(shop.id, member.id) });
    toast("İzin eklendi; bu tarihlerde online randevu alınamaz.");
  }

  async function removeLeave(leave: StaffLeave) {
    if (!shop) return;
    const ok = await confirmAction({ title: "İzin silinsin mi?", confirmText: "Sil", destructive: true });
    if (!ok) return;
    const { error: dbError } = await supabase.from("staff_leaves").delete().eq("id", leave.id).eq("shop_id", shop.id);
    if (dbError) return toast(dbErrorMessage(dbError, "İzin silinemedi."), "error");
    queryClient.invalidateQueries({ queryKey: qk.leaves(shop.id, leave.staff_id) });
  }

  if (!isNew && !member) {
    if (staff.isLoading) return <Loading />;
    return (
      <Screen edges={["bottom"]}>
        <EmptyState title="Personel bulunamadı" />
      </Screen>
    );
  }

  const today = todayInIstanbul();
  const upcomingLeaves = (leaves.data ?? []).filter((l) => l.end_date >= today);

  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen options={{ title: isNew ? "Yeni Personel" : member?.name ?? "Personel" }} />
      <Input label="Ad Soyad" value={name} onChangeText={setName} placeholder="Ahmet" maxLength={60} autoCapitalize="words" />
      <Input label="Telefon (isteğe bağlı)" value={phone} onChangeText={setPhone} placeholder="532 123 45 67" keyboardType="phone-pad" />
      <ErrorBanner message={error} />
      <Button title={isNew ? "Personeli Ekle" : "Kaydet"} onPress={save} loading={saving} />

      {!isNew && member ? (
        <>
          <Card>
            <AppText variant="heading">İzinler</AppText>
            <AppText variant="small">İzinli günlerde bu personel için online randevu alınamaz.</AppText>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <SelectField label="Başlangıç" value={dateLabel(leaveStart)} placeholder="Tarih" onPress={() => setSheet("start")} />
              </View>
              <View style={{ flex: 1 }}>
                <SelectField label="Bitiş" value={dateLabel(leaveEnd)} placeholder="Tarih" onPress={() => setSheet("end")} />
              </View>
            </View>
            <Button title="İzin Ekle" variant="secondary" onPress={addLeave} loading={addingLeave} />
            {upcomingLeaves.length === 0 ? (
              <AppText variant="small" style={{ marginTop: spacing.sm }}>
                Planlanmış izin yok.
              </AppText>
            ) : null}
            {upcomingLeaves.map((l, i) => (
              <View key={l.id}>
                {i > 0 ? <Divider /> : null}
                <ListRow
                  title={l.start_date === l.end_date ? dateLabel(l.start_date) : `${dateLabel(l.start_date)} – ${dateLabel(l.end_date)}`}
                  right={
                    <Button title="Sil" variant="ghost" onPress={() => removeLeave(l)} style={{ minHeight: 36, paddingHorizontal: spacing.sm }} />
                  }
                />
              </View>
            ))}
          </Card>
          <Button title="Personeli Sil" variant="danger" onPress={remove} />
        </>
      ) : null}

      <CalendarSheet visible={sheet === "start"} title="İzin başlangıcı" value={leaveStart} minDate={today} onSelect={(d) => {
          setLeaveStart(d);
          if (leaveEnd < d) setLeaveEnd(d);
        }} onClose={() => setSheet(null)} />
      <CalendarSheet visible={sheet === "end"} title="İzin bitişi" value={leaveEnd} minDate={leaveStart} onSelect={setLeaveEnd} onClose={() => setSheet(null)} />
    </Screen>
  );
}

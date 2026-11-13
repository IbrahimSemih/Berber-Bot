// Randevu kartı + işlemleri (onayla, iptal, personel ata, ara). "Bugün" ve
// "Randevular" ekranları ortak kullanır. Onay/iptal sunucuda (WhatsApp mesajı
// gider), personel atama doğrudan Supabase'e (RLS) yazılır — web ile aynı.
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { formatIstanbulTime } from "@shared/time";
import type { AppointmentActionResponse } from "@shared/api-types";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { dbErrorMessage, formatPhone, formatPrice, isAnonymizedPhone } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Appointment, AppointmentStatus, Staff } from "@/lib/queries";
import { AppText, Badge, Button, Card } from "@/components/ui";
import { PickerSheet } from "@/components/sheets";
import { useToast } from "@/components/toast";
import { spacing, type Colors } from "@/theme";
import { useColors, makeStyles } from "@/lib/theme";

type StatusColor = "orange" | "green" | "blue" | "red";
const STATUS_INFO: Record<AppointmentStatus, { text: string; color: StatusColor }> = {
  pending: { text: "Onay bekliyor", color: "orange" },
  confirmed: { text: "Onaylı", color: "green" },
  completed: { text: "Tamamlandı", color: "blue" },
  cancelled: { text: "İptal", color: "red" },
};

/** Durum etiketi ve o temadaki rengi */
export function statusLabel(status: AppointmentStatus, colors: Colors): { text: string; color: string } {
  const info = STATUS_INFO[status] ?? STATUS_INFO.confirmed;
  return { text: info.text, color: colors[info.color] };
}

export function useAppointmentActions() {
  const { shop } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = () => {
    if (!shop) return;
    queryClient.invalidateQueries({ queryKey: ["appointments", shop.id] });
    queryClient.invalidateQueries({ queryKey: ["customers", shop.id] });
  };

  async function run(id: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(id);
    try {
      await fn();
    } finally {
      setBusy(null);
      refresh();
    }
  }

  const confirm = (id: string) =>
    run(id, async () => {
      try {
        const r = await apiFetch<AppointmentActionResponse>(`/appointments/${id}/confirm`, { method: "POST" });
        toast(r.notified ? "Randevu onaylandı, müşteriye WhatsApp mesajı gönderildi." : "Randevu onaylandı.");
      } catch (e) {
        toast(errorMessage(e), "error");
      }
    });

  const cancel = async (apt: Appointment) => {
    const ok = await confirmAction({
      title: "Randevu iptal edilsin mi?",
      message: `${apt.customer?.name ?? "Müşteri"} · ${formatIstanbulTime(apt.scheduled_at)}. İleri tarihli randevularda müşteriye WhatsApp ile iptal mesajı gider.`,
      confirmText: "İptal et",
      destructive: true,
    });
    if (!ok) return;
    await run(apt.id, async () => {
      try {
        const r = await apiFetch<AppointmentActionResponse>(`/appointments/${apt.id}/cancel`, { method: "POST" });
        toast(r.notified ? "Randevu iptal edildi, müşteriye bildirim gönderildi." : "Randevu iptal edildi.");
      } catch (e) {
        toast(errorMessage(e), "error");
      }
    });
  };

  const assignStaff = (id: string, staffId: string) =>
    run(id, async () => {
      if (!shop) return;
      const { error } = await supabase.from("appointments").update({ staff_id: staffId }).eq("id", id).eq("shop_id", shop.id);
      if (error) toast(dbErrorMessage(error, "Personel atanamadı."), "error");
      else toast("Personel atandı.");
    });

  return { busy, confirm, cancel, assignStaff };
}

export function AppointmentCard({
  apt,
  staffList,
  actions,
}: {
  apt: Appointment;
  staffList: Staff[];
  actions: ReturnType<typeof useAppointmentActions>;
}) {
  const colors = useColors();
  const styles = useStyles();
  const [pickStaff, setPickStaff] = useState(false);
  const status = statusLabel(apt.status, colors);
  const isBusy = actions.busy === apt.id;
  const phone = apt.customer?.phone;
  const canCall = !!phone && !isAnonymizedPhone(phone);
  const activeStaff = staffList.filter((s) => s.is_active);

  return (
    <Card style={[styles.card, isBusy && { opacity: 0.6 }, apt.status === "cancelled" && { opacity: 0.55 }]}>
      <View style={styles.top}>
        <AppText variant="heading" style={styles.time}>
          {formatIstanbulTime(apt.scheduled_at)}
        </AppText>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontWeight: "700" }} numberOfLines={1}>
            {apt.customer?.name || "İsimsiz müşteri"}
          </AppText>
          {canCall ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`tel:${phone}`)} hitSlop={6}>
              <AppText variant="small" style={{ color: colors.blue }}>
                {formatPhone(phone)}
              </AppText>
            </Pressable>
          ) : null}
        </View>
        <Badge label={status.text} color={status.color} />
      </View>

      <View style={styles.meta}>
        <AppText variant="muted" style={{ flex: 1 }} numberOfLines={1}>
          {apt.service ? `${apt.service.name} · ${apt.service.duration_minutes} dk` : "Hizmet silinmiş"}
        </AppText>
        {apt.service ? (
          <AppText style={{ color: colors.accent, fontWeight: "700" }}>{formatPrice(apt.service.price)}</AppText>
        ) : null}
      </View>

      {apt.staff ? (
        <AppText variant="small">Personel: {apt.staff.name}</AppText>
      ) : apt.status !== "cancelled" ? (
        <Pressable accessibilityRole="button" onPress={() => setPickStaff(true)} disabled={isBusy} hitSlop={6}>
          <AppText variant="small" style={{ color: colors.orange, fontWeight: "700" }}>
            ⚠ Personel atanmadı · Ata
          </AppText>
        </Pressable>
      ) : null}

      {apt.status === "pending" || apt.status === "confirmed" ? (
        <View style={styles.actions}>
          {apt.status === "pending" ? (
            <Button title="Onayla" onPress={() => actions.confirm(apt.id)} loading={isBusy} style={styles.actionBtn} />
          ) : null}
          <Button title="İptal" variant="danger" onPress={() => actions.cancel(apt)} disabled={isBusy} style={styles.actionBtn} />
        </View>
      ) : null}

      <PickerSheet
        visible={pickStaff}
        title="Personel ata"
        options={activeStaff.map((s) => ({ value: s.id, label: s.name }))}
        onSelect={(staffId) => actions.assignStaff(apt.id, staffId)}
        onClose={() => setPickStaff(false)}
      />
    </Card>
  );
}

const useStyles = makeStyles((colors) => ({
  card: { gap: spacing.sm },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  time: { width: 56, color: colors.accent },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1, minHeight: 42 },
}));

// Bugün (web: app/dashboard). Veriler RLS altında doğrudan Supabase'den okunur.
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { formatIstanbulTime, formatTrLongDateWithWeekday, istanbulDayRange, todayInIstanbul } from "@shared/time";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { AppText, Card, ErrorBanner, InfoBanner } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

type TodayAppointment = {
  id: string;
  scheduled_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  customer: { name: string } | null;
  service: { name: string; duration_minutes: number } | null;
  staff: { name: string } | null;
};

const STATUS_LABEL: Record<TodayAppointment["status"], { text: string; color: string }> = {
  pending: { text: "Onay bekliyor", color: colors.orange },
  confirmed: { text: "Onaylı", color: colors.green },
  completed: { text: "Tamamlandı", color: colors.blue },
  cancelled: { text: "İptal", color: colors.red },
};

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

export default function TodayScreen() {
  const { shop, trialDaysLeft } = useAuth();
  const today = todayInIstanbul();

  const query = useQuery({
    queryKey: ["appointments", "day", shop?.id, today],
    enabled: !!shop,
    queryFn: async () => {
      const { start, end } = istanbulDayRange(today);
      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_at, status, customer:customers(name), service:services(name, duration_minutes), staff:staff(name)")
        .eq("shop_id", shop!.id)
        .gte("scheduled_at", start.toISOString())
        .lt("scheduled_at", end.toISOString())
        .neq("status", "cancelled")
        .order("scheduled_at");
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        ...a,
        customer: one(a.customer),
        service: one(a.service),
        staff: one(a.staff),
      })) as TodayAppointment[];
    },
  });

  const appointments = query.data ?? [];
  const pending = appointments.filter((a) => a.status === "pending").length;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />
        }
      >
        <View>
          <AppText variant="small">{formatTrLongDateWithWeekday(new Date())}</AppText>
          <AppText variant="title">{shop?.name}</AppText>
        </View>

        {trialDaysLeft !== null ? (
          <InfoBanner message={`Ücretsiz deneme: ${trialDaysLeft} gün kaldı.`} />
        ) : null}

        <View style={styles.stats}>
          <Card style={styles.stat}>
            <AppText variant="small">Bugünkü randevu</AppText>
            <AppText variant="title">{query.isLoading ? "–" : appointments.length}</AppText>
          </Card>
          <Card style={styles.stat}>
            <AppText variant="small">Onay bekleyen</AppText>
            <AppText variant="title" style={{ color: pending ? colors.orange : colors.text }}>
              {query.isLoading ? "–" : pending}
            </AppText>
          </Card>
        </View>

        <AppText variant="heading">Bugünün randevuları</AppText>
        {query.isError ? <ErrorBanner message="Randevular yüklenemedi. Aşağı çekerek yenileyin." /> : null}
        {!query.isLoading && !query.isError && appointments.length === 0 ? (
          <Card style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
            <AppText variant="muted">Bugün için randevu yok.</AppText>
            <AppText variant="small">Randevu linkinizi müşterilerinizle paylaşın: Daha fazla → Randevu linki.</AppText>
          </Card>
        ) : null}
        {appointments.map((a) => {
          const status = STATUS_LABEL[a.status] ?? STATUS_LABEL.confirmed;
          return (
            <Card key={a.id} style={styles.aptRow}>
              <AppText variant="heading" style={styles.aptTime}>{formatIstanbulTime(a.scheduled_at)}</AppText>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: "700" }}>{a.customer?.name ?? "Müşteri"}</AppText>
                <AppText variant="small">
                  {[a.service?.name, a.staff?.name].filter(Boolean).join(" · ")}
                </AppText>
              </View>
              <View style={[styles.badge, { borderColor: status.color }]}>
                <AppText style={{ color: status.color, fontSize: 11, fontWeight: "700" }}>{status.text}</AppText>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.lg },
  stats: { flexDirection: "row", gap: spacing.md },
  stat: { flex: 1 },
  aptRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  aptTime: { width: 56, color: colors.accent },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
});

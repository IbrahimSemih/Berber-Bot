// Bugün (web: app/dashboard). Bugünkü randevular, özet ve hızlı işlemler.
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { formatTrLongDateWithWeekday, todayInIstanbul } from "@shared/time";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { useDayAppointments, useStaff } from "@/lib/queries";
import { AppointmentCard, useAppointmentActions } from "@/components/appointment-card";
import { AppText, Button, Card, EmptyState, ErrorBanner, InfoBanner } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function TodayScreen() {
  const { shop, trialDaysLeft } = useAuth();
  const today = todayInIstanbul();
  const query = useDayAppointments(today);
  const staff = useStaff();
  const actions = useAppointmentActions();

  const active = (query.data ?? []).filter((a) => a.status !== "cancelled");
  const pending = active.filter((a) => a.status === "pending").length;
  const expected = active.reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0);

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

        {trialDaysLeft !== null ? <InfoBanner message={`Ücretsiz deneme: ${trialDaysLeft} gün kaldı.`} /> : null}

        <View style={styles.stats}>
          <Card style={styles.stat}>
            <AppText variant="small">Randevu</AppText>
            <AppText variant="title">{query.isLoading ? "–" : active.length}</AppText>
          </Card>
          <Card style={styles.stat}>
            <AppText variant="small">Onay bekleyen</AppText>
            <AppText variant="title" style={{ color: pending ? colors.orange : colors.text }}>
              {query.isLoading ? "–" : pending}
            </AppText>
          </Card>
          <Card style={styles.stat}>
            <AppText variant="small">Beklenen</AppText>
            <AppText variant="heading" style={{ color: colors.accent, marginTop: 6 }} numberOfLines={1}>
              {query.isLoading ? "–" : formatPrice(expected)}
            </AppText>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="heading">Bugünün randevuları</AppText>
          <Button title="+ Ekle" variant="secondary" onPress={() => router.push({ pathname: "/new-appointment", params: { date: today } })} style={styles.addBtn} />
        </View>
        {query.isError ? <ErrorBanner message="Randevular yüklenemedi. Aşağı çekerek yenileyin." /> : null}
        {!query.isLoading && !query.isError && (query.data ?? []).length === 0 ? (
          <Card>
            <EmptyState title="Bugün için randevu yok." description="Randevu linkinizi müşterilerinizle paylaşın: Daha fazla → Randevu linki ve QR." />
          </Card>
        ) : null}
        {(query.data ?? []).map((apt) => (
          <AppointmentCard key={apt.id} apt={apt} staffList={staff.data ?? []} actions={actions} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.lg },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1, padding: spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addBtn: { minHeight: 38, paddingHorizontal: spacing.md },
});

// Bugün (web: app/dashboard). Bugünkü randevular, özet ve hızlı işlemler.
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { formatTrLongDateWithWeekday, todayInIstanbul } from "@shared/time";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { useDayAppointments, useStaff } from "@/lib/queries";
import { AppointmentCard, useAppointmentActions } from "@/components/appointment-card";
import { AppText, Button, Card, EmptyState, ErrorBanner, HeroHeader, InfoBanner } from "@/components/ui";
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
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />
        }
      >
        <HeroHeader eyebrow={formatTrLongDateWithWeekday(new Date())} title={shop?.name ?? ""} overlap={OVERLAP} />
        <View style={styles.content}>
        <View style={[styles.stats, { marginTop: -OVERLAP }]}>
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

        {trialDaysLeft !== null ? <InfoBanner message={`Ücretsiz deneme: ${trialDaysLeft} gün kaldı.`} /> : null}

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
        </View>
      </ScrollView>
    </View>
  );
}

// Özet kartlarının yeşil banda binen kısmı
const OVERLAP = 44;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: { flex: 1, padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addBtn: { minHeight: 38, paddingHorizontal: spacing.md },
});

// Randevular (web: app/appointments). Gün seçici + durum filtresi; onay/iptal/personel atama.
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { addDaysToDateString, isValidDateString, todayInIstanbul } from "@shared/time";
import { relativeDayLabel } from "@/lib/format";
import { useDayAppointments, useStaff, type AppointmentStatus } from "@/lib/queries";
import { AppointmentCard, useAppointmentActions } from "@/components/appointment-card";
import { CalendarSheet } from "@/components/sheets";
import { AppText, Button, Chip, EmptyState, ErrorBanner, HeroHeader } from "@/components/ui";
import { radius, spacing } from "@/theme";
import { useColors, makeStyles } from "@/lib/theme";

type Filter = "all" | Extract<AppointmentStatus, "pending" | "confirmed" | "cancelled">;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "pending", label: "Bekleyen" },
  { key: "confirmed", label: "Onaylı" },
  { key: "cancelled", label: "İptal" },
];

export default function AppointmentsScreen() {
  const colors = useColors();
  const styles = useStyles();
  // ?date=YYYY-MM-DD: bildirime dokununca randevunun gününe açılır
  const params = useLocalSearchParams<{ date?: string }>();
  const [date, setDate] = useState(() => (isValidDateString(params.date) ? params.date : todayInIstanbul()));
  const [filter, setFilter] = useState<Filter>("all");
  // Sekme açıkken yeni bir bildirime dokunulursa parametre değişir: o güne geç
  const [seenDateParam, setSeenDateParam] = useState(params.date);
  if (params.date !== seenDateParam) {
    setSeenDateParam(params.date);
    if (isValidDateString(params.date)) {
      setDate(params.date);
      setFilter("all");
    }
  }
  const [calendarOpen, setCalendarOpen] = useState(false);
  const query = useDayAppointments(date);
  const staff = useStaff();
  const actions = useAppointmentActions();

  const all = query.data ?? [];
  const list = filter === "all" ? all : all.filter((a) => a.status === filter);
  const count = (f: Filter) => (f === "all" ? all.length : all.filter((a) => a.status === f).length);

  return (
    <View style={styles.screen}>
      <HeroHeader
        title="Randevular"
        right={<Button title="+ Yeni" variant="onHero" onPress={() => router.push({ pathname: "/new-appointment", params: { date } })} style={styles.newBtn} />}
      />

      <View style={styles.dayBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Önceki gün" onPress={() => setDate((d) => addDaysToDateString(d, -1))} hitSlop={10} style={styles.arrow}>
          <AppText style={styles.arrowText}>‹</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Tarih seç" onPress={() => setCalendarOpen(true)} style={styles.dayLabel}>
          <AppText style={{ fontWeight: "700" }}>{relativeDayLabel(date)}</AppText>
          <AppText variant="small">Tarih seçmek için dokunun</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Sonraki gün" onPress={() => setDate((d) => addDaysToDateString(d, 1))} hitSlop={10} style={styles.arrow}>
          <AppText style={styles.arrowText}>›</AppText>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={`${f.label}${query.data ? ` (${count(f.key)})` : ""}`} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />}
      >
        {query.isError ? <ErrorBanner message="Randevular yüklenemedi. Aşağı çekerek yenileyin." /> : null}
        {!query.isLoading && !query.isError && list.length === 0 ? (
          <EmptyState
            title={filter === "all" ? "Bu gün için randevu yok" : "Bu filtrede randevu yok"}
            description={filter === "all" ? "Telefonla alınan randevuları + Yeni ile ekleyebilirsiniz." : undefined}
          />
        ) : null}
        {list.map((apt) => (
          <AppointmentCard key={apt.id} apt={apt} staffList={staff.data ?? []} actions={actions} />
        ))}
      </ScrollView>

      <CalendarSheet
        visible={calendarOpen}
        title="Tarih seç"
        value={date}
        onSelect={setDate}
        onClose={() => setCalendarOpen(false)}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.bg },
  newBtn: { minHeight: 40, paddingHorizontal: spacing.lg },
  dayBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.bg2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  arrow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  arrowText: { fontSize: 26, color: colors.text },
  dayLabel: { flex: 1, alignItems: "center", paddingVertical: spacing.sm },
  // Yatay ScrollView varsayılan olarak kalan yüksekliği doldurur; çipler uzamasın
  filterBar: { flexGrow: 0, flexShrink: 0 },
  filters: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, alignItems: "center" },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
}));

// Alttan açılan seçim pencereleri: liste seçimi ve takvim. Ek paket gerektirmez,
// telefonda ve tarayıcı önizlemesinde aynı çalışır. Tarihler "YYYY-MM-DD" (Türkiye takvimi).
import { useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dayOfWeekOf, todayInIstanbul } from "@shared/time";
import { colors, radius, spacing } from "@/theme";

function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12}>
            <Text style={{ color: colors.text2, fontSize: 15 }}>Kapat</Text>
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

export type PickerOption = { value: string; label: string; sublabel?: string };

export function PickerSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  // Uzun listelerde (saatler) seçili değer görünsün: açılınca ona kaydır
  const selectedIndex = selected != null ? options.findIndex((o) => o.value === selected) : -1;
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight: 420 }}
        onContentSizeChange={() => {
          if (selectedIndex > 2 && !options[selectedIndex]?.sublabel) {
            scrollRef.current?.scrollTo({ y: (selectedIndex - 2) * OPTION_HEIGHT, animated: false });
          }
        }}
      >
        {options.length === 0 ? <Text style={{ color: colors.text3, padding: spacing.lg }}>Seçenek yok.</Text> : null}
        {options.map((o) => {
          const active = o.value === selected;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                onSelect(o.value);
                onClose();
              }}
              style={({ pressed }) => [styles.option, active && { backgroundColor: colors.accentDim2 }, pressed && { opacity: 0.7 }]}
            >
              <Text style={{ color: active ? colors.accent : colors.text, fontSize: 16, fontWeight: active ? "700" : "500" }}>{o.label}</Text>
              {o.sublabel ? <Text style={{ color: colors.text3, fontSize: 12, marginTop: 2 }}>{o.sublabel}</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

// Alt metni olmayan seçeneklerin sabit yüksekliği (kaydırma hesabı için)
const OPTION_HEIGHT = 52;

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function monthOf(dateStr: string) {
  const [y, m] = dateStr.split("-").map(Number);
  return { y, m };
}
const pad = (n: number) => String(n).padStart(2, "0");

export function CalendarSheet({
  visible,
  title,
  value,
  minDate,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  value: string;
  minDate?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const [cursor, setCursor] = useState(() => monthOf(value || todayInIstanbul()));
  const today = todayInIstanbul();

  const first = `${cursor.y}-${pad(cursor.m)}-01`;
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m, 0)).getUTCDate();
  const leading = (dayOfWeekOf(first) + 6) % 7; // Pazartesi başlangıçlı
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${cursor.y}-${pad(cursor.m)}-${pad(i + 1)}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const shiftMonth = (delta: number) => {
    const idx = cursor.y * 12 + (cursor.m - 1) + delta;
    setCursor({ y: Math.floor(idx / 12), m: (idx % 12) + 1 });
  };

  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <View style={styles.monthNav}>
        <Pressable accessibilityRole="button" accessibilityLabel="Önceki ay" onPress={() => shiftMonth(-1)} hitSlop={12}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
          {MONTHS[cursor.m - 1]} {cursor.y}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Sonraki ay" onPress={() => shiftMonth(1)} hitSlop={12}>
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={[styles.cell, { color: colors.text3, fontSize: 12 }]}>
            {w}
          </Text>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.cell} />;
          const disabled = !!minDate && d < minDate;
          const selected = d === value;
          const isToday = d === today;
          return (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityLabel={d}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => {
                onSelect(d);
                onClose();
              }}
              style={styles.cell}
            >
              <View style={[styles.dayCircle, selected && { backgroundColor: colors.accent }, !selected && isToday && { borderColor: colors.accent, borderWidth: 1 }]}>
                <Text style={{ color: selected ? colors.onAccent : disabled ? colors.text3 : colors.text, fontWeight: selected ? "800" : "500" }}>
                  {Number(d.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          onSelect(today);
          onClose();
        }}
        style={{ alignSelf: "center", padding: spacing.md }}
      >
        <Text style={{ color: colors.accent, fontWeight: "700" }}>Bugün</Text>
      </Pressable>
    </Sheet>
  );
}

/** 15 dakikalık saat seçenekleri ("HH:mm"); varsayılan 07:00–23:45 */
export function timeOptions(from = "07:00", to = "23:45"): PickerOption[] {
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const out: PickerOption[] = [];
  for (let t = fh * 60 + fm; t <= th * 60 + tm; t += 15) {
    const v = `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
    out.push({ value: v, label: v });
  }
  return out;
}


const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: colors.bg2,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border2, marginTop: spacing.sm },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.md },
  title: { color: colors.text, fontSize: 17, fontWeight: "700" },
  option: { minHeight: OPTION_HEIGHT, justifyContent: "center", paddingVertical: 12, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  monthNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm },
  navArrow: { color: colors.text, fontSize: 28, paddingHorizontal: spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, height: 44, alignItems: "center", justifyContent: "center", textAlign: "center" },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});

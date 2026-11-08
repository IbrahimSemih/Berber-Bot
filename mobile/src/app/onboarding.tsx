// Dükkan kurulumu (web: app/onboarding). Dükkan sunucuda oluşturulur: POST /api/mobile/v1/shop
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isValidTimeString, timeToMinutes } from "@shared/time";
import type { CreateShopRequest, CreateShopResponse } from "@shared/api-types";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AppText, Button, Card, ErrorBanner, Input, Screen } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

const DAYS = [
  { id: 1, label: "Pzt" },
  { id: 2, label: "Sal" },
  { id: 3, label: "Çar" },
  { id: 4, label: "Per" },
  { id: 5, label: "Cum" },
  { id: 6, label: "Cmt" },
  { id: 0, label: "Paz" },
];

export default function OnboardingScreen() {
  const { refreshShop, signOut, session } = useAuth();
  const [shopName, setShopName] = useState("");
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("20:00");
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [staffInput, setStaffInput] = useState("");
  const [staffMembers, setStaffMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(id: number) {
    setWorkDays((days) => (days.includes(id) ? days.filter((d) => d !== id) : [...days, id]));
  }

  function addStaff() {
    const name = staffInput.trim();
    if (!name || name.length > 60 || staffMembers.includes(name)) return;
    setStaffMembers((list) => [...list, name]);
    setStaffInput("");
  }

  async function handleCreate() {
    const name = shopName.trim();
    if (name.length < 2 || name.length > 80) return setError("Dükkan adı 2-80 karakter olmalıdır.");
    if (!isValidTimeString(workStart) || !isValidTimeString(workEnd)) {
      return setError("Saatleri SS:DD biçiminde girin (ör. 09:00).");
    }
    if (timeToMinutes(workEnd) <= timeToMinutes(workStart)) {
      return setError("Kapanış saati açılış saatinden sonra olmalıdır.");
    }
    if (workDays.length === 0) return setError("En az bir çalışma günü seçin.");

    setLoading(true);
    setError(null);
    try {
      const body: CreateShopRequest = { shopName: name, workStart, workEnd, workDays, staffMembers };
      await apiFetch<CreateShopResponse>("/shop", { method: "POST", body });
      await refreshShop(); // dükkan bulununca ana ekrana geçilir
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <AppText variant="title">Hoş Geldiniz!</AppText>
      <AppText variant="muted">{"BerberBot'u kullanmaya başlamak için dükkanınızı yapılandırın."}</AppText>

      <Card>
        <AppText variant="heading">1. Temel Bilgiler</AppText>
        <Input label="Dükkan Adı" value={shopName} onChangeText={setShopName} placeholder="Örn: Maestro Berber" maxLength={80} />
      </Card>

      <Card>
        <AppText variant="heading">2. Çalışma Saatleri</AppText>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Input label="Açılış" value={workStart} onChangeText={setWorkStart} placeholder="09:00" maxLength={5} keyboardType="numbers-and-punctuation" />
          </View>
          <View style={styles.flex}>
            <Input label="Kapanış" value={workEnd} onChangeText={setWorkEnd} placeholder="20:00" maxLength={5} keyboardType="numbers-and-punctuation" />
          </View>
        </View>
        <AppText variant="label">Çalışma Günleri</AppText>
        <View style={styles.chips}>
          {DAYS.map((day) => {
            const active = workDays.includes(day.id);
            return (
              <Pressable
                key={day.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                onPress={() => toggleDay(day.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <AppText style={{ color: active ? colors.onAccent : colors.text2, fontWeight: "700" }}>{day.label}</AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <AppText variant="heading">3. Personeller</AppText>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Input value={staffInput} onChangeText={setStaffInput} placeholder="Personel Adı (Örn: Ahmet)" onSubmitEditing={addStaff} maxLength={60} />
          </View>
          <Button title="Ekle" variant="secondary" onPress={addStaff} style={{ paddingHorizontal: spacing.xl }} />
        </View>
        {staffMembers.map((name) => (
          <View key={name} style={styles.staffRow}>
            <AppText>{name}</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${name} personelini kaldır`}
              onPress={() => setStaffMembers((list) => list.filter((n) => n !== name))}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color={colors.text2} />
            </Pressable>
          </View>
        ))}
        <AppText variant="small">{'Hiç personel eklemezseniz "İşletme Sahibi" adında varsayılan bir personel oluşturulur.'}</AppText>
      </Card>

      {/* Form uzun: hata gönder butonunun yanında görünsün */}
      <ErrorBanner message={error} />
      <Button title="Dükkanımı Oluştur ve Başla" onPress={handleCreate} loading={loading} />
      <AppText variant="small" style={{ textAlign: "center" }}>
        {session?.user.email} ile giriş yaptınız.
      </AppText>
      <Button title="Farklı hesapla giriş yap" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.bg3,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  staffRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
});

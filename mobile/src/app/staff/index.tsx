// Personeller (web: app/staff). Liste, müsaitlik anahtarı, plan limiti kontrolüyle ekleme.
import { useState } from "react";
import { RefreshControl, ScrollView, Switch, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dbErrorMessage, formatPhone } from "@/lib/format";
import { qk, useShopLimits, useStaff, type Staff } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { AppText, Button, Card, Divider, EmptyState, ErrorBanner, ListRow } from "@/components/ui";
import { useToast } from "@/components/toast";
import { colors, spacing } from "@/theme";

export default function StaffListScreen() {
  const { shop } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const staff = useStaff();
  const limits = useShopLimits();
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleActive(s: Staff) {
    if (!shop) return;
    setToggling(s.id);
    const next = !s.is_active;
    // İyimser güncelleme
    queryClient.setQueryData<Staff[]>(qk.staff(shop.id), (prev) => prev?.map((x) => (x.id === s.id ? { ...x, is_active: next } : x)));
    const { error } = await supabase.from("staff").update({ is_active: next }).eq("id", s.id).eq("shop_id", shop.id);
    setToggling(null);
    if (error) toast(dbErrorMessage(error, "Durum güncellenemedi."), "error");
    else toast(next ? "Personel aktif edildi." : "Personel pasife alındı; yeni randevularda görünmez.");
    queryClient.invalidateQueries({ queryKey: qk.staff(shop.id) });
  }

  function addStaff() {
    if (limits.data && !limits.data.canAddStaff) {
      toast(
        `Planınız (${limits.data.plan.name}) en fazla ${limits.data.limits.staff} personele izin veriyor.`,
        "error"
      );
      return;
    }
    if (limits.isError) toast(errorMessage(limits.error), "error");
    router.push({ pathname: "/staff/[id]", params: { id: "new" } });
  }

  const list = staff.data ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      refreshControl={<RefreshControl refreshing={staff.isRefetching} onRefresh={() => void staff.refetch()} tintColor={colors.accent} />}
    >
      <Button title="+ Yeni Personel" onPress={addStaff} />
      {staff.isError ? <ErrorBanner message="Personeller yüklenemedi." /> : null}
      <Card style={{ paddingVertical: 0 }}>
        {!staff.isLoading && list.length === 0 ? <EmptyState title="Henüz personel yok" /> : null}
        {list.map((s, i) => (
          <View key={s.id}>
            {i > 0 ? <Divider /> : null}
            <ListRow
              title={s.name}
              subtitle={[s.phone ? formatPhone(s.phone) : null, s.is_active ? "Aktif" : "Pasif (randevu almaz)"].filter(Boolean).join(" · ")}
              onPress={() => router.push({ pathname: "/staff/[id]", params: { id: s.id } })}
              right={
                <Switch
                  accessibilityLabel={`${s.name} aktif`}
                  value={s.is_active}
                  disabled={toggling === s.id}
                  onValueChange={() => toggleActive(s)}
                  trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                  thumbColor={s.is_active ? colors.switchThumbOn : colors.switchThumbOff}
                />
              }
            />
          </View>
        ))}
      </Card>
      <AppText variant="small">
        Pasif personel online randevu sayfasında seçilemez. Belirli günler için izin eklemek için personele dokunun.
      </AppText>
    </ScrollView>
  );
}

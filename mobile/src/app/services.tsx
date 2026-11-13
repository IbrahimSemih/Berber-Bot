// Hizmetler (web: app/settings → Hizmetler). Ekle/düzenle; kaldırma = pasife alma
// (geçmiş randevular ve ciro raporları kaybolmasın diye silinmez, web ile aynı).
import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { dbErrorMessage, formatPrice } from "@/lib/format";
import { qk, useServices, type Service } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { AppText, Button, Card, Chip, Divider, EmptyState, ErrorBanner, Input, ListRow } from "@/components/ui";
import { useToast } from "@/components/toast";
import { spacing } from "@/theme";
import { useColors } from "@/lib/theme";

const DURATION_OPTIONS = [10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 105, 120, 150, 180, 240];

type Draft = { id: string | null; name: string; duration: number; price: string };

export default function ServicesScreen() {
  const colors = useColors();
  const { shop } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const services = useServices();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (s: Service | null) => {
    setError(null);
    setDraft(s ? { id: s.id, name: s.name, duration: s.duration_minutes, price: String(s.price) } : { id: null, name: "", duration: 30, price: "" });
  };

  async function save() {
    if (!shop || !draft) return;
    const name = draft.name.trim();
    const price = Number(draft.price.replace(",", "."));
    if (!name || name.length > 80) return setError("Hizmet adı 1-80 karakter olmalıdır.");
    if (!Number.isFinite(price) || price < 0 || price > 100000) return setError("Geçerli bir fiyat girin.");
    setSaving(true);
    setError(null);
    const payload = { name, duration_minutes: draft.duration, price };
    const { error: dbError } = draft.id
      ? await supabase.from("services").update(payload).eq("id", draft.id).eq("shop_id", shop.id)
      : await supabase.from("services").insert({ ...payload, shop_id: shop.id, is_active: true });
    setSaving(false);
    if (dbError) return setError(dbErrorMessage(dbError, "Hizmet kaydedilemedi."));
    queryClient.invalidateQueries({ queryKey: qk.services(shop.id) });
    toast(draft.id ? "Hizmet güncellendi." : "Hizmet eklendi.");
    setDraft(null);
  }

  async function deactivate(s: Service) {
    if (!shop) return;
    const ok = await confirmAction({
      title: `"${s.name}" kaldırılsın mı?`,
      message: "Geçmiş randevular korunur; yeni randevularda bu hizmet görünmez.",
      confirmText: "Kaldır",
      destructive: true,
    });
    if (!ok) return;
    const { error: dbError } = await supabase.from("services").update({ is_active: false }).eq("id", s.id).eq("shop_id", shop.id);
    if (dbError) return toast(dbErrorMessage(dbError, "Hizmet kaldırılamadı."), "error");
    queryClient.invalidateQueries({ queryKey: qk.services(shop.id) });
    toast("Hizmet kaldırıldı.");
    setDraft(null);
  }

  const list = services.data ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={services.isRefetching} onRefresh={() => void services.refetch()} tintColor={colors.accent} />}
    >
      {draft ? (
        <Card style={{ gap: spacing.md }}>
          <AppText variant="heading">{draft.id ? "Hizmeti düzenle" : "Yeni hizmet"}</AppText>
          <Input label="Hizmet adı" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="Saç Kesimi" maxLength={80} />
          <Input
            label="Fiyat (₺)"
            value={draft.price}
            onChangeText={(price) => setDraft({ ...draft, price })}
            placeholder="150"
            keyboardType="decimal-pad"
          />
          <AppText variant="label">Süre</AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {DURATION_OPTIONS.map((d) => (
              <Chip key={d} label={`${d} dk`} active={draft.duration === d} onPress={() => setDraft({ ...draft, duration: d })} />
            ))}
          </View>
          <ErrorBanner message={error} />
          <Button title="Kaydet" onPress={save} loading={saving} />
          {draft.id ? (
            <Button title="Hizmeti kaldır" variant="danger" onPress={() => deactivate(list.find((s) => s.id === draft.id)!)} />
          ) : null}
          <Button title="Vazgeç" variant="ghost" onPress={() => setDraft(null)} />
        </Card>
      ) : (
        <Button title="+ Yeni Hizmet" onPress={() => startEdit(null)} />
      )}

      {services.isError ? <ErrorBanner message="Hizmetler yüklenemedi." /> : null}
      <Card style={{ paddingVertical: 0 }}>
        {!services.isLoading && list.length === 0 ? (
          <EmptyState title="Henüz hizmet yok" description="Müşteriler randevu alırken hizmet seçer; en az bir hizmet ekleyin." />
        ) : null}
        {list.map((s, i) => (
          <View key={s.id}>
            {i > 0 ? <Divider /> : null}
            <ListRow
              title={s.name}
              subtitle={`${s.duration_minutes} dk`}
              onPress={() => startEdit(s)}
              right={<AppText style={{ color: colors.accent, fontWeight: "700" }}>{formatPrice(s.price)}</AppText>}
            />
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

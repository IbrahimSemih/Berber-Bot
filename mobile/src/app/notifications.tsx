// Bildirimler (web: app/notifications). Okundu işaretle, tümünü okundu say, temizle.
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { formatTrDateTime } from "@shared/time";
import { useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { dbErrorMessage } from "@/lib/format";
import { qk, useNotifications, type NotificationRow } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { AppText, Button, Card, EmptyState, ErrorBanner } from "@/components/ui";
import { useToast } from "@/components/toast";
import { colors, spacing } from "@/theme";

export default function NotificationsScreen() {
  const { shop } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useNotifications();
  const list = query.data ?? [];
  const unread = list.filter((n) => !n.is_read).length;

  const refresh = () => shop && queryClient.invalidateQueries({ queryKey: qk.notifications(shop.id) });

  async function markRead(n: NotificationRow) {
    if (!shop || n.is_read) return;
    queryClient.setQueryData<NotificationRow[]>(qk.notifications(shop.id), (prev) => prev?.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", n.id).eq("shop_id", shop.id);
  }

  async function markAllRead() {
    if (!shop) return;
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("shop_id", shop.id).eq("is_read", false);
    if (error) toast(dbErrorMessage(error), "error");
    refresh();
  }

  async function clearAll() {
    if (!shop) return;
    const ok = await confirmAction({ title: "Tüm bildirimler silinsin mi?", confirmText: "Sil", destructive: true });
    if (!ok) return;
    const { error } = await supabase.from("notifications").delete().eq("shop_id", shop.id);
    if (error) toast(dbErrorMessage(error), "error");
    else toast("Bildirimler silindi.");
    refresh();
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: unread ? `Bildirimler (${unread})` : "Bildirimler" }} />
      {list.length > 0 ? (
        <View style={styles.toolbar}>
          <Button title="Tümü okundu" variant="secondary" onPress={markAllRead} disabled={unread === 0} style={styles.toolBtn} />
          <Button title="Temizle" variant="ghost" onPress={clearAll} style={styles.toolBtn} />
        </View>
      ) : null}
      {query.isError ? (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <ErrorBanner message="Bildirimler yüklenemedi." />
        </View>
      ) : null}
      <FlatList
        data={list}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />}
        ListEmptyComponent={query.isLoading ? undefined : <EmptyState title="Bildirim yok" description="Yeni randevu ve iptaller burada görünür." />}
        renderItem={({ item: n }) => (
          <Pressable accessibilityRole="button" onPress={() => markRead(n)}>
            <Card style={[styles.card, !n.is_read && { borderColor: colors.accent }]}>
              <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
                {!n.is_read ? <View style={styles.dot} /> : null}
                <AppText style={{ flex: 1, color: n.is_read ? colors.text2 : colors.text }}>{n.message}</AppText>
              </View>
              <AppText variant="small">{formatTrDateTime(n.created_at)}</AppText>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  toolbar: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  toolBtn: { flex: 1, minHeight: 40 },
  list: { padding: spacing.xl, gap: spacing.md },
  card: { gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 7 },
});

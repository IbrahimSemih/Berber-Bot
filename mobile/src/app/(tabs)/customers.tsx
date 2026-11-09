// Müşteriler (web: app/customers). Arama, istatistik, arama/WhatsApp, KVKK silme, CSV paylaşımı.
import { useMemo, useState } from "react";
import { FlatList, Linking, Platform, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { formatTrLongDate, todayInIstanbul } from "@shared/time";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { formatPhone, formatPrice, isAnonymizedPhone } from "@/lib/format";
import { useCustomers, type CustomerRow } from "@/lib/queries";
import { PickerSheet } from "@/components/sheets";
import { AppText, Button, Card, EmptyState, ErrorBanner, Input } from "@/components/ui";
import { useToast } from "@/components/toast";
import { colors, spacing } from "@/theme";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Web ile aynı biçim: Excel (Türkçe) uyumlu, UTF-8 BOM + noktalı virgül */
function buildCsv(rows: CustomerRow[]) {
  const header = ["Ad Soyad", "Telefon", "Toplam Randevu", "Son Ziyaret", "Favori Hizmet", "Toplam Harcama (TL)", "Kayıt Tarihi"];
  const lines = rows
    .filter((c) => !isAnonymizedPhone(c.phone))
    .map((c) =>
      [
        c.name || "",
        c.phone,
        c.totalAppointments,
        c.lastVisit ? formatTrLongDate(c.lastVisit) : "",
        c.favoriteService ?? "",
        c.totalSpent,
        formatTrLongDate(c.created_at),
      ]
        .map(csvCell)
        .join(";")
    );
  return "﻿" + [header.join(";"), ...lines].join("\r\n");
}

/** "+905321234567" → WhatsApp için "905321234567" */
const waNumber = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "90");

export default function CustomersScreen() {
  const { shop } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useCustomers();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const list = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    const digits = q.replace(/\D/g, "");
    const rows = query.data ?? [];
    if (!q) return rows;
    return rows.filter(
      (c) => (c.name ?? "").toLocaleLowerCase("tr-TR").includes(q) || (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits))
    );
  }, [query.data, search]);

  async function anonymize(c: CustomerRow) {
    const ok = await confirmAction({
      title: "Müşteri verileri silinsin mi?",
      message: `${c.name || "Bu müşteri"} için ad ve telefon kalıcı olarak silinecek, ileri tarihli randevuları iptal edilecek. Randevu geçmişi istatistiklerde isimsiz kalır. Bu işlem geri alınamaz.`,
      confirmText: "Evet, sil",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/customers/${c.id}/anonymize`, { method: "POST" });
      toast("Müşteri verileri silindi.");
      if (shop) {
        queryClient.invalidateQueries({ queryKey: ["customers", shop.id] });
        queryClient.invalidateQueries({ queryKey: ["appointments", shop.id] });
      }
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  }

  async function exportCsv() {
    const rows = query.data ?? [];
    if (rows.length === 0) return;
    setExporting(true);
    try {
      const csv = buildCsv(rows);
      const fileName = `musteriler-${todayInIstanbul()}.csv`;
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      const file = new File(Paths.cache, fileName);
      if (file.exists) file.delete();
      file.create();
      await file.write(csv);
      await Sharing.shareAsync(file.uri, { mimeType: "text/csv", dialogTitle: "Müşteri listesi", UTI: "public.comma-separated-values-text" });
    } catch (e) {
      toast("Liste paylaşılamadı.", "error");
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  const actionsFor = (c: CustomerRow) => {
    const anonymized = isAnonymizedPhone(c.phone);
    const opts = anonymized
      ? []
      : [
          { value: "call", label: "Ara", sublabel: formatPhone(c.phone) },
          { value: "whatsapp", label: "WhatsApp'tan yaz" },
          { value: "delete", label: "Verileri sil (KVKK)", sublabel: "Ad ve telefon kalıcı olarak silinir" },
        ];
    return opts;
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <AppText variant="title">Müşteriler</AppText>
        <Button title="CSV" variant="secondary" onPress={exportCsv} loading={exporting} disabled={!query.data?.length} style={styles.csvBtn} />
      </View>
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <Input value={search} onChangeText={setSearch} placeholder="İsim veya telefon ara" autoCorrect={false} clearButtonMode="while-editing" />
      </View>
      {query.isError ? (
        <View style={{ paddingHorizontal: spacing.xl }}>
          <ErrorBanner message="Müşteriler yüklenemedi. Aşağı çekerek yenileyin." />
        </View>
      ) : null}
      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />}
        ListEmptyComponent={
          query.isLoading ? undefined : (
            <EmptyState
              title={search ? "Sonuç bulunamadı" : "Henüz müşteri yok"}
              description={search ? undefined : "Randevu alan müşteriler burada listelenir."}
            />
          )
        }
        renderItem={({ item: c }) => {
          const anonymized = isAnonymizedPhone(c.phone);
          return (
            <Card style={[styles.card, anonymized && { opacity: 0.5 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: "700" }} numberOfLines={1}>
                    {c.name || "İsimsiz"}
                  </AppText>
                  <AppText variant="small">{anonymized ? "Verileri silindi" : formatPhone(c.phone)}</AppText>
                </View>
                {!anonymized ? (
                  <Button title="İşlemler" variant="secondary" onPress={() => setSelected(c)} style={styles.moreBtn} />
                ) : null}
              </View>
              <View style={styles.stats}>
                <AppText variant="small">{c.totalAppointments} randevu</AppText>
                <AppText variant="small">Son: {c.lastVisit ? formatTrLongDate(c.lastVisit) : "—"}</AppText>
                <AppText variant="small" style={{ color: colors.accent }}>
                  {formatPrice(c.totalSpent)}
                </AppText>
              </View>
              {c.favoriteService ? <AppText variant="small">Favori: {c.favoriteService}</AppText> : null}
            </Card>
          );
        }}
      />

      <PickerSheet
        visible={!!selected}
        title={selected?.name || "Müşteri"}
        options={selected ? actionsFor(selected) : []}
        onSelect={(action) => {
          const c = selected;
          if (!c) return;
          if (action === "call") Linking.openURL(`tel:${c.phone}`);
          else if (action === "whatsapp") Linking.openURL(`https://wa.me/${waNumber(c.phone)}`);
          else if (action === "delete") void anonymize(c);
        }}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  csvBtn: { minHeight: 38, paddingHorizontal: spacing.lg },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  card: { gap: spacing.xs },
  stats: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  moreBtn: { minHeight: 36, paddingHorizontal: spacing.md },
});

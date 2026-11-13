// Randevu linki ve QR (web: components/BookingLinkCard + app/settings/qr).
// Link düzenleme sunucuda (PATCH /shop/slug); QR görseli paylaşılabilir.
import { useRef, useState } from "react";
import { Platform, ScrollView, Share, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { validateSlug } from "@shared/slug";
import type { UpdateSlugResponse } from "@shared/api-types";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { config } from "@/lib/config";
import { AppText, Button, Card, ErrorBanner, Input } from "@/components/ui";
import { useToast } from "@/components/toast";
import { radius, spacing } from "@/theme";
import { useColors } from "@/lib/theme";

export default function BookingLinkScreen() {
  const colors = useColors();
  const { shop, refreshShop } = useAuth();
  const toast = useToast();
  const qrRef = useRef<any>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(shop?.slug ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharingQr, setSharingQr] = useState(false);

  if (!shop) return null;
  const url = `${config.siteUrl}/${shop.slug}`;
  const displayUrl = url.replace(/^https?:\/\//, "");

  async function saveSlug() {
    const slug = draft.trim().toLowerCase();
    const invalid = validateSlug(slug);
    if (invalid) return setError(invalid);
    setSaving(true);
    setError(null);
    try {
      await apiFetch<UpdateSlugResponse>("/shop/slug", { method: "PATCH", body: { slug } });
      await refreshShop();
      setEditing(false);
      toast("Randevu linkiniz güncellendi. Eski link artık çalışmaz.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function shareQr() {
    if (Platform.OS === "web" || !qrRef.current) {
      toast("QR paylaşımı yalnızca telefonda kullanılabilir.", "info");
      return;
    }
    setSharingQr(true);
    // react-native-qrcode-svg görseli base64 PNG olarak verir
    qrRef.current.toDataURL(async (base64: string) => {
      try {
        const file = new File(Paths.cache, `randevu-qr-${shop!.slug}.png`);
        if (file.exists) file.delete();
        file.create();
        await file.write(base64, { encoding: "base64" });
        await Sharing.shareAsync(file.uri, { mimeType: "image/png", dialogTitle: "Randevu QR kodu" });
      } catch (e) {
        console.error(e);
        toast("QR kodu paylaşılamadı.", "error");
      } finally {
        setSharingQr(false);
      }
    });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
      <Card style={{ alignItems: "center", gap: spacing.md }}>
        <View style={{ backgroundColor: "#fff", padding: spacing.lg, borderRadius: radius.md }}>
          <QRCode value={url} size={200} quietZone={12} getRef={(c: any) => (qrRef.current = c)} backgroundColor="#ffffff" color="#1F2421" />
        </View>
        <AppText selectable style={{ color: colors.accent, fontWeight: "700", textAlign: "center" }}>
          {displayUrl}
        </AppText>
        <AppText variant="small" style={{ textAlign: "center" }}>
          {"Müşterileriniz bu linkten veya QR kodu okutarak randevu alır. QR'ı yazdırıp dükkanınıza asabilirsiniz."}
        </AppText>
      </Card>

      <Button title="Linki paylaş" onPress={() => Share.share({ message: `Online randevu almak için: ${url}` })} />
      <Button title="QR kodu paylaş" variant="secondary" onPress={shareQr} loading={sharingQr} />

      <Card style={{ gap: spacing.md }}>
        <AppText variant="heading">Linki düzenle</AppText>
        {editing ? (
          <>
            <Input
              label={`${config.siteUrl.replace(/^https?:\/\//, "")}/`}
              value={draft}
              onChangeText={(v) => setDraft(v.toLowerCase())}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={40}
            />
            <AppText variant="small">Küçük harf, rakam ve tire kullanın. Link değişince eski link ve basılı QR kodları çalışmaz.</AppText>
            <ErrorBanner message={error} />
            <Button title="Kaydet" onPress={saveSlug} loading={saving} />
            <Button
              title="Vazgeç"
              variant="ghost"
              onPress={() => {
                setEditing(false);
                setDraft(shop.slug);
                setError(null);
              }}
            />
          </>
        ) : (
          <Button title="Linki değiştir" variant="secondary" onPress={() => setEditing(true)} />
        )}
      </Card>
    </ScrollView>
  );
}

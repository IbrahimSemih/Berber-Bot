// Menü: dükkan bilgisi, randevu linki, hesap ve tanılama. Profil ekranları Faz 3'te.
import { useMemo } from "react";
import { Share, View } from "react-native";
import Constants from "expo-constants";
import { formatTrLongDate } from "@shared/time";
import { useAuth } from "@/lib/auth";
import { config } from "@/lib/config";
import { checkIstanbulTimeZone } from "@/lib/tz-check";
import { AppText, Button, Card, Screen } from "@/components/ui";
import { colors } from "@/theme";

export default function MoreScreen() {
  const { shop, session, accessEndsAt, signOut } = useAuth();
  const bookingUrl = shop ? `${config.siteUrl}/${shop.slug}` : "";
  const tz = useMemo(() => checkIstanbulTimeZone(), []);

  const subscriptionText =
    shop?.subscription_status === "trialing"
      ? `Ücretsiz deneme${accessEndsAt ? ` · ${formatTrLongDate(accessEndsAt)} tarihine kadar` : ""}`
      : shop?.subscription_status === "active"
        ? `Pro${accessEndsAt ? ` · ${formatTrLongDate(accessEndsAt)} tarihine kadar` : ""}`
        : "Abonelik yok";

  return (
    <Screen edges={["top"]}>
      <AppText variant="title">Daha fazla</AppText>

      <Card>
        <AppText variant="label">Dükkan</AppText>
        <AppText variant="heading">{shop?.name}</AppText>
        <AppText variant="muted">{subscriptionText}</AppText>
      </Card>

      <Card>
        <AppText variant="label">Randevu linki</AppText>
        <AppText selectable style={{ color: colors.accent }}>{bookingUrl}</AppText>
        <AppText variant="small">Müşterileriniz bu linkten kendi randevularını alır.</AppText>
        <Button
          title="Linki paylaş"
          variant="secondary"
          onPress={() => Share.share({ message: `Online randevu almak için: ${bookingUrl}` })}
        />
      </Card>

      <Card>
        <AppText variant="label">Hesap</AppText>
        <AppText>{session?.user.email}</AppText>
      </Card>

      <View style={{ gap: 4 }}>
        <AppText variant="small">
          Sürüm {Constants.expoConfig?.version ?? "?"} · Saat dilimi {tz.ok ? "doğru" : `HATALI (${tz.detail})`}
        </AppText>
      </View>

      <Button title="Çıkış yap" variant="danger" onPress={signOut} />
    </Screen>
  );
}

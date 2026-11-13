// Menü: dükkan yönetimi ekranları, hesap ve uygulama bilgisi.
import { useColors, useTheme, type ThemePref } from "@/lib/theme";
import { useMemo } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import Constants from "expo-constants";
import { formatTrLongDate } from "@shared/time";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/queries";
import { checkIstanbulTimeZone } from "@/lib/tz-check";
import { AppText, Badge, Button, Card, Chip, Divider, HeroHeader, ListRow, Screen } from "@/components/ui";

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "system", label: "Sistem" },
  { value: "light", label: "Açık" },
  { value: "dark", label: "Koyu" },
];

export default function MoreScreen() {
  const { pref, setPref } = useTheme();
  const colors = useColors();
  const { shop, session, accessEndsAt, signOut } = useAuth();
  const notifications = useNotifications();
  const unread = (notifications.data ?? []).filter((n) => !n.is_read).length;
  const tz = useMemo(() => checkIstanbulTimeZone(), []);

  const subscriptionText =
    shop?.subscription_status === "trialing"
      ? `Ücretsiz deneme${accessEndsAt ? ` · ${formatTrLongDate(accessEndsAt)} tarihine kadar` : ""}`
      : shop?.subscription_status === "active"
        ? `Pro${accessEndsAt ? ` · ${formatTrLongDate(accessEndsAt)} tarihine kadar` : ""}`
        : "Abonelik yok";

  const items: { title: string; subtitle?: string; href: Href; right?: React.ReactNode }[] = [
    {
      title: "Bildirimler",
      href: "/notifications",
      right: unread > 0 ? <Badge label={String(unread)} color={colors.accent} /> : undefined,
    },
    { title: "Randevu linki ve QR", subtitle: shop ? `/${shop.slug}` : undefined, href: "/booking-link" },
    { title: "Personeller", subtitle: "Müsaitlik ve izinler", href: "/staff" as Href },
    { title: "Hizmetler", subtitle: "Fiyat ve süreler", href: "/services" },
    { title: "Dükkan ayarları", subtitle: "Çalışma saatleri, otomatik onay, bildirimler", href: "/shop-settings" },
    { title: "Abonelik", subtitle: shop?.subscription_status === "active" ? "Pro" : "Pro'ya geç", href: "/subscription" },
    { title: "Profil", subtitle: session?.user.email, href: "/profile" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <HeroHeader title="Daha fazla" />
    <Screen edges={[]}>

      <Card>
        <AppText variant="label">Dükkan</AppText>
        <AppText variant="heading">{shop?.name}</AppText>
        <AppText variant="muted">{subscriptionText}</AppText>
      </Card>

      <Card style={{ paddingVertical: 0 }}>
        {items.map((item, i) => (
          <View key={item.title}>
            {i > 0 ? <Divider /> : null}
            <ListRow
              title={item.title}
              subtitle={item.subtitle}
              onPress={() => router.push(item.href)}
              right={
                item.right ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {item.right}
                    <AppText style={{ color: colors.text3, fontSize: 20 }}>›</AppText>
                  </View>
                ) : undefined
              }
            />
          </View>
        ))}
      </Card>

      <Card>
        <AppText variant="label">Görünüm</AppText>
        <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup">
          {THEME_OPTIONS.map((o) => (
            <Chip key={o.value} label={o.label} active={pref === o.value} onPress={() => setPref(o.value)} />
          ))}
        </View>
        <AppText variant="small">Sistem: telefonun açık/koyu ayarını izler.</AppText>
      </Card>

      <AppText variant="small">
        Sürüm {Constants.expoConfig?.version ?? "?"} · Saat dilimi {tz.ok ? "doğru" : `HATALI (${tz.detail})`}
      </AppText>

      <Button title="Çıkış yap" variant="danger" onPress={signOut} />
    </Screen>
    </View>
  );
}

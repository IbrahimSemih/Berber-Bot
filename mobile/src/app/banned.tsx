import { useAuth } from "@/lib/auth";
import { useColors } from "@/lib/theme";
import { AppText, Button, Card, Screen } from "@/components/ui";

export default function BannedScreen() {
  const colors = useColors();
  const { signOut, refreshShop } = useAuth();
  return (
    <Screen contentStyle={{ justifyContent: "center" }}>
      <Card style={{ borderColor: colors.redBorder }}>
        <AppText variant="heading" style={{ color: colors.red }}>Hesabınız askıya alındı</AppText>
        <AppText variant="muted">
          Hesabınız kullanım koşullarına aykırılık nedeniyle askıya alınmıştır. Bunun bir hata olduğunu
          düşünüyorsanız destek ekibimizle iletişime geçin.
        </AppText>
      </Card>
      <Button title="Durumu yenile" variant="secondary" onPress={refreshShop} />
      <Button title="Çıkış yap" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

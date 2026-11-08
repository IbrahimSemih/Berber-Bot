// Deneme veya abonelik süresi dolduğunda. Mağaza üzerinden satın alma (RevenueCat)
// Faz 4'te eklenecek. Apple 3.1.1: iOS'ta web'den satın almaya yönlendiren link/metin OLMAMALI.
import { useState } from "react";
import { TRIAL_DAYS } from "@shared/plan";
import { formatTrLongDate } from "@shared/time";
import { useAuth } from "@/lib/auth";
import { AppText, Button, Card, Screen } from "@/components/ui";
import { colors } from "@/theme";

export default function PaywallScreen() {
  const { shop, accessEndsAt, refreshShop, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const wasTrial = shop?.subscription_status === "trialing";

  return (
    <Screen contentStyle={{ justifyContent: "center" }}>
      <AppText variant="title">{wasTrial ? "Deneme süreniz doldu" : "Aboneliğiniz sona erdi"}</AppText>
      <AppText variant="muted">
        {wasTrial
          ? `${TRIAL_DAYS} günlük ücretsiz deneme süreniz${accessEndsAt ? ` ${formatTrLongDate(accessEndsAt)} tarihinde` : ""} sona erdi.`
          : `Aboneliğiniz${accessEndsAt ? ` ${formatTrLongDate(accessEndsAt)} tarihinde` : ""} sona erdi.`}{" "}
        Randevu sayfanız ve paneliniz abonelik başlatılana kadar kapalı kalır. Verileriniz silinmez.
      </AppText>
      <Card style={{ borderColor: colors.accent }}>
        <AppText variant="heading">BerberBot Pro</AppText>
        <AppText variant="muted">Sınırsız randevu, personel ve WhatsApp bildirimleri.</AppText>
        <AppText variant="small">Uygulama içi abonelik çok yakında burada olacak.</AppText>
      </Card>
      <Button
        title="Durumu yenile"
        variant="secondary"
        loading={refreshing}
        onPress={async () => {
          setRefreshing(true);
          await refreshShop();
          setRefreshing(false);
        }}
      />
      <Button title="Çıkış yap" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

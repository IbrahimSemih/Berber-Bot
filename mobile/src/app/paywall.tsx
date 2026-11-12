// Deneme veya abonelik süresi dolduğunda. Mağaza üzerinden satın alma (RevenueCat).
// Apple 3.1.1: iOS'ta web'den satın almaya yönlendiren link/metin OLMAMALI.
import { useState } from "react";
import { router } from "expo-router";
import { TRIAL_DAYS } from "@shared/plan";
import { formatTrLongDate } from "@shared/time";
import { useAuth } from "@/lib/auth";
import { SubscriptionPlans } from "@/components/subscription-plans";
import { AppText, Button, Screen } from "@/components/ui";

export default function PaywallScreen() {
  const { shop, accessEndsAt, refreshShop, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const wasTrial = shop?.subscription_status === "trialing";

  return (
    <Screen>
      <AppText variant="title">{wasTrial ? "Deneme süreniz doldu" : "Aboneliğiniz sona erdi"}</AppText>
      <AppText variant="muted">
        {wasTrial
          ? `${TRIAL_DAYS} günlük ücretsiz deneme süreniz${accessEndsAt ? ` ${formatTrLongDate(accessEndsAt)} tarihinde` : ""} sona erdi.`
          : `Aboneliğiniz${accessEndsAt ? ` ${formatTrLongDate(accessEndsAt)} tarihinde` : ""} sona erdi.`}{" "}
        Randevu sayfanız ve paneliniz abonelik başlatılana kadar kapalı kalır. Verileriniz silinmez.
      </AppText>

      <AppText variant="heading">BerberBot Pro</AppText>
      <AppText variant="muted">Sınırsız randevu, personel ve WhatsApp bildirimleri.</AppText>
      <SubscriptionPlans />

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
      <Button title="Profil ve hesap" variant="ghost" onPress={() => router.push("/profile")} />
      <Button title="Çıkış yap" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

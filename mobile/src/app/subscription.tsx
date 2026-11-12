// Abonelik durumu (Daha fazla → Abonelik). Deneme sürerken abone olma, mağaza
// aboneliğini yönetme. Süre dolunca kök yerleşim paywall'a yönlendirir.
import { useState } from "react";
import { Platform } from "react-native";
import { formatTrLongDate } from "@shared/time";
import { useAuth } from "@/lib/auth";
import { openManageSubscription, purchasesAvailable } from "@/lib/purchases";
import { SubscriptionPlans } from "@/components/subscription-plans";
import { AppText, Button, Card, ErrorBanner, Screen } from "@/components/ui";

const STORE_LABEL: Record<string, string> = { app_store: "App Store", play_store: "Google Play" };

export default function SubscriptionScreen() {
  const { shop, accessEndsAt, trialDaysLeft } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const status = shop?.subscription_status;
  const provider = shop?.billing_provider ?? null;
  const storeLabel = provider ? STORE_LABEL[provider] : undefined;
  const endText = accessEndsAt ? formatTrLongDate(accessEndsAt) : null;
  // Abonelik bu platformun mağazasındaysa buradan yönetilebilir
  const manageHere =
    purchasesAvailable &&
    ((Platform.OS === "ios" && provider === "app_store") || (Platform.OS === "android" && provider === "play_store"));

  if (status === "active") {
    return (
      <Screen>
        <Card>
          <AppText variant="label">Mevcut plan</AppText>
          <AppText variant="heading">BerberBot Pro</AppText>
          <AppText variant="muted">
            {storeLabel
              ? `${storeLabel} üzerinden${endText ? `, ${endText} tarihinde ${shop?.store_will_renew === false ? "sona erecek" : "yenilenecek"}` : ""}.`
              : endText
                ? `${endText} tarihine kadar geçerli.`
                : "Aboneliğiniz etkin."}
          </AppText>
        </Card>
        <ErrorBanner message={error} />
        {manageHere ? (
          <Button
            title="Aboneliği yönet"
            variant="secondary"
            loading={opening}
            onPress={async () => {
              setError(null);
              setOpening(true);
              try {
                await openManageSubscription(shop!.id);
              } catch {
                setError("Mağaza abonelik sayfası açılamadı.");
              } finally {
                setOpening(false);
              }
            }}
          />
        ) : storeLabel ? (
          <AppText variant="small">İptal veya değişiklik için {storeLabel} abonelik ayarlarını kullanın.</AppText>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <AppText variant="label">Mevcut plan</AppText>
        <AppText variant="heading">Ücretsiz deneme</AppText>
        <AppText variant="muted">
          {trialDaysLeft !== null ? `${trialDaysLeft} gün kaldı` : "Deneme sürüyor"}
          {endText ? ` · ${endText} tarihinde sona erer.` : "."}
        </AppText>
      </Card>
      <AppText variant="muted">Deneme bitince randevu sayfanızın açık kalması için Pro&apos;ya geçin.</AppText>
      <SubscriptionPlans />
    </Screen>
  );
}

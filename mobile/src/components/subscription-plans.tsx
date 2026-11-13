// Abonelik planları ve satın alma (paywall ve Abonelik ekranında ortak).
// Apple 3.1.2: plan adı, süre, fiyat, otomatik yenileme metni, geri yükleme,
// Kullanım Koşulları ve Gizlilik linkleri. Apple 3.1.1: web'den satın almaya
// yönlendiren link/metin YOK.
import { useState } from "react";
import { Pressable, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useQuery } from "@tanstack/react-query";
import type { PurchasesPackage } from "react-native-purchases";
import { useAuth } from "@/lib/auth";
import { config } from "@/lib/config";
import {
  isPurchaseCancelled,
  loadPackages,
  purchase,
  purchaseErrorMessage,
  purchasesAvailable,
  restore,
  syncAfterPurchase,
} from "@/lib/purchases";
import { useToast } from "@/components/toast";
import { AppText, Button, Card, ErrorBanner, InfoBanner, LinkText, Loading } from "@/components/ui";
import { radius, spacing } from "@/theme";
import { useColors, makeStyles } from "@/lib/theme";

type PlanKey = "monthly" | "annual";

export function SubscriptionPlans() {
  const { shop, refreshShop } = useAuth();
  const toast = useToast();
  const shopId = shop?.id ?? "";
  const [selected, setSelected] = useState<PlanKey>("annual");
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingNote, setPendingNote] = useState<string | null>(null);

  const packages = useQuery({
    queryKey: ["store-packages", shopId],
    queryFn: () => loadPackages(shopId),
    enabled: purchasesAvailable && !!shopId,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const openLegal = (path: string) => WebBrowser.openBrowserAsync(`${config.siteUrl}${path}`);

  const finish = async (successMessage: string) => {
    const active = await syncAfterPurchase();
    await refreshShop();
    if (active) {
      toast(successMessage);
    } else {
      setPendingNote("Ödemeniz alındı, aboneliğiniz işleniyor. Birkaç dakika içinde etkinleşecek.");
    }
  };

  const onBuy = async (pkg: PurchasesPackage) => {
    setError(null);
    setPendingNote(null);
    setBusy("buy");
    try {
      await purchase(shopId, pkg);
      await finish("Aboneliğiniz başladı. Teşekkürler!");
    } catch (err) {
      if (!isPurchaseCancelled(err)) setError(purchaseErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    setError(null);
    setPendingNote(null);
    setBusy("restore");
    try {
      const hasPro = await restore(shopId);
      if (hasPro) await finish("Aboneliğiniz geri yüklendi.");
      else setError("Bu mağaza hesabında etkin bir abonelik bulunamadı.");
    } catch (err) {
      setError(purchaseErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (!purchasesAvailable) {
    return <InfoBanner message="Uygulama içi satın alma bu sürümde henüz kullanılamıyor." />;
  }
  if (packages.isLoading) return <Loading />;

  const monthly = packages.data?.monthly ?? null;
  const annual = packages.data?.annual ?? null;
  if (packages.isError || (!monthly && !annual)) {
    return (
      <>
        <ErrorBanner message="Abonelik seçenekleri yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin." />
        <Button title="Tekrar dene" variant="secondary" onPress={() => packages.refetch()} />
      </>
    );
  }

  const chosen = (selected === "annual" ? annual : monthly) ?? annual ?? monthly!;
  // Mağaza fiyatlarından gerçek indirim (yıllık = 10 × aylık ise "2 ay bedava")
  const freeMonths =
    annual && monthly && monthly.product.price > 0
      ? Math.round(12 - annual.product.price / monthly.product.price)
      : 0;
  const annualNote = [
    annual?.product.pricePerMonthString ? `Aylık ${annual.product.pricePerMonthString}` : null,
    freeMonths >= 1 ? `${freeMonths} ay bedava` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const chosenKey: PlanKey = chosen === annual ? "annual" : "monthly";

  return (
    <View style={{ gap: spacing.md }}>
      {annual ? (
        <PlanOption
          title="Yıllık"
          price={`${annual.product.priceString} / yıl`}
          note={annualNote || undefined}
          selected={chosenKey === "annual"}
          onPress={() => setSelected("annual")}
        />
      ) : null}
      {monthly ? (
        <PlanOption
          title="Aylık"
          price={`${monthly.product.priceString} / ay`}
          selected={chosenKey === "monthly"}
          onPress={() => setSelected("monthly")}
        />
      ) : null}

      <ErrorBanner message={error} />
      <InfoBanner message={pendingNote} />

      <Button
        title="Abone ol"
        loading={busy === "buy"}
        disabled={busy !== null}
        onPress={() => onBuy(chosen)}
      />
      <Button
        title="Satın alımları geri yükle"
        variant="ghost"
        loading={busy === "restore"}
        disabled={busy !== null}
        onPress={onRestore}
      />

      <AppText variant="small" style={{ textAlign: "center" }}>
        Abonelik, dönem bitmeden en az 24 saat önce iptal edilmezse aynı süre ve fiyatla otomatik yenilenir. Ödeme{" "}
        {"mağaza hesabınızdan alınır. Aboneliği istediğiniz zaman mağaza hesap ayarlarından yönetebilir veya iptal edebilirsiniz."}
        {shop?.subscription_status === "trialing" ? " Deneme süreniz satın alma anında sona erer." : ""}
      </AppText>
      <AppText variant="small" style={{ textAlign: "center" }}>
        <LinkText onPress={() => openLegal("/kullanim-kosullari")}>Kullanım Koşulları</LinkText>
        {"  ·  "}
        <LinkText onPress={() => openLegal("/gizlilik")}>Gizlilik Politikası</LinkText>
      </AppText>
    </View>
  );
}

function PlanOption({
  title,
  price,
  note,
  selected,
  onPress,
}: {
  title: string;
  price: string;
  note?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}>
      <Card style={[styles.option, selected && styles.optionSelected]}>
        <View style={styles.optionRow}>
          <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontWeight: "700" }}>BerberBot Pro · {title}</AppText>
            <AppText variant="muted">{price}</AppText>
            {note ? <AppText variant="small" style={{ color: colors.accent }}>{note}</AppText> : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  option: { borderWidth: 1.5, borderColor: colors.border },
  optionSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  optionRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.accent },
}));

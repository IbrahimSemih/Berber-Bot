// Faz 3: tam ekran (web: app/customers). Şimdilik iskelet.
import { AppText, Card, Screen } from "@/components/ui";

export default function CustomersScreen() {
  return (
    <Screen edges={["top"]}>
      <AppText variant="title">Müşteriler</AppText>
      <Card>
        <AppText variant="muted">Bu ekran bir sonraki sürümde eklenecek. Şimdilik web panelini kullanabilirsiniz.</AppText>
      </Card>
    </Screen>
  );
}

// Faz 3: tam ekran (web: app/appointments). Şimdilik iskelet.
import { AppText, Card, Screen } from "@/components/ui";

export default function AppointmentsScreen() {
  return (
    <Screen edges={["top"]}>
      <AppText variant="title">Randevular</AppText>
      <Card>
        <AppText variant="muted">Bu ekran bir sonraki sürümde eklenecek. Şimdilik web panelini kullanabilirsiniz.</AppText>
      </Card>
    </Screen>
  );
}

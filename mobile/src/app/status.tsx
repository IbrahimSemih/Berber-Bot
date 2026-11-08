// Oturum/dükkan bilgisi yüklenirken veya okunamadığında gösterilir.
import { View } from "react-native";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppText, Button, Loading, Screen } from "@/components/ui";

export default function StatusScreen() {
  const { status, error, refreshShop, signOut } = useAuth();
  const [retrying, setRetrying] = useState(false);

  if (status !== "error") return <Loading />;

  return (
    <Screen contentStyle={{ justifyContent: "center" }}>
      <AppText variant="heading">Bağlantı sorunu</AppText>
      <AppText variant="muted">{error}</AppText>
      <View style={{ gap: 12, marginTop: 8 }}>
        <Button
          title="Tekrar dene"
          loading={retrying}
          onPress={async () => {
            setRetrying(true);
            await refreshShop();
            setRetrying(false);
          }}
        />
        <Button title="Çıkış yap" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}

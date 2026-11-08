import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/**
 * Her durumda tam olarak bir grup erişilebilir (web'deki middleware yönlendirmesinin karşılığı):
 * yükleniyor/hata → status, oturum yok → (auth), dükkan yok → onboarding,
 * banlı → banned, deneme/abonelik bitti → paywall, aksi halde → (tabs).
 */
function RootNavigator() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "loading") SplashScreen.hide();
  }, [status]);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={status === "loading" || status === "error"}>
          <Stack.Screen name="status" />
        </Stack.Protected>
        <Stack.Protected guard={status === "signedOut"}>
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" options={authHeader} />
          <Stack.Screen name="verify" options={authHeader} />
          <Stack.Screen name="forgot" options={authHeader} />
        </Stack.Protected>
        <Stack.Protected guard={status === "noShop"}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={status === "banned"}>
          <Stack.Screen name="banned" />
        </Stack.Protected>
        <Stack.Protected guard={status === "locked"}>
          <Stack.Screen name="paywall" />
        </Stack.Protected>
        <Stack.Protected guard={status === "ready"}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

// Giriş akışındaki alt ekranlarda geri butonlu, başlıksız koyu üst bar
const authHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerShadowVisible: false,
  headerTitle: "",
  headerBackTitle: "Geri",
} as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});

import { useEffect, useState } from "react";
import { makeStyles, ThemeProvider, useColors, useTheme } from "@/lib/theme";
import type { Colors } from "@/theme";
import { AppState, Platform, View } from "react-native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth";
import { RealtimeBridge } from "@/lib/realtime";
import { PushBridge } from "@/lib/push";
import { fontAssets, HEADING, resolveFontFamily } from "@/lib/fonts";
import { ToastProvider } from "@/components/toast";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Uygulama ön plana gelince eskimiş sorgular yenilensin (React Query'nin RN karşılığı)
if (Platform.OS !== "web") {
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener("change", (state) => handleFocus(state === "active"));
    return () => sub.remove();
  });
}

export default function RootLayout() {
  // Yazı tipleri yüklenene kadar açılış ekranı kalır (yüklenemezse sistem fontuyla devam)
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })
  );

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <ThemeGate>
              <RootNavigator />
            </ThemeGate>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Kayıtlı tema tercihi okunana kadar bekler (açılış ekranı açık kalır, renk titremesi olmaz). */
function ThemeGate({ children }: { children: React.ReactNode }) {
  const { ready } = useTheme();
  return ready ? <>{children}</> : null;
}

/**
 * Her durumda tam olarak bir grup erişilebilir (web'deki middleware yönlendirmesinin karşılığı):
 * yükleniyor/hata → status, oturum yok → giriş ekranları, dükkan yok → onboarding,
 * banlı → banned, deneme/abonelik bitti → paywall (+ profil), aksi halde → sekmeler ve yönetim ekranları.
 */
function RootNavigator() {
  const colors = useColors();
  const { scheme } = useTheme();
  const pageHeader = makePageHeader(colors);
  const authHeader = makeAuthHeader(colors);
  const styles = useStyles();
  const { status, shop, session } = useAuth();

  useEffect(() => {
    if (status !== "loading") SplashScreen.hide();
  }, [status]);

  const ready = status === "ready";

  return (
    <View style={styles.root}>
      {/* Panelde üst kısım her iki temada da koyu başlık bandı; giriş akışı zemin renginde */}
      <StatusBar style={ready || scheme === "dark" ? "light" : "dark"} />
      {ready && shop ? <RealtimeBridge shopId={shop.id} /> : null}
      {/* Bildirim API'leri web önizlemede yok */}
      {ready && session && Platform.OS !== "web" ? <PushBridge userId={session.user.id} /> : null}
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
        <Stack.Protected guard={ready}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-appointment" options={{ ...pageHeader, title: "Yeni Randevu", presentation: "modal" }} />
          <Stack.Screen name="staff/index" options={{ ...pageHeader, title: "Personeller" }} />
          <Stack.Screen name="staff/[id]" options={{ ...pageHeader, title: "Personel" }} />
          <Stack.Screen name="services" options={{ ...pageHeader, title: "Hizmetler" }} />
          <Stack.Screen name="shop-settings" options={{ ...pageHeader, title: "Dükkan Ayarları" }} />
          <Stack.Screen name="booking-link" options={{ ...pageHeader, title: "Randevu Linki ve QR" }} />
          <Stack.Screen name="notifications" options={{ ...pageHeader, title: "Bildirimler" }} />
          <Stack.Screen name="subscription" options={{ ...pageHeader, title: "Abonelik" }} />
        </Stack.Protected>
        {/* Hesap silme ve şifre değiştirme abonelik bitse de kullanılabilir */}
        <Stack.Protected guard={ready || status === "locked"}>
          <Stack.Screen name="profile" options={{ ...pageHeader, title: "Profil" }} />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

// Uygulama içi ekranlarda geri butonlu üst bar (başlık bandı rengi)
function makePageHeader(colors: Colors) {
  return {
    headerShown: true,
    headerStyle: { backgroundColor: colors.hero },
    headerTintColor: colors.onHero,
    headerTitleStyle: { color: colors.onHero, fontFamily: resolveFontFamily(HEADING, 600), fontSize: 19 },
    headerShadowVisible: false,
    headerBackTitle: "Geri",
  };
}

// Giriş akışındaki alt ekranlarda başlıksız, zemin renginde üst bar
function makeAuthHeader(colors: Colors) {
  return {
    ...makePageHeader(colors),
    headerTitle: "",
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
  } as const;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg },
}));

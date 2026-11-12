// Push bildirimleri: izin isteme, Expo push token'ını sunucuya kaydetme ve
// bildirime dokununca ilgili günün randevularını açma. Sunucu tarafı:
// lib/notify.ts (gönderim) ve /api/mobile/v1/push-tokens (kayıt).
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { isValidDateString } from "@shared/time";
import type { PushData, PushTokenRequest, RemovePushTokenRequest } from "@shared/api-types";
import { apiFetch } from "./api";
import { colors } from "@/theme";

// Uygulama açıkken gelen bildirim de üstte görünsün
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Bu cihazın sunucuya kaydedilen token'ı (çıkışta silmek için)
let registeredToken: string | null = null;

/** Sunucu "default" kanalına gönderir (lib/notify.ts); Android 8+ için kanal şart. */
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Randevu bildirimleri",
    // eslint-disable-next-line import/namespace -- enum, `export *` ile geliyor (tsc doğruluyor)
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: colors.accent,
    vibrationPattern: [0, 250, 250, 250],
  });
}

/**
 * İzin ister ve token'ı sunucuya kaydeder. Gerçek cihaz, izin ve EAS projectId
 * gerekir; biri eksikse sessizce vazgeçer (bildirim olmadan uygulama çalışır).
 */
async function registerForPush(): Promise<void> {
  // iOS simülatörü push alamaz; Google Play'li Android emülatörü alabilir
  if (Platform.OS === "web" || (Platform.OS === "ios" && !Device.isDevice)) return;

  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted && current.canAskAgain) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn("[push] EAS projectId yok; push token alınamadı (bkz. mobile/README.md).");
    return;
  }

  // Expo Go'da (Android) uzaktan bildirim yok; development build gerekir
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const body: PushTokenRequest = { token, platform: Platform.OS === "ios" ? "ios" : "android" };
  await apiFetch("/push-tokens", { method: "POST", body });
  registeredToken = token;
}

/** Çıkıştan önce çağrılır: bu cihaz artık o dükkanın bildirimlerini almasın. */
export async function unregisterPush(): Promise<void> {
  const token = registeredToken;
  if (!token) return;
  registeredToken = null;
  try {
    const body: RemovePushTokenRequest = { token };
    await apiFetch("/push-tokens", { method: "DELETE", body });
  } catch {
    // Ağ yoksa token sunucuda kalır; Expo "DeviceNotRegistered" dönünce temizlenir
  }
}

function parsePushData(raw: unknown): PushData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if ((d.type !== "new_booking" && d.type !== "cancel") || typeof d.appointmentId !== "string") return null;
  return d as PushData;
}

/**
 * Oturum açık ve dükkan aktifken kök yerleşimde çizilir: token'ı kaydeder,
 * bildirime dokunulunca randevular ekranını o güne açar. Görsel çıktısı yoktur.
 */
export function PushBridge({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    registerForPush().catch((err) => console.warn("[push] kayıt başarısız:", err));
  }, [userId]);

  useEffect(() => {
    if (!lastResponse || lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = lastResponse.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;

    const data = parsePushData(lastResponse.notification.request.content.data);
    if (!data) return;
    // Bildirim geldiğinden beri liste eskimiş olabilir
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    router.navigate({
      pathname: "/appointments",
      params: isValidDateString(data.date) ? { date: data.date } : {},
    });
    Notifications.clearLastNotificationResponse();
  }, [lastResponse, queryClient]);

  return null;
}

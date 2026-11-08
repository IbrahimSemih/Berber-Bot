// İşletme sahibine bildirim: panel bildirimi (notifications tablosu) + mobil
// uygulamaya push (Expo Push API). Hiçbir zaman hata fırlatmaz; bildirim
// gönderilemedi diye randevu akışı bozulmamalı.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PushData } from "@/shared/api-types";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100;
const PUSH_TIMEOUT_MS = 5000;

export type ShopNotification = {
  type: string;
  message: string;
  push?: { title: string; body: string; data?: PushData };
};

type ExpoTicket = { status: "ok" | "error"; message?: string; details?: { error?: string } };

/**
 * `admin` service role client olmalı (push_tokens tablosunu yalnızca service role okur).
 */
export async function notifyShop(admin: SupabaseClient, shopId: string, notification: ShopNotification): Promise<void> {
  const { error } = await admin.from("notifications").insert({
    shop_id: shopId,
    type: notification.type,
    message: notification.message,
  });
  if (error) console.error("[notify] panel bildirimi eklenemedi:", error);

  if (notification.push) {
    await sendPushToShop(admin, shopId, notification.push);
  }
}

async function sendPushToShop(
  admin: SupabaseClient,
  shopId: string,
  push: NonNullable<ShopNotification["push"]>
): Promise<void> {
  try {
    const { data: rows, error } = await admin.from("push_tokens").select("token").eq("shop_id", shopId);
    if (error) {
      // Tablo henüz oluşturulmadıysa (migration çalıştırılmadı) sessizce geç
      if (error.code !== "42P01" && error.code !== "PGRST205") console.error("[notify] push token'ları okunamadı:", error);
      return;
    }
    const tokens = (rows ?? []).map((r: { token: string }) => r.token);
    if (tokens.length === 0) return;

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    };
    // Expo hesabında "enhanced push security" açılırsa gerekir
    if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;

    const deadTokens: string[] = [];
    for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
      const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);
      const messages = batch.map((to) => ({
        to,
        title: push.title,
        body: push.body,
        data: push.data ?? {},
        sound: "default",
        priority: "high",
        channelId: "default",
      }));

      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
      });
      if (!res.ok) {
        console.error("[notify] Expo push isteği başarısız:", res.status, await res.text().catch(() => ""));
        continue;
      }

      // Bilet sırası gönderilen mesaj sırasıyla aynıdır
      const json = (await res.json().catch(() => null)) as { data?: ExpoTicket[] } | null;
      (json?.data ?? []).forEach((ticket, idx) => {
        if (ticket.status !== "error") return;
        if (ticket.details?.error === "DeviceNotRegistered") deadTokens.push(batch[idx]);
        else console.error("[notify] push gönderilemedi:", ticket.message ?? ticket.details?.error);
      });
    }

    // Uygulaması silinmiş / bildirimi kapatılmış cihazlar
    if (deadTokens.length > 0) {
      await admin.from("push_tokens").delete().in("token", deadTokens);
    }
  } catch (err) {
    console.error("[notify] push gönderiminde hata:", err);
  }
}

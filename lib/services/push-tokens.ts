// Mobil uygulamanın Expo push token'ları. push_tokens tablosunda istemci
// politikası yoktur; yazma yalnızca buradan (service role) yapılır.
import { createAdminClient } from "@/lib/supabase/admin";
import type { OwnerContext } from "@/lib/owner";
import { fail, type ServiceResult } from "./result";

const EXPO_TOKEN_RE = /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,200}\]$/;
const PLATFORMS = new Set(["ios", "android"]);
// Bir dükkanın en fazla kaç cihazı bildirim alabilir (eski/terk edilmiş token birikmesin)
const MAX_TOKENS_PER_SHOP = 10;

export function isValidExpoPushToken(token: unknown): token is string {
  return typeof token === "string" && EXPO_TOKEN_RE.test(token);
}

export async function registerPushToken(
  ctx: Pick<OwnerContext, "user" | "shop">,
  input: { token?: unknown; platform?: unknown }
): Promise<ServiceResult> {
  if (!isValidExpoPushToken(input.token)) return fail("invalid", "Geçersiz bildirim anahtarı.");
  if (typeof input.platform !== "string" || !PLATFORMS.has(input.platform)) return fail("invalid", "Geçersiz platform.");

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Cihazda hesap değiştirilirse aynı token yeni dükkana taşınır
  const { error } = await admin.from("push_tokens").upsert(
    {
      token: input.token,
      shop_id: ctx.shop.id,
      user_id: ctx.user.id,
      platform: input.platform,
      last_seen_at: now,
    },
    { onConflict: "token" }
  );
  if (error) {
    console.error("Push token kaydedilemedi:", error);
    return fail("error", "Bildirim ayarı kaydedilemedi.");
  }

  // Sınırı aşan en eski token'ları temizle
  const { data: tokens } = await admin
    .from("push_tokens")
    .select("token")
    .eq("shop_id", ctx.shop.id)
    .order("last_seen_at", { ascending: false });
  const stale = (tokens ?? []).slice(MAX_TOKENS_PER_SHOP).map((t: { token: string }) => t.token);
  if (stale.length > 0) await admin.from("push_tokens").delete().in("token", stale);

  return { success: true };
}

/** Çıkış yaparken veya bildirim kapatılınca. Başka dükkanın token'ına dokunmaz. */
export async function removePushToken(ctx: Pick<OwnerContext, "shop">, token: unknown): Promise<ServiceResult> {
  if (!isValidExpoPushToken(token)) return fail("invalid", "Geçersiz bildirim anahtarı.");

  const admin = createAdminClient();
  const { error } = await admin.from("push_tokens").delete().eq("token", token).eq("shop_id", ctx.shop.id);
  if (error) {
    console.error("Push token silinemedi:", error);
    return fail("error", "Bildirim ayarı silinemedi.");
  }
  return { success: true };
}

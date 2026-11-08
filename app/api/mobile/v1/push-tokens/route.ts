import { withOwner, readJsonBody, serviceResponse, apiError } from "@/lib/mobile-api";
import { registerPushToken, removePushToken } from "@/lib/services/push-tokens";

export const dynamic = "force-dynamic";

/** Cihazın Expo push token'ını kaydeder: { token, platform: "ios" | "android" } */
export async function POST(req: Request) {
  return withOwner(req, {}, async (ctx) => {
    const body = await readJsonBody(req);
    if (!body) return apiError(400, "invalid", "Geçersiz istek.");
    return serviceResponse(await registerPushToken(ctx, { token: body.token, platform: body.platform }));
  });
}

/** Çıkışta / bildirim kapatılınca: { token } (token "[...]" içerdiği için yol yerine gövdede) */
export async function DELETE(req: Request) {
  return withOwner(req, {}, async (ctx) => {
    const body = await readJsonBody(req);
    if (!body) return apiError(400, "invalid", "Geçersiz istek.");
    return serviceResponse(await removePushToken(ctx, body.token));
  });
}

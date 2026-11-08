// /api/mobile/v1/* route'ları için ortak yardımcılar. Middleware /api'yi
// korumadığı için her route yetkiyi kendisi doğrular (Bearer token).
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getUserFromRequest, requireOwnerFromRequest, type OwnerContext } from "@/lib/owner";
import { mobileApiLimiter } from "@/lib/rate-limit";
import type { ServiceErrorCode, ServiceResult } from "@/lib/services/result";
import type { ApiError, ApiErrorCode } from "@/shared/api-types";

const NO_STORE = { "Cache-Control": "no-store" };

const STATUS_BY_CODE: Record<ServiceErrorCode, number> = {
  invalid: 400,
  not_found: 404,
  conflict: 409,
  forbidden: 403,
  error: 500,
};

export function apiJson<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function apiError(status: number, code: ApiErrorCode, error: string) {
  return NextResponse.json<ApiError>({ error, code }, { status, headers: NO_STORE });
}

/** Servis sonucunu HTTP yanıtına çevirir; başarıda `toBody` ile gövde üretilir. */
export function serviceResponse<T extends object>(
  result: ServiceResult<T>,
  toBody: (ok: { success: true } & T) => unknown = () => ({ ok: true })
) {
  if (!result.success) return apiError(STATUS_BY_CODE[result.code], result.code, result.error);
  return apiJson(toBody(result));
}

/** JSON gövdesini okur; geçersizse null. */
export async function readJsonBody(req: Request): Promise<Record<string, any> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

async function rateLimit(userId: string) {
  const { success } = await mobileApiLimiter.limit(`user_${userId}`);
  return success ? null : apiError(429, "rate_limited", "Çok fazla istek gönderdiniz. Lütfen biraz sonra tekrar deneyin.");
}

function internalError(err: unknown) {
  console.error("[mobile-api] beklenmeyen hata:", err);
  return apiError(500, "error", "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
}

/** Dükkan sahibi gerektiren uç noktalar. `requireActive`: kilitli dükkana 403 locked. */
export async function withOwner(
  req: Request,
  options: { requireActive?: boolean },
  handler: (ctx: OwnerContext) => Promise<Response>
): Promise<Response> {
  try {
    const auth = await requireOwnerFromRequest(req, options);
    if ("error" in auth) return apiError(auth.status, auth.code, auth.error);
    const limited = await rateLimit(auth.ctx.user.id);
    if (limited) return limited;
    return await handler(auth.ctx);
  } catch (err) {
    return internalError(err);
  }
}

/** Yalnızca oturum gerektiren uç noktalar (ör. dükkan oluşturma: henüz dükkan yok). */
export async function withUser(req: Request, handler: (user: User) => Promise<Response>): Promise<Response> {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return apiError(401, "unauthorized", "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.");
    const limited = await rateLimit(auth.user.id);
    if (limited) return limited;
    return await handler(auth.user);
  } catch (err) {
    return internalError(err);
  }
}

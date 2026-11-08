// Mobil API (/api/mobile/v1/*) istemcisi. Kimlik: Supabase access token (Bearer).
import type { ApiErrorCode } from "@shared/api-types";
import { config } from "./config";
import { supabase } from "./supabase";

export class ApiError extends Error {
  constructor(public status: number, public code: ApiErrorCode, message: string) {
    super(message);
  }
}

const NETWORK_ERROR = "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.";

export async function apiFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, "unauthorized", "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.");

  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}/api/mobile/v1${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "error", NETWORK_ERROR);
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (json?.code as ApiErrorCode) ?? "error",
      typeof json?.error === "string" ? json.error : "Beklenmeyen bir hata oluştu."
    );
  }
  return json as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return "Beklenmeyen bir hata oluştu.";
}

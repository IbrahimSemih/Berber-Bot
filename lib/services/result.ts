// Servis katmanı (lib/services/*) hem web Server Action'ları hem mobil API
// route'ları tarafından çağrılır. Hata kodları API'de HTTP durumuna çevrilir.

export type ServiceErrorCode = "invalid" | "not_found" | "conflict" | "forbidden" | "error";

export type ServiceFailure = { success: false; code: ServiceErrorCode; error: string };
export type ServiceResult<T extends object = {}> = ({ success: true } & T) | ServiceFailure;

export function fail(code: ServiceErrorCode, error: string): ServiceFailure {
  return { success: false, code, error };
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

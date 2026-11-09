// Ekranlarda kullanılan biçimlendirme yardımcıları (Türkiye saati: shared/time)
import { addDaysToDateString, formatTrLongDateWithWeekday, istanbulToUtc, todayInIstanbul } from "@shared/time";

/** 349 → "₺349", 1250.5 → "₺1.250,5" */
export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `₺${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

/** "YYYY-MM-DD" → "Bugün", "Yarın", "Dün" ya da "5 Kasım 2026, Perşembe" */
export function relativeDayLabel(dateStr: string): string {
  const today = todayInIstanbul();
  if (dateStr === today) return "Bugün";
  if (dateStr === addDaysToDateString(today, 1)) return "Yarın";
  if (dateStr === addDaysToDateString(today, -1)) return "Dün";
  return formatTrLongDateWithWeekday(istanbulToUtc(dateStr, "12:00"));
}

/** "+905321234567" → "0532 123 45 67" (görüntüleme için) */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("90") && digits.length === 12 ? digits.slice(2) : digits.replace(/^0/, "");
  if (local.length !== 10) return phone;
  return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8)}`;
}

export const isAnonymizedPhone = (phone: string | null | undefined) => !!phone?.startsWith("silindi-");

/** Supabase yazma hatasını kullanıcı mesajına çevirir */
export function dbErrorMessage(error: { code?: string; message?: string } | null | undefined, fallback = "İşlem başarısız oldu."): string {
  if (!error) return fallback;
  if (error.code === "42501" || /row-level security/i.test(error.message ?? "")) {
    return "Bu işlem için aboneliğinizin aktif olması gerekiyor.";
  }
  if (/fetch|network/i.test(error.message ?? "")) return "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.";
  return fallback;
}

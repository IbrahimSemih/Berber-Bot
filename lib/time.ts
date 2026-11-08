// Tüm iş kuralları Türkiye saatine göre çalışır. Vercel sunucuları UTC'de
// çalıştığı için `new Date().getHours()`, `setHours()`, saat dilimi verilmemiş
// `toLocaleTimeString()` gibi çağrılar sunucuda yanlış sonuç verir. Sunucu
// tarafında tarih/saat hesaplayan her yer bu dosyadaki yardımcıları kullanmalı.
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const APP_TIME_ZONE = "Europe/Istanbul";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isValidTimeString(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value);
}

/** Türkiye saatine göre bugünün tarihi: "YYYY-MM-DD" */
export function todayInIstanbul(now: Date = new Date()): string {
  return formatInTimeZone(now, APP_TIME_ZONE, "yyyy-MM-dd");
}

/** "YYYY-MM-DD" + gün sayısı → "YYYY-MM-DD" (saat diliminden bağımsız takvim aritmetiği) */
export function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Takvim gününün haftanın kaçıncı günü olduğu (0: Pazar ... 6: Cumartesi) */
export function dayOfWeekOf(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

/** Türkiye saatindeki tarih + saati gerçek zamana (UTC Date) çevirir. */
export function istanbulToUtc(dateStr: string, timeStr: string): Date {
  return fromZonedTime(`${dateStr}T${timeStr}:00`, APP_TIME_ZONE);
}

/** Türkiye saatine göre bir günün [başlangıç, bitiş) aralığı (UTC Date). */
export function istanbulDayRange(dateStr: string): { start: Date; end: Date } {
  return {
    start: istanbulToUtc(dateStr, "00:00"),
    end: istanbulToUtc(addDaysToDateString(dateStr, 1), "00:00"),
  };
}

/** "HH:mm" → gün başından itibaren dakika */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/** dakika → "HH:mm" */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Bir anın Türkiye saatindeki "HH:mm" karşılığı */
export function formatIstanbulTime(date: Date | string): string {
  return formatInTimeZone(new Date(date), APP_TIME_ZONE, "HH:mm");
}

/** Bir anın Türkiye saatindeki "YYYY-MM-DD" karşılığı */
export function formatIstanbulDate(date: Date | string): string {
  return formatInTimeZone(new Date(date), APP_TIME_ZONE, "yyyy-MM-dd");
}

/** Mesajlarda kullanılan biçim: "05.11.2026 saat 15:30" */
export function formatTrDateTime(date: Date | string): string {
  const d = new Date(date);
  const datePart = d.toLocaleDateString("tr-TR", { timeZone: APP_TIME_ZONE });
  const timePart = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE });
  return `${datePart} saat ${timePart}`;
}

/** "5 Kasım 2026" */
export function formatTrLongDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  });
}

/** "5 Kasım 2026, Perşembe" */
export function formatTrLongDateWithWeekday(date: Date | string): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
    timeZone: APP_TIME_ZONE,
  });
}

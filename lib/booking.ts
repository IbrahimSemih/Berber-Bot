// Online randevu için müsait saat hesaplaması. Hem müşteriye gösterilen saat
// listesi hem de randevu oluştururken yapılan sunucu doğrulaması bu fonksiyonu
// kullanır; böylece istemci ile sunucu hiçbir zaman farklı karar vermez.
// Yalnızca sunucuda (admin client ile) çağrılmalıdır.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkingHour } from "@/types";
import {
  addDaysToDateString,
  dayOfWeekOf,
  isValidDateString,
  isValidTimeString,
  istanbulDayRange,
  istanbulToUtc,
  minutesToTime,
  timeToMinutes,
  todayInIstanbul,
} from "@/lib/time";

export const SLOT_INTERVAL_MINUTES = 30;
/** Hatırlatma mesajı randevudan kaç saat önce gönderilir (cron her 15 dk çalışır) */
export const REMINDER_HOURS_BEFORE = 3;
export const BOOKING_WINDOW_DAYS = 14;
const MAX_SERVICE_MINUTES = 8 * 60;

export const DEFAULT_WORKING_HOURS: WorkingHour[] = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
  day,
  is_open: day !== 0,
  start: "09:00",
  end: "20:00",
}));

type SettingsLike = {
  working_hours?: unknown;
  work_days?: number[] | null;
  work_start?: string | null;
  work_end?: string | null;
} | null | undefined;

/** Ayarlardan çalışma saatlerini okur (eski work_days/work_start/work_end kayıtlarını da destekler). */
export function resolveWorkingHours(settings: SettingsLike): WorkingHour[] {
  if (settings && Array.isArray(settings.working_hours) && settings.working_hours.length > 0) {
    return (settings.working_hours as any[])
      .filter((w) => w && typeof w.day === "number")
      .map((w) => ({
        day: w.day,
        is_open: !!w.is_open,
        start: typeof w.start === "string" ? w.start.slice(0, 5) : "09:00",
        end: typeof w.end === "string" ? w.end.slice(0, 5) : "20:00",
      }));
  }
  if (settings && Array.isArray(settings.work_days)) {
    const start = (settings.work_start || "09:00").slice(0, 5);
    const end = (settings.work_end || "20:00").slice(0, 5);
    return [1, 2, 3, 4, 5, 6, 0].map((day) => ({
      day,
      is_open: settings.work_days!.includes(day),
      start,
      end,
    }));
  }
  return DEFAULT_WORKING_HOURS;
}

/** Müşterinin seçebileceği günler (Türkiye saatine göre bugün dahil) */
export function getBookableDates(now: Date = new Date()): string[] {
  const today = todayInIstanbul(now);
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDaysToDateString(today, i));
}

export type AvailabilityResult = {
  slots: string[];
  /** Dükkan o gün kapalı ya da tüm personel izinli */
  closed: boolean;
  /** Seçilen personel o gün izinli */
  staffOnLeave: boolean;
};

const EMPTY: AvailabilityResult = { slots: [], closed: false, staffOnLeave: false };

export async function getAvailability(
  admin: SupabaseClient,
  params: {
    shopId: string;
    date: string;
    serviceDurationMinutes: number;
    staffId?: string | null;
    workingHours: WorkingHour[];
    now?: Date;
  }
): Promise<AvailabilityResult> {
  const now = params.now ?? new Date();
  const { shopId, date, staffId } = params;
  const duration = Math.round(Number(params.serviceDurationMinutes));

  if (!isValidDateString(date)) return EMPTY;
  if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_SERVICE_MINUTES) return EMPTY;
  if (!getBookableDates(now).includes(date)) return EMPTY;

  const dayConfig = params.workingHours.find((d) => d.day === dayOfWeekOf(date));
  if (
    !dayConfig ||
    !dayConfig.is_open ||
    !isValidTimeString(dayConfig.start) ||
    !isValidTimeString(dayConfig.end) ||
    timeToMinutes(dayConfig.end) <= timeToMinutes(dayConfig.start)
  ) {
    return { ...EMPTY, closed: true };
  }

  // 1. Aktif personel ve o günkü izinler
  const [{ data: staffRows }, { data: leaveRows }] = await Promise.all([
    admin.from("staff").select("id").eq("shop_id", shopId).eq("is_active", true),
    admin
      .from("staff_leaves")
      .select("staff_id")
      .eq("shop_id", shopId)
      .lte("start_date", date)
      .gte("end_date", date),
  ]);

  const activeIds = new Set((staffRows ?? []).map((s: { id: string }) => s.id));
  const onLeave = new Set((leaveRows ?? []).map((l: { staff_id: string }) => l.staff_id));

  if (activeIds.size === 0) return { ...EMPTY, closed: true };
  if (staffId) {
    if (!activeIds.has(staffId)) return EMPTY;
    if (onLeave.has(staffId)) return { ...EMPTY, staffOnLeave: true };
  }

  const capacity = Array.from(activeIds).filter((id) => !onLeave.has(id)).length;
  if (capacity === 0) return { ...EMPTY, closed: true };

  // 2. O günün aktif randevuları (önceki günden taşan uzun randevular için 12 saat geriye bakılır)
  const { start: dayStart, end: dayEnd } = istanbulDayRange(date);
  const lookbackStart = new Date(dayStart.getTime() - 12 * 60 * 60 * 1000);
  const { data: appointmentRows } = await admin
    .from("appointments")
    .select("scheduled_at, staff_id, service:services(duration_minutes)")
    .eq("shop_id", shopId)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", lookbackStart.toISOString())
    .lt("scheduled_at", dayEnd.toISOString());

  const busy = (appointmentRows ?? []).map((a: any) => {
    const service = Array.isArray(a.service) ? a.service[0] : a.service;
    const minutes = Number(service?.duration_minutes) > 0 ? Number(service.duration_minutes) : SLOT_INTERVAL_MINUTES;
    const start = new Date(a.scheduled_at).getTime();
    return { start, end: start + minutes * 60 * 1000, staffId: a.staff_id as string | null };
  });

  // 3. Aday saatler: açılıştan itibaren 30 dk aralıkla, hizmet kapanıştan önce bitmeli
  const openMin = timeToMinutes(dayConfig.start);
  const closeMin = timeToMinutes(dayConfig.end);
  const slots: string[] = [];

  for (let m = openMin; m + duration <= closeMin; m += SLOT_INTERVAL_MINUTES) {
    const time = minutesToTime(m);
    const slotStart = istanbulToUtc(date, time).getTime();
    if (slotStart <= now.getTime()) continue;
    const slotEnd = slotStart + duration * 60 * 1000;

    const overlapping = busy.filter((b) => b.start < slotEnd && b.end > slotStart);
    if (overlapping.length >= capacity) continue;
    if (staffId && overlapping.some((b) => b.staffId === staffId)) continue;

    slots.push(time);
  }

  return { slots, closed: false, staffOnLeave: false };
}

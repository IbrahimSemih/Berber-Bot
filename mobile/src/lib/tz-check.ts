// Hermes (özellikle Android) Intl saat dilimi desteği beklendiği gibi mi?
// Bilinen bir an için Türkiye saatinin doğru hesaplandığını kontrol eder.
// Yanlışsa @formatjs/intl-datetimeformat polyfill'i eklenmeli (mobile_app_plan.md 4.5).
import { formatIstanbulTime, istanbulToUtc, todayInIstanbul } from "@shared/time";

export function checkIstanbulTimeZone(): { ok: boolean; detail: string } {
  try {
    const t1 = formatIstanbulTime(new Date("2026-01-15T12:00:00Z")); // beklenen 15:00
    const t2 = istanbulToUtc("2026-07-01", "09:30").toISOString(); // beklenen 06:30Z
    const d = todayInIstanbul(new Date("2026-03-01T22:30:00Z")); // beklenen 2026-03-02
    const ok = t1 === "15:00" && t2 === "2026-07-01T06:30:00.000Z" && d === "2026-03-02";
    return { ok, detail: `${t1} · ${t2.slice(11, 16)}Z · ${d}` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

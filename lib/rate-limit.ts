import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type Limiter = { limit: (key: string) => Promise<{ success: boolean }> };

// Only create instances if tokens are available
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

if (!redis && process.env.NODE_ENV === "production") {
  console.error(
    "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN tanımlı değil. " +
    "Hız sınırı yalnızca sunucu örneği içi bellekte tutuluyor; Vercel'de bu yeterli koruma sağlamaz."
  );
}

/**
 * Redis yoksa kullanılan yedek: sunucu örneği başına bellekte kayan pencere.
 * Örnekler arasında paylaşılmaz ama hiç sınır olmamasından iyidir.
 */
function memoryLimiter(max: number, windowMs: number): Limiter {
  const hits = new Map<string, number[]>();
  return {
    async limit(key: string) {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      const success = recent.length < max;
      if (success) recent.push(now);
      hits.set(key, recent);

      // Bellek şişmesin: süresi dolmuş anahtarları ara sıra temizle
      if (hits.size > 5000) {
        hits.forEach((times, k) => {
          if (times.every((t) => now - t >= windowMs)) hits.delete(k);
        });
      }
      return { success };
    },
  };
}

function createLimiter(
  max: number,
  window: `${number} ${"s" | "m" | "h"}`,
  windowMs: number,
  prefix: string
): Limiter {
  if (!redis) return memoryLimiter(max, windowMs);
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, window),
    analytics: true,
    prefix: `@upstash/ratelimit/${prefix}`,
  });
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// 5 requests per 15 minutes for authentication attempts
export const authLimiter = createLimiter(5, "15 m", 15 * MINUTE, "auth");

// 30 requests per minute for standard API endpoints
export const apiLimiter = createLimiter(30, "1 m", MINUTE, "api");

// Mobil uygulama API'si (/api/mobile/v1/*): kullanıcı başına dakikada 60 istek
export const mobileApiLimiter = createLimiter(60, "1 m", MINUTE, "mobile-api");

// 10 requests per minute for booking creation
export const bookingLimiter = createLimiter(10, "1 m", MINUTE, "booking");

// Aynı telefon numarasıyla aynı dükkana saatte en fazla 3 randevu denemesi
// (IP değiştirerek başkasının numarasına mesaj yağdırmayı zorlaştırır)
export const phoneBookingLimiter = createLimiter(3, "1 h", HOUR, "booking-phone");

// WhatsApp otomatik yanıtı: aynı numaraya saatte en fazla 2 kez
export const autoReplyLimiter = createLimiter(2, "1 h", HOUR, "wa-autoreply");

// Helper to get client IP in Next.js App Router
export function getIp(req?: Request, headers?: Headers) {
  const source = headers ?? req?.headers;
  if (source) {
    // Vercel bu başlığı kendisi yazar; istemci tarafından taklit edilemez
    const vercelIp = source.get("x-vercel-forwarded-for");
    if (vercelIp) return vercelIp.split(",")[0].trim();
    const forwardedFor = source.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();
    const realIp = source.get("x-real-ip");
    if (realIp) return realIp;
  }

  return "127.0.0.1";
}

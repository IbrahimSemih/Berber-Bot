import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only create instances if tokens are available
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

// Fallback logic for when Redis is not configured
const mockLimiter = {
  limit: async () => ({ success: true, pending: Promise.resolve(), limit: 10, remaining: 9, reset: 0 }),
};

// 5 requests per 15 minutes for authentication attempts
export const authLimiter = redis 
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/auth",
    })
  : mockLimiter;

// 30 requests per minute for standard API endpoints
export const apiLimiter = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/api",
    })
  : mockLimiter;

// 10 requests per minute for booking creation
export const bookingLimiter = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/booking",
    })
  : mockLimiter;

// Helper to get client IP in Next.js App Router
export function getIp(req?: Request, headers?: Headers) {
  // If we have Next.js headers function (server actions/components)
  if (headers) {
    const forwardedFor = headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();
    const realIp = headers.get("x-real-ip");
    if (realIp) return realIp;
  }
  
  // If we have standard Request object (API routes)
  if (req) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;
  }
  
  return "127.0.0.1";
}

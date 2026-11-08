// Mobil API (/api/mobile/v1/*) istek ve yanıt tipleri. Web sunucusu ve mobil
// uygulama aynı dosyayı kullanır; burada yalnızca tip olmalı (çalışan kod yok).
//
// Kimlik doğrulama: her istekte `Authorization: Bearer <supabase access_token>`.
// Hata yanıtı her zaman: { error: string, code: ApiErrorCode } ve uygun HTTP durumu.

export type ApiErrorCode =
  | "unauthorized" // 401: token yok / geçersiz / süresi dolmuş
  | "no_shop" // 404: kullanıcının dükkanı yok → onboarding
  | "banned" // 403: hesap askıya alınmış
  | "locked" // 403: deneme / abonelik bitmiş → paywall
  | "invalid" // 400: geçersiz girdi
  | "not_found" // 404
  | "conflict" // 409: durum uygun değil (ör. zaten iptal edilmiş, link dolu)
  | "forbidden" // 403
  | "rate_limited" // 429
  | "error"; // 500

export type ApiError = { error: string; code: ApiErrorCode };

// GET /shop
export type ShopResponse = {
  shop: {
    id: string;
    name: string;
    slug: string;
    status: string | null;
    subscription_status: string | null;
    trial_end: string | null;
    current_period_end: string | null;
  };
  isLocked: boolean;
  accessEndsAt: string | null;
};

// POST /shop
export type CreateShopRequest = {
  shopName: string;
  workStart: string; // "HH:mm"
  workEnd: string; // "HH:mm"
  workDays: number[]; // 0: Pazar ... 6: Cumartesi
  staffMembers: string[];
};
export type CreateShopResponse = { shopId: string; created: boolean };

// PATCH /shop/slug
export type UpdateSlugRequest = { slug: string };
export type UpdateSlugResponse = { slug: string };

// GET /shop/limits (null = sınırsız)
export type ShopLimitsResponse = {
  isLocked: boolean;
  plan: { id: string; name: string; price: number; yearlyPrice: number };
  usage: { appointments: number; staff: number };
  limits: { appointments: number | null; staff: number | null };
  canAddAppointment: boolean;
  canAddStaff: boolean;
};

// POST /appointments
export type CreateAppointmentRequest = {
  customerName: string;
  customerPhone: string;
  serviceId: string;
  staffId?: string | null;
  date: string; // "YYYY-MM-DD" (Türkiye saati)
  time: string; // "HH:mm" (Türkiye saati)
  notify: boolean; // müşteriye WhatsApp onay mesajı gitsin mi
};
export type CreateAppointmentResponse = { appointmentId: string; notified: boolean };

// POST /appointments/:id/confirm, POST /appointments/:id/cancel
export type AppointmentActionResponse = { notified: boolean };

// POST /customers/:id/anonymize, DELETE /account, push token uçları
export type OkResponse = { ok: true };

// POST /push-tokens, DELETE /push-tokens
export type PushTokenRequest = { token: string; platform: "ios" | "android" };
export type RemovePushTokenRequest = { token: string };

// Push bildirimi `data` alanı (bildirime dokununca ilgili ekranı açmak için)
export type PushData =
  | { type: "new_booking"; appointmentId: string }
  | { type: "cancel"; appointmentId: string };

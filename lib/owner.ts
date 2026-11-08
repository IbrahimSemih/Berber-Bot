// Server Action'lar ve /api route'ları herkese açık uç noktalardır; middleware
// onları korumaz. İşletme sahibine ait her işlem oturumu ve dükkanı buradan doğrular:
// web çerezle (requireOwner), mobil uygulama Bearer token ile (requireOwnerFromRequest).
import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { computeIsLocked } from "@/shared/plan";

export type OwnerShop = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  status: string | null;
  subscription_status: string | null;
  trial_end: string | null;
  current_period_end: string | null;
};

/** RLS'e tabi client (kullanıcının yetkisiyle) + kullanıcı + dükkan */
export type OwnerContext = {
  supabase: SupabaseClient;
  user: User;
  shop: OwnerShop;
};

export type OwnerAuthErrorCode = "unauthorized" | "no_shop" | "banned" | "locked";
export type OwnerAuthError = { error: string; code: OwnerAuthErrorCode; status: 401 | 403 | 404 };

const OWNER_SHOP_COLUMNS = "id, name, slug, owner_id, status, subscription_status, trial_end, current_period_end";

const AUTH_ERRORS: Record<OwnerAuthErrorCode, OwnerAuthError> = {
  unauthorized: { code: "unauthorized", status: 401, error: "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın." },
  no_shop: { code: "no_shop", status: 404, error: "Dükkan bulunamadı. Lütfen önce dükkanınızı oluşturun." },
  banned: { code: "banned", status: 403, error: "Hesabınız askıya alınmıştır." },
  locked: {
    code: "locked",
    status: 403,
    error: "Aboneliğinizin süresi dolmuş. Devam etmek için aboneliğinizi yenileyin.",
  },
};

async function loadOwnerShop(supabase: SupabaseClient, userId: string): Promise<OwnerShop | null> {
  const { data } = await supabase.from("shops").select(OWNER_SHOP_COLUMNS).eq("owner_id", userId).maybeSingle();
  return (data as OwnerShop | null) ?? null;
}

function checkOwner(
  ctx: OwnerContext | null,
  options: { requireActive?: boolean }
): { ctx: OwnerContext } | OwnerAuthError {
  if (!ctx) return AUTH_ERRORS.unauthorized;
  if (ctx.shop.status === "banned") return AUTH_ERRORS.banned;
  if (options.requireActive && computeIsLocked(ctx.shop)) return AUTH_ERRORS.locked;
  return { ctx };
}

// ─── Web (çerez oturumu) ──────────────────────────────────────────────────

export async function getOwnerContext(): Promise<OwnerContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const shop = await loadOwnerShop(supabase, user.id);
  if (!shop) return null;

  return { supabase, user, shop };
}

/** Oturum + dükkan + (isteğe bağlı) aktif abonelik kontrolü. Hata varsa mesaj döner. */
export async function requireOwner(options: { requireActive?: boolean } = {}) {
  const result = checkOwner(await getOwnerContext(), options);
  if ("error" in result && result.code === "locked") {
    return {
      ...result,
      error: "Aboneliğinizin süresi dolmuş. Devam etmek için Fatura & Abonelik sayfasından ödeme yapın.",
    };
  }
  return result;
}

// ─── Mobil (Authorization: Bearer <access_token>) ─────────────────────────

/**
 * İstekteki Supabase access token'ını doğrular. Dönen client kullanıcının
 * JWT'siyle çalışır, yani web'deki gibi RLS ve paywall politikalarına tabidir.
 */
export async function getUserFromRequest(req: Request): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match || match[1].length > 4096) return null;
  const token = match[1];

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  );

  // getUser(token) imzayı ve oturumun iptal edilmemiş olduğunu Supabase Auth'a sorar
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { supabase, user };
}

export async function requireOwnerFromRequest(
  req: Request,
  options: { requireActive?: boolean } = {}
): Promise<{ ctx: OwnerContext } | OwnerAuthError> {
  const auth = await getUserFromRequest(req);
  if (!auth) return AUTH_ERRORS.unauthorized;

  const shop = await loadOwnerShop(auth.supabase, auth.user.id);
  if (!shop) return AUTH_ERRORS.no_shop;

  return checkOwner({ ...auth, shop }, options);
}

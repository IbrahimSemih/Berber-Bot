// Dükkan oluşturma, randevu linki ve plan limitleri. Bu işlemler service role
// gerektirir (protect_shop_billing_fields trigger'ı istemcinin dükkan eklemesini,
// slug ve abonelik alanlarını değiştirmesini engeller); yetki kontrolü çağıranda.
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";
import { getShopUsageAndLimits } from "@/lib/plan-limits";
import type { OwnerShop } from "@/lib/owner";
import { TRIAL_DAYS, limitToJson } from "@/shared/plan";
import { RESERVED_SLUGS, slugify, SLUG_MIN_LENGTH, validateSlug } from "@/shared/slug";
import { isValidTimeString, timeToMinutes } from "@/shared/time";
import type { ShopLimitsResponse } from "@/shared/api-types";
import { fail, type ServiceResult } from "./result";

type AdminClient = ReturnType<typeof createAdminClient>;

export type CreateShopInput = {
  shopName: string;
  workStart: string;
  workEnd: string;
  workDays: number[];
  staffMembers: string[];
};

async function findAvailableSlug(admin: AdminClient, shopName: string) {
  let base = slugify(shopName);
  if (base.length < SLUG_MIN_LENGTH) base = `berber-${base}`.replace(/-+$/, "");
  if (RESERVED_SLUGS.has(base)) base = `${base}-berber`;

  const candidates = [base, ...Array.from({ length: 8 }, (_, i) => `${base}-${i + 2}`)];
  const { data: taken } = await admin.from("shops").select("slug").in("slug", candidates);
  const takenSet = new Set((taken ?? []).map((t: { slug: string }) => t.slug));
  const free = candidates.find((c) => !takenSet.has(c));
  return free ?? `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

/**
 * Dükkanı sunucuda oluşturur. Abonelik alanları (deneme süresi, plan) yalnızca
 * burada, service role ile yazılır; istemciden gelen değerlere güvenilmez.
 * Kullanıcının zaten dükkanı varsa onu döner (idempotent).
 */
export async function createShop(
  user: { id: string; email?: string | null },
  input: CreateShopInput
): Promise<ServiceResult<{ shopId: string; created: boolean }>> {
  const shopName = (typeof input?.shopName === "string" ? input.shopName : "").trim().replace(/\s+/g, " ");
  if (shopName.length < 2 || shopName.length > 80) {
    return fail("invalid", "Dükkan adı 2-80 karakter olmalıdır.");
  }
  if (
    !isValidTimeString(input.workStart) ||
    !isValidTimeString(input.workEnd) ||
    timeToMinutes(input.workEnd) <= timeToMinutes(input.workStart)
  ) {
    return fail("invalid", "Kapanış saati açılış saatinden sonra olmalıdır.");
  }
  const rawDays = Array.isArray(input.workDays) ? input.workDays : [];
  const workDays = Array.from(new Set(rawDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)));
  if (workDays.length === 0) return fail("invalid", "En az bir çalışma günü seçin.");

  const rawStaff = Array.isArray(input.staffMembers) ? input.staffMembers : [];
  const staffMembers = Array.from(
    new Set(
      rawStaff
        .map((s) => (typeof s === "string" ? s : "").trim())
        .filter((s) => s.length >= 1 && s.length <= 60)
    )
  ).slice(0, 50);

  const admin = createAdminClient();

  const { data: existing } = await admin.from("shops").select("id").eq("owner_id", user.id).maybeSingle();
  if (existing) return { success: true, shopId: existing.id, created: false };

  const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  let shopId: string | null = null;
  for (let attempt = 0; attempt < 3 && !shopId; attempt++) {
    const slug = await findAvailableSlug(admin, shopName);
    const { data: shop, error } = await admin
      .from("shops")
      .insert({
        name: shopName,
        slug,
        owner_id: user.id,
        plan_id: "pro",
        subscription_status: "trialing",
        trial_end: trialEnd.toISOString(),
      })
      .select("id")
      .single();

    if (shop) shopId = shop.id;
    else if (error && error.code !== "23505") {
      console.error("Dükkan oluşturulamadı:", error);
      return fail("error", "Dükkan oluşturulamadı. Lütfen tekrar deneyin.");
    }
  }
  if (!shopId) return fail("error", "Dükkan oluşturulamadı. Lütfen tekrar deneyin.");

  const workingHours = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
    day,
    is_open: workDays.includes(day),
    start: input.workStart,
    end: input.workEnd,
  }));

  const results = await Promise.all([
    admin.from("settings").insert({
      shop_id: shopId,
      shop_name: shopName,
      work_start: input.workStart,
      work_end: input.workEnd,
      work_days: workDays,
      working_hours: workingHours,
    }),
    admin.from("services").insert([
      { shop_id: shopId, name: "Saç Kesimi", duration_minutes: 30, price: 150 },
      { shop_id: shopId, name: "Sakal Düzeltme", duration_minutes: 20, price: 80 },
      { shop_id: shopId, name: "Komple Paket", duration_minutes: 45, price: 200 },
    ]),
    admin.from("staff").insert(
      (staffMembers.length > 0 ? staffMembers : ["İşletme Sahibi"]).map((name) => ({ shop_id: shopId, name, is_active: true }))
    ),
  ]);
  results.forEach((r) => {
    if (r.error) console.error("Onboarding varsayılan kayıt hatası:", r.error);
  });

  if (user.email) {
    try {
      await sendWelcomeEmail(user.email, user.email.split("@")[0]);
    } catch (err) {
      console.error("Hoş geldin e-postası gönderilemedi:", err);
    }
  }

  return { success: true, shopId, created: true };
}

/** Randevu linkini (berberbot.com/<slug>) değiştirir. Eski ve yeni slug'ı döner (önbellek temizliği için). */
export async function changeShopSlug(
  shop: Pick<OwnerShop, "id" | "owner_id" | "slug">,
  rawSlug: unknown
): Promise<ServiceResult<{ slug: string; previousSlug: string }>> {
  const slug = (typeof rawSlug === "string" ? rawSlug : "").trim().toLowerCase();
  const invalid = validateSlug(slug);
  if (invalid) return fail("invalid", invalid);
  if (slug === shop.slug) return { success: true, slug, previousSlug: shop.slug };

  // Benzersizlik kontrolü RLS'ten bağımsız yapılmalı (başka dükkanların slug'larını görmek için admin)
  const admin = createAdminClient();
  const { data: taken } = await admin.from("shops").select("id").eq("slug", slug).maybeSingle();
  if (taken) return fail("conflict", "Bu link başka bir işletme tarafından kullanılıyor.");

  const { error } = await admin.from("shops").update({ slug }).eq("id", shop.id).eq("owner_id", shop.owner_id);
  if (error) {
    if (error.code === "23505") return fail("conflict", "Bu link başka bir işletme tarafından kullanılıyor.");
    console.error("Slug güncellenemedi:", error);
    return fail("error", "Link güncellenemedi.");
  }

  return { success: true, slug, previousSlug: shop.slug };
}

/** Plan, kullanım ve kilit durumu (web personel sayfası ve mobil). */
export async function getShopLimits(shopId: string) {
  return getShopUsageAndLimits(createAdminClient(), shopId);
}

/** getShopLimits sonucunun JSON'a uygun hali (Infinity → null). */
export function toShopLimitsResponse(limits: Awaited<ReturnType<typeof getShopLimits>>): ShopLimitsResponse {
  return {
    isLocked: limits.isLocked,
    plan: {
      id: limits.plan.id,
      name: limits.plan.name,
      price: limits.plan.price,
      yearlyPrice: limits.plan.yearlyPrice,
    },
    usage: limits.usage,
    limits: {
      appointments: limitToJson(limits.limits.appointments),
      staff: limitToJson(limits.limits.staff),
    },
    canAddAppointment: limits.canAddAppointment,
    canAddStaff: limits.canAddStaff,
  };
}

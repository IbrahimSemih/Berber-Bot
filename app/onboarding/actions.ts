"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";
import { TRIAL_DAYS } from "@/lib/plan-limits";
import { RESERVED_SLUGS, slugify, SLUG_MIN_LENGTH } from "@/lib/slug";
import { isValidTimeString, timeToMinutes } from "@/lib/time";

type CreateShopInput = {
  shopName: string;
  workStart: string;
  workEnd: string;
  workDays: number[];
  staffMembers: string[];
};

async function findAvailableSlug(admin: ReturnType<typeof createAdminClient>, shopName: string) {
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
 * burada, service role ile yazılır; tarayıcıdan gelen değerlere güvenilmez.
 */
export async function createShopAction(input: CreateShopInput): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın." };

  const shopName = (input.shopName || "").trim().replace(/\s+/g, " ");
  if (shopName.length < 2 || shopName.length > 80) {
    return { success: false, error: "Dükkan adı 2-80 karakter olmalıdır." };
  }
  if (!isValidTimeString(input.workStart) || !isValidTimeString(input.workEnd) || timeToMinutes(input.workEnd) <= timeToMinutes(input.workStart)) {
    return { success: false, error: "Kapanış saati açılış saatinden sonra olmalıdır." };
  }
  const workDays = Array.from(new Set((input.workDays || []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)));
  if (workDays.length === 0) return { success: false, error: "En az bir çalışma günü seçin." };

  const staffMembers = Array.from(
    new Set((input.staffMembers || []).map((s) => (s || "").trim()).filter((s) => s.length >= 1 && s.length <= 60))
  ).slice(0, 50);

  const admin = createAdminClient();

  const { data: existing } = await admin.from("shops").select("id").eq("owner_id", user.id).maybeSingle();
  if (existing) return { success: true };

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
      return { success: false, error: "Dükkan oluşturulamadı. Lütfen tekrar deneyin." };
    }
  }
  if (!shopId) return { success: false, error: "Dükkan oluşturulamadı. Lütfen tekrar deneyin." };

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

  return { success: true };
}

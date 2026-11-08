"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/owner";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateSlug } from "@/lib/slug";

/** Randevu linkini (berberbot.com/<slug>) değiştirir. */
export async function updateShopSlug(rawSlug: string): Promise<{ success: true; slug: string } | { success: false; error: string }> {
  const auth = await requireOwner();
  if ("error" in auth) return { success: false, error: auth.error as string };
  const { shop } = auth.ctx;

  const slug = (rawSlug || "").trim().toLowerCase();
  const invalid = validateSlug(slug);
  if (invalid) return { success: false, error: invalid };
  if (slug === shop.slug) return { success: true, slug };

  // Benzersizlik kontrolü RLS'ten bağımsız yapılmalı (başka dükkanların slug'larını görmek için admin)
  const admin = createAdminClient();
  const { data: taken } = await admin.from("shops").select("id").eq("slug", slug).maybeSingle();
  if (taken) return { success: false, error: "Bu link başka bir işletme tarafından kullanılıyor." };

  const { error } = await admin.from("shops").update({ slug }).eq("id", shop.id).eq("owner_id", shop.owner_id);
  if (error) {
    if (error.code === "23505") return { success: false, error: "Bu link başka bir işletme tarafından kullanılıyor." };
    console.error("Slug güncellenemedi:", error);
    return { success: false, error: "Link güncellenemedi." };
  }

  revalidatePath(`/${shop.slug}`);
  revalidatePath(`/${slug}`);
  return { success: true, slug };
}

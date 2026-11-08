"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/owner";
import { changeShopSlug } from "@/lib/services/shop";

/** Randevu linkini (berberbot.com/<slug>) değiştirir. */
export async function updateShopSlug(rawSlug: string): Promise<{ success: true; slug: string } | { success: false; error: string }> {
  const auth = await requireOwner();
  if ("error" in auth) return { success: false, error: auth.error };

  const result = await changeShopSlug(auth.ctx.shop, rawSlug);
  if (!result.success) return result;

  if (result.slug !== result.previousSlug) {
    revalidatePath(`/${result.previousSlug}`);
    revalidatePath(`/${result.slug}`);
  }
  return { success: true, slug: result.slug };
}

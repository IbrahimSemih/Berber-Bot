import { revalidatePath } from "next/cache";
import { withOwner, readJsonBody, serviceResponse, apiError } from "@/lib/mobile-api";
import { changeShopSlug } from "@/lib/services/shop";
import type { UpdateSlugResponse } from "@/shared/api-types";

export const dynamic = "force-dynamic";

/** Randevu linkini değiştirir. */
export async function PATCH(req: Request) {
  return withOwner(req, { requireActive: true }, async ({ shop }) => {
    const body = await readJsonBody(req);
    if (!body) return apiError(400, "invalid", "Geçersiz istek.");
    const result = await changeShopSlug(shop, body.slug);
    if (result.success && result.slug !== result.previousSlug) {
      revalidatePath(`/${result.previousSlug}`);
      revalidatePath(`/${result.slug}`);
    }
    return serviceResponse(result, (r): UpdateSlugResponse => ({ slug: r.slug }));
  });
}

import { withOwner, withUser, apiJson, readJsonBody, serviceResponse, apiError } from "@/lib/mobile-api";
import { createShop } from "@/lib/services/shop";
import { computeIsLocked, getAccessEndDate } from "@/shared/plan";
import type { CreateShopResponse, ShopResponse } from "@/shared/api-types";

export const dynamic = "force-dynamic";

/** Oturumdaki kullanıcının dükkanı ve kilit durumu. Dükkan yoksa 404 no_shop → onboarding. */
export async function GET(req: Request) {
  return withOwner(req, {}, async ({ shop }) => {
    const accessEnd = getAccessEndDate(shop);
    return apiJson<ShopResponse>({
      shop: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        status: shop.status,
        subscription_status: shop.subscription_status,
        trial_end: shop.trial_end,
        current_period_end: shop.current_period_end,
      },
      isLocked: computeIsLocked(shop),
      accessEndsAt: accessEnd ? accessEnd.toISOString() : null,
    });
  });
}

/** Onboarding: dükkanı oluşturur (deneme süresi sunucuda başlar). Tekrar çağrılırsa mevcut dükkanı döner. */
export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJsonBody(req);
    if (!body) return apiError(400, "invalid", "Geçersiz istek.");
    const result = await createShop(user, {
      shopName: body.shopName,
      workStart: body.workStart,
      workEnd: body.workEnd,
      workDays: body.workDays,
      staffMembers: body.staffMembers,
    });
    return serviceResponse(result, (r): CreateShopResponse => ({ shopId: r.shopId, created: r.created }));
  });
}

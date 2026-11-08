import { withOwner, apiJson } from "@/lib/mobile-api";
import { getShopLimits, toShopLimitsResponse } from "@/lib/services/shop";

export const dynamic = "force-dynamic";

/** Plan, bu ayki kullanım ve limitler (sınırsız = null). */
export async function GET(req: Request) {
  return withOwner(req, {}, async ({ shop }) => apiJson(toShopLimitsResponse(await getShopLimits(shop.id))));
}

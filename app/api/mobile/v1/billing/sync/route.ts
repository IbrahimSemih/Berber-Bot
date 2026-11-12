import { withOwner, serviceResponse } from "@/lib/mobile-api";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncShopStoreBilling } from "@/lib/services/store-billing";
import type { BillingSyncResponse } from "@/shared/api-types";

export const dynamic = "force-dynamic";

/**
 * Satın alma / geri yükleme sonrası: dükkanın mağaza aboneliğini RevenueCat'ten
 * okuyup hemen işler (webhook birkaç saniye gecikebilir). Gövde yok; kilitli
 * dükkan da çağırabilir.
 */
export async function POST(req: Request) {
  return withOwner(req, {}, async ({ shop }) =>
    serviceResponse(
      await syncShopStoreBilling(createAdminClient(), shop.id),
      ({ shop: s, changed }): BillingSyncResponse => ({ shop: s, changed })
    )
  );
}

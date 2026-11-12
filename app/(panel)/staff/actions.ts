"use server";

import { requireOwner } from "@/lib/owner";
import { getShopLimits } from "@/lib/services/shop";

export async function getShopLimitsAction() {
  const auth = await requireOwner();
  if ("error" in auth) return { error: auth.error };

  try {
    return { data: await getShopLimits(auth.ctx.shop.id) };
  } catch (error: any) {
    return { error: error.message as string };
  }
}

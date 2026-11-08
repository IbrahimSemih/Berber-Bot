"use server";

import { requireOwner } from "@/lib/owner";
import { anonymizeCustomer as anonymizeCustomerService } from "@/lib/services/customers";

/** KVKK silme talebi. Ayrıntılar: lib/services/customers.ts */
export async function anonymizeCustomer(customerId: string) {
  const auth = await requireOwner();
  if ("error" in auth) return { success: false, error: auth.error };
  return anonymizeCustomerService(auth.ctx.shop, customerId);
}

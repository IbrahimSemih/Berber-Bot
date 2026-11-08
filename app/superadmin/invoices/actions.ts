"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySuperAdminToken } from "@/lib/auth";

export async function setInvoiceIssued(paymentRowId: string, invoiceNumber: string | null) {
  // Server Action'lar doğrudan çağrılabildiği için yetkiyi burada da doğruluyoruz
  const token = cookies().get("superadmin_auth")?.value;
  if (!token || !(await verifySuperAdminToken(token))) {
    return { success: false, error: "Yetkisiz işlem." };
  }

  const number = invoiceNumber?.trim().slice(0, 50) || null;
  const admin = createAdminClient();
  const { error } = await admin
    .from("payments")
    .update(
      number
        ? { invoice_issued_at: new Date().toISOString(), invoice_number: number }
        : { invoice_issued_at: null, invoice_number: null }
    )
    .eq("id", paymentRowId)
    .in("status", ["success", "refunded"]);

  if (error) {
    console.error("Fatura durumu güncellenemedi:", error);
    return { success: false, error: "Güncellenemedi: " + error.message };
  }

  revalidatePath("/superadmin/invoices");
  return { success: true };
}

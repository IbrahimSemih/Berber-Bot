"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function createBooking(data: {
  shopId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
}) {
  const supabase = createAdminClient();

  try {
    // 1. Find or create customer
    let customerId = null;

    // Normalize phone slightly (just trim)
    const phone = data.customerPhone.trim();

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("shop_id", data.shopId)
      .eq("phone", phone)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          shop_id: data.shopId,
          name: data.customerName.trim(),
          phone: phone,
        })
        .select()
        .single();

      if (customerError) throw new Error("Müşteri kaydı oluşturulamadı: " + customerError.message);
      customerId = newCustomer.id;
    }

    // 2. Create appointment
    const { error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        shop_id: data.shopId,
        customer_id: customerId,
        service_id: data.serviceId,
        scheduled_at: data.scheduledAt,
        status: "pending",
        source: "manual", // representing web booking
        notes: "Web Randevu Sayfasından alındı",
      });

    if (appointmentError) {
      throw new Error("Randevu oluşturulamadı: " + appointmentError.message);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

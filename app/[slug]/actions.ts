"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function createBooking(data: {
  shopId: string;
  serviceId: string;
  staffId?: string | null;
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
        staff_id: data.staffId || null,
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

export async function getBookedSlots(shopId: string, dateStr: string, staffId?: string | null) {
  const supabase = createAdminClient();
  const date = new Date(dateStr);
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // 1. Kapasite bul
  const { data: staffData } = await supabase
    .from('staff')
    .select('id')
    .eq('shop_id', shopId)
    .eq('is_active', true);

  const totalCapacity = staffData && staffData.length > 0 ? staffData.length : 1;

  // 2. Randevuları çek
  const { data: appointments } = await supabase
    .from('appointments')
    .select('scheduled_at, staff_id')
    .eq('shop_id', shopId)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', dayStart.toISOString())
    .lte('scheduled_at', dayEnd.toISOString());

  if (!appointments || appointments.length === 0) return [];

  // 3. Grupla ve kapasiteye/personele göre doluları bul
  const timeGroups: Record<string, { count: number, staffIds: string[] }> = {};
  appointments.forEach(a => {
    // format as HH:mm locally
    const d = new Date(a.scheduled_at);
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (!timeGroups[timeStr]) timeGroups[timeStr] = { count: 0, staffIds: [] };
    timeGroups[timeStr].count += 1;
    if (a.staff_id) timeGroups[timeStr].staffIds.push(a.staff_id);
  });

  const bookedSlots: string[] = [];

  for (const [time, data] of Object.entries(timeGroups)) {
    if (data.count >= totalCapacity) {
      bookedSlots.push(time);
    } else if (staffId && data.staffIds.includes(staffId)) {
      bookedSlots.push(time);
    }
  }

  return bookedSlots;
}

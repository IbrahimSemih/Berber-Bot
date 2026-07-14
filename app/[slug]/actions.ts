"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { bookingLimiter, getIp } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function createBooking(data: {
  shopId: string;
  serviceId: string;
  staffId?: string | null;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
}) {
  const ip = getIp(undefined, headers());
  const { success } = await bookingLimiter.limit(`booking_${ip}`);
  if (!success) {
    return { success: false, error: "Çok fazla randevu talebi gönderdiniz. Lütfen bir süre bekleyip tekrar deneyin." };
  }

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
    const cancelToken = crypto.randomUUID().replace(/-/g, '').substring(0, 10);
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
        cancel_token: cancelToken
      });

    if (appointmentError) {
      throw new Error("Randevu oluşturulamadı: " + appointmentError.message);
    }

    // Bildirim oluştur (Yeni randevu talebi)
    await supabase
      .from("notifications")
      .insert({
        shop_id: data.shopId,
        type: 'new_booking',
        message: `🔔 ${data.customerName.trim()} web üzerinden yeni bir randevu talebi oluşturdu. (${new Date(data.scheduledAt).toLocaleDateString("tr-TR")} saat ${new Date(data.scheduledAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })})`
      });

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

  // 1. Personelleri al (sadece aktif olanlar)
  const { data: staffData } = await supabase
    .from('staff')
    .select('id')
    .eq('shop_id', shopId)
    .eq('is_active', true);

  if (!staffData || staffData.length === 0) {
    const allTimes = [];
    for (let h = 9; h < 20; h++) {
      allTimes.push(`${String(h).padStart(2, "0")}:00`);
      allTimes.push(`${String(h).padStart(2, "0")}:30`);
    }
    return { bookedSlots: allTimes, isStaffOnLeave: false };
  }

  // 1.5 O gün izinli olan personelleri bul
  // start_date <= dateStr AND end_date >= dateStr
  const queryDate = dateStr.split("T")[0]; // YYYY-MM-DD
  const { data: leaves } = await supabase
    .from('staff_leaves')
    .select('staff_id')
    .eq('shop_id', shopId)
    .lte('start_date', queryDate)
    .gte('end_date', queryDate);

  const staffOnLeave = new Set(leaves?.map(l => l.staff_id) || []);
  
  // Aktif personellerden o gün izinli olanları çıkar
  const availableStaff = staffData.filter(s => !staffOnLeave.has(s.id));
  
  // Eğer hiç müsait personel kalmadıysa o gün tamamen kapalıdır, tüm saatleri dolu dön
  if (availableStaff.length === 0) {
    const allTimes = [];
    for (let h = 9; h < 20; h++) {
      allTimes.push(`${String(h).padStart(2, "0")}:00`);
      allTimes.push(`${String(h).padStart(2, "0")}:30`);
    }
    return { bookedSlots: allTimes, isStaffOnLeave: true };
  }

  // Eğer spesifik bir personel seçilmişse ve o personel izinliyse, yine her saati dolu dön
  if (staffId && staffOnLeave.has(staffId)) {
    const allTimes = [];
    for (let h = 9; h < 20; h++) {
      allTimes.push(`${String(h).padStart(2, "0")}:00`);
      allTimes.push(`${String(h).padStart(2, "0")}:30`);
    }
    return { bookedSlots: allTimes, isStaffOnLeave: true };
  }

  const totalCapacity = availableStaff.length;

  // 2. Randevuları çek
  const { data: appointments } = await supabase
    .from('appointments')
    .select('scheduled_at, staff_id')
    .eq('shop_id', shopId)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', dayStart.toISOString())
    .lte('scheduled_at', dayEnd.toISOString());

  if (!appointments || appointments.length === 0) return { bookedSlots: [], isStaffOnLeave: false };

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

  return { bookedSlots, isStaffOnLeave: false };
}

"use server";

import { createClient } from "@supabase/supabase-js";

export async function confirmAppointmentAndNotify(appointmentId: string, shopId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Durumu güncelle
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", appointmentId)
    .eq("shop_id", shopId);

  if (updateError) {
    throw new Error("Randevu güncellenemedi: " + updateError.message);
  }

  // 2. Randevu detaylarını çek (müşteri ve dükkan bilgisi için)
  const { data: apt, error: fetchError } = await supabase
    .from("appointments")
    .select("*, customer:customers(*), shop:shops(name)")
    .eq("id", appointmentId)
    .single();

  if (fetchError || !apt || !apt.customer) {
    console.error("Randevu detayları çekilemedi, bildirim gönderilmiyor.");
    return { success: true, notified: false }; // Update succeeded, but no notification
  }

  // Sadece web üzerinden (manuel) oluşturulanlar için mesaj atalım
  // Veya WhatsApp üzerinden de alınsa "Onaylandı" diyebiliriz.
  // Müşteri WhatsApp'tan aldıysa zaten anında onay dönüyor olabilir, ama `pending` ise ona da bildirim gidebilir.
  if (apt.status === "pending" || apt.status === "confirmed") {
    const customerName = apt.customer.name || "Değerli Müşterimiz";
    const shopName = apt.shop?.name || "Berber";

    // Tarihi formatla (basitçe)
    const dateObj = new Date(apt.scheduled_at);
    const dateStr = dateObj.toLocaleDateString("tr-TR") + " saat " + dateObj.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });

    const message = `✅ *Randevunuz Onaylandı!*\n\nMerhaba ${customerName},\n*${shopName}* için *${dateStr}* tarihindeki randevunuz işletme tarafından onaylanmıştır.\n\nBizi tercih ettiğiniz için teşekkür ederiz. Bekliyoruz!`;

    try {
      // whatsapp-service'e istek at
      const res = await fetch("http://localhost:3001/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shopId,
          phone: apt.customer.phone,
          message: message,
        }),
      });

      if (!res.ok) {
        console.error("WhatsApp bildirim hatası:", await res.text());
        return { success: true, notified: false };
      }
    } catch (err) {
      console.error("WhatsApp servisine bağlanılamadı:", err);
      return { success: true, notified: false };
    }
  }

  return { success: true, notified: true };
}

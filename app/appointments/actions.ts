"use server";

import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function confirmAppointmentAndNotify(appointmentId: string, shopId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Randevu detaylarını çek (müşteri ve dükkan bilgisi için)
  const { data: apt, error: fetchError } = await supabase
    .from("appointments")
    .select("*, customer:customers(*), shop:shops(name)")
    .eq("id", appointmentId)
    .single();

  if (fetchError || !apt || !apt.customer) {
    console.error("Randevu detayları çekilemedi, bildirim gönderilmiyor.");
    return { success: false, error: "Randevu detayları çekilemedi" };
  }

  let cancelToken = apt.cancel_token;
  if (!cancelToken) {
    cancelToken = crypto.randomUUID().replace(/-/g, '').substring(0, 10);
  }

  // 2. Durumu güncelle ve cancel_token'ı kaydet (eğer yoksa eklenmiş olur)
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "confirmed", cancel_token: cancelToken })
    .eq("id", appointmentId)
    .eq("shop_id", shopId);

  if (updateError) {
    throw new Error("Randevu güncellenemedi: " + updateError.message);
  }

  // Sadece web üzerinden (manuel) oluşturulanlar için mesaj atalım
  // Veya WhatsApp üzerinden de alınsa "Onaylandı" diyebiliriz.
  if (apt.status === "pending" || apt.status === "confirmed") {
    const customerName = apt.customer.name || "Değerli Müşterimiz";
    const shopName = apt.shop?.name || "Berber";

    // Tarihi formatla (basitçe)
    const dateObj = new Date(apt.scheduled_at);
    const dateStr = dateObj.toLocaleDateString("tr-TR") + " saat " + dateObj.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const cancelLink = `${appUrl}/r/${cancelToken}`;

    const message = `✅ *Randevunuz Onaylandı!*\n\nMerhaba ${customerName},\n*${shopName}* için *${dateStr}* tarihindeki randevunuz işletme tarafından onaylanmıştır.\n\nRandevunuzu görüntülemek veya iptal etmek için: ${cancelLink}\n\nBizi tercih ettiğiniz için teşekkür ederiz. Bekliyoruz!`;

    const result = await sendWhatsAppMessage(apt.customer.phone, message);
    if (!result.success) {
      console.error("WhatsApp bildirim hatası:", result.error);
      return { success: true, notified: false };
    }
  }

  return { success: true, notified: true };
}

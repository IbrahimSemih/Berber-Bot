import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// Admin client oluştur (Auth bypass için, çünkü token zaten secret)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Randevuyu bul
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments_full')
      .select('*')
      .eq('cancel_token', token)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Randevu bulunamadı veya geçersiz token.' }, { status: 404 });
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json({ error: 'Bu randevu zaten iptal edilmiş.' }, { status: 400 });
    }

    // Randevuyu iptal et
    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointment.id);

    if (updateError) {
      console.error('Cancel appointment error:', updateError);
      return NextResponse.json({ error: 'İptal işlemi başarısız oldu.' }, { status: 500 });
    }

    // Müşteriye WhatsApp'tan iptal bildirimi gönder
    if (appointment.customer_phone) {
      const dateObj = new Date(appointment.scheduled_at);
      const dateStr = dateObj.toLocaleDateString("tr-TR") + " saat " + dateObj.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });
      
      const message = `❌ *Randevunuz İptal Edildi*\n\nMerhaba ${appointment.customer_name || 'Değerli Müşterimiz'},\n*${appointment.shop_name || 'Berber'}* için *${dateStr}* tarihindeki *${appointment.service_name}* randevunuz iptal edilmiştir.\n\nYeni bir randevu almak için bizimle tekrar iletişime geçebilirsiniz.`;

      const result = await sendWhatsAppMessage(appointment.customer_phone, message);
      if (!result.success) {
        console.error("WhatsApp iptal bildirimi gönderilemedi:", result.error);
      }
    }

    // İşletme sahibinin paneline bildirim düşür
    await supabaseAdmin
      .from('notifications')
      .insert({
        shop_id: appointment.shop_id,
        type: 'cancel',
        message: `❌ ${appointment.customer_name || 'Bir müşteri'} randevusunu iptal etti. (${new Date(appointment.scheduled_at).toLocaleDateString("tr-TR")} saat ${new Date(appointment.scheduled_at).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })})`
      });

    return NextResponse.json({ success: true, message: 'Randevunuz başarıyla iptal edildi.' });
  } catch (error) {
    console.error('Cancel API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

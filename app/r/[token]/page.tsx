import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import CancelForm from './CancelForm';
import { Calendar, Clock, MapPin, User, Scissors } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CancelPortalPage({ params }: { params: { token: string } }) {
  const { token } = params;

  if (!token) {
    notFound();
  }

  // Admin yetkisi gerektiren durumları public olarak okumak için service role gerekebilir.
  // Ancak @supabase/auth-helpers-nextjs üzerinden anon kullanıcı olarak deneyeceğiz,
  // Eğer appointments RLS'i okunmasına izin vermiyorsa, supabase/supabase-js createClient ile admin client oluşturmalıyız.

  // Burada randevu detaylarını göstermek için RLS (anon) public değilse, admin client kullanmalıyız.
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: appointment, error } = await supabaseAdmin
    .from('appointments_full') // view kullanarak personel, müşteri ve hizmet bilgilerini alıyoruz
    .select('*')
    .eq('cancel_token', token)
    .single();

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Randevu Bulunamadı</h1>
          <p className="text-neutral-400">
            Bu bağlantı geçersiz olabilir veya randevu sistemden tamamen silinmiş olabilir.
          </p>
        </div>
      </div>
    );
  }

  const isCancelled = appointment.status === 'cancelled';
  const isPast = new Date(appointment.scheduled_at) < new Date();

  const canCancel = !isCancelled && !isPast;

  const dateObj = new Date(appointment.scheduled_at);
  const formattedDate = format(dateObj, 'd MMMM yyyy, EEEE', { locale: tr });
  const formattedTime = format(dateObj, 'HH:mm');

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className={`p-6 text-center border-b border-neutral-800 ${isCancelled ? 'bg-red-950/30' : 'bg-neutral-800/30'
          }`}>
          <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Scissors className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {appointment.shop_name || 'Maestro Berber'}
          </h1>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 bg-neutral-800 text-neutral-300 border border-neutral-700">
            {isCancelled ? (
              <span className="text-red-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> İptal Edildi
              </span>
            ) : isPast ? (
              <span className="text-neutral-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-500"></div> Geçmiş Randevu
              </span>
            ) : (
              <span className="text-green-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Onaylandı
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-3 rounded-xl bg-neutral-800/30 border border-neutral-800/50">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <User className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium mb-0.5">MÜŞTERİ</p>
                <p className="text-sm text-neutral-200 font-medium">{appointment.customer_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-xl bg-neutral-800/30 border border-neutral-800/50">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <Scissors className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium mb-0.5">HİZMET VE PERSONEL</p>
                <p className="text-sm text-neutral-200 font-medium">
                  {appointment.service_name} • <span className="text-neutral-400">{appointment.staff_name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-xl bg-neutral-800/30 border border-neutral-800/50">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-500 font-medium mb-0.5">TARİH VE SAAT</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-200 font-medium">{formattedDate}</p>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 rounded-md text-sm font-semibold text-indigo-300">
                    <Clock className="w-3.5 h-3.5" />
                    {formattedTime}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-xl bg-neutral-800/30 border border-neutral-800/50">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <MapPin className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 font-medium mb-0.5">KONUM</p>
                <p className="text-sm text-neutral-200 font-medium">
                  {appointment.shop_name || 'Maestro Berber'}
                </p>
              </div>
            </div>
          </div>

          {canCancel ? (
            <CancelForm token={token} />
          ) : (
            <div className="mt-8 p-4 bg-neutral-800/50 border border-neutral-800 rounded-xl text-center">
              <p className="text-sm text-neutral-400">
                {isCancelled
                  ? 'Bu randevu iptal edilmiştir. Yeni randevu için WhatsApp üzerinden iletişime geçebilirsiniz.'
                  : 'Geçmiş randevular üzerinde işlem yapılamaz.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-4 text-center border-t border-neutral-800 bg-neutral-900">
          <p className="text-xs text-neutral-600 font-medium">Powered by BerberBot</p>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Settings, MessageSquare, Users, Calendar, QrCode, CreditCard, ArrowRight } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import { REMINDER_HOURS_BEFORE } from "@/lib/booking";
import { TRIAL_DAYS } from "@/lib/plan-limits";
import { SUPPORT } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Kullanım Rehberi · BerberBot",
  description: "BerberBot kurulumu, randevu linki paylaşımı, WhatsApp bildirimleri ve abonelik hakkında adım adım rehber.",
};

const SECTIONS = [
  {
    icon: Settings,
    title: "1. Dükkanınızı kurun",
    body: "Kayıt olduktan sonra kurulum ekranında dükkan adınızı, çalışma günlerinizi ve saatlerinizi girin. Ardından Ayarlar sayfasından şunları tamamlayın:",
    items: ["Hizmetler, süreleri ve fiyatları", "Günlere göre çalışma saatleri", "İletişim telefonu, adres ve Instagram"],
    link: { href: "/settings", label: "Ayarlara git" },
  },
  {
    icon: QrCode,
    title: "2. Randevu linkinizi paylaşın",
    body: "Ayarlar > Randevu Linki & QR Kod bölümünden linkinizi kısa ve akılda kalır hale getirin, QR afişini yazdırın.",
    items: ["Instagram biyografinize ekleyin", "Google İşletme profilinizde 'Randevu' bağlantısı yapın", "QR afişini aynaya veya tezgaha asın"],
    link: { href: "/settings", label: "Linki düzenle" },
  },
  {
    icon: MessageSquare,
    title: "3. WhatsApp bildirimleri",
    body: `Bildirimler BerberBot'un resmi WhatsApp bildirim numarasından, dükkanınızın adıyla gider; sizin bir kurulum yapmanız gerekmez. Müşteriye randevu onaylandığında, randevudan ${REMINDER_HOURS_BEFORE} saat önce ve randevu iptal edildiğinde mesaj gönderilir. Onay mesajındaki bağlantıdan müşteri randevusunu kendisi iptal edebilir.`,
    items: ["Otomatik onay açıksa online randevular anında onaylanır", "Kapalıysa randevuyu panelden siz onaylarsınız", "Hatırlatmayı Ayarlar'dan kapatabilirsiniz"],
  },
  {
    icon: Users,
    title: "4. Personel ve izinler",
    body: "Personel ekleyin; müşteri randevu alırken personel seçebilir. İzin günlerini girdiğinizde o personel için saatler otomatik kapanır.",
    items: [],
    link: { href: "/staff", label: "Personele git" },
  },
  {
    icon: Calendar,
    title: "5. Randevu yönetimi",
    body: "Bugünkü randevularınızı Dashboard'da, tüm randevuları Randevular sayfasında görürsünüz. Telefonla aldığınız randevuları 'Randevu Ekle' ile kaydedip müşteriye WhatsApp onayı gönderebilirsiniz.",
    items: [],
    link: { href: "/dashboard", label: "Panele git" },
  },
  {
    icon: CreditCard,
    title: "6. Abonelik ve fatura",
    body: `İlk ${TRIAL_DAYS} gün ücretsizdir, kart istenmez. Devam etmek için Fatura & Abonelik sayfasında fatura bilgilerinizi girip aylık veya yıllık ödeme yaparsınız. Otomatik yenileme yoktur; bitişten önce e-posta ile hatırlatılırsınız.`,
    items: [],
    link: { href: "/settings/billing", label: "Abonelik sayfası" },
  },
];

export default function RehberPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="p-6 sm:p-8 lg:p-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">Kullanım Rehberi</h1>
            <p className="text-lg" style={{ color: "var(--text2)" }}>
              BerberBot&apos;u en verimli şekilde kullanmanız için bilmeniz gereken her şey.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="p-8 rounded-2xl border transition-all hover:-translate-y-1" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
                  <Icon className="w-8 h-8 mb-4" style={{ color: "var(--accent)" }} />
                  <h2 className="text-xl font-bold mb-3">{s.title}</h2>
                  <p style={{ color: "var(--text2)" }} className="mb-4">{s.body}</p>
                  {s.items.length > 0 && (
                    <ul className="space-y-2 text-sm mb-4" style={{ color: "var(--text3)" }}>
                      {s.items.map((item) => (
                        <li key={item} className="flex items-center gap-2"><ArrowRight className="w-4 h-4 flex-shrink-0" /> {item}</li>
                      ))}
                    </ul>
                  )}
                  {s.link && (
                    <Link href={s.link.href} className="text-sm font-medium hover:underline inline-flex items-center gap-2" style={{ color: "var(--accent)" }}>
                      {s.link.label} <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12 pt-12 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text3)" }}>
              Daha fazla yardıma mı ihtiyacınız var?{" "}
              <a href={`mailto:${SUPPORT.email}`} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>{SUPPORT.email}</a>{" "}
              adresinden veya <Link href="/iletisim" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>iletişim sayfasından</Link> bize ulaşabilirsiniz.
            </p>
          </div>
        </div>
      </div>
      <SiteFooter current="/rehber" />
    </div>
  );
}

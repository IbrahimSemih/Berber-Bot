import Link from "next/link";
import {
  BookOpen,
  Settings,
  MessageSquare,
  Users,
  Calendar,
  ArrowRight
} from "lucide-react";

export default function RehberPage() {
  return (
    <div className="min-h-screen p-8 lg:p-24" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">Kullanım Rehberi</h1>
          <p className="text-lg" style={{ color: "var(--text2)" }}>
            BerberBot'u en verimli şekilde kullanmanız için bilmeniz gereken her şey.
          </p>
        </div>

        {/* Sections */}
        <div className="grid gap-8 md:grid-cols-2">

          <div className="p-8 rounded-2xl border transition-all hover:-translate-y-1" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <Settings className="w-8 h-8 mb-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-xl font-bold mb-3">1. Sistem Kurulumu</h2>
            <p style={{ color: "var(--text2)" }} className="mb-4">
              Öncelikle <strong>Onboarding (Kurulum)</strong> ekranındaki adımları tamamlayarak dükkan bilgilerinizi ve çalışma saatlerinizi belirleyin.
            </p>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text3)" }}>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Dükkan adı ve adresi</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Açılış ve kapanış saatleri</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Tatil günleri</li>
            </ul>
          </div>

          <div className="p-8 rounded-2xl border transition-all hover:-translate-y-1" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <MessageSquare className="w-8 h-8 mb-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-xl font-bold mb-3">2. WhatsApp Bildirimleri</h2>
            <p style={{ color: "var(--text2)" }} className="mb-4">
              BerberBot, randevu alındığında veya iptal edildiğinde müşterilerinize Merkezi WhatsApp Hattı üzerinden otomatik bildirimler gönderir. Sizin ekstra bir kurulum yapmanıza gerek yoktur.
            </p>
          </div>

          <div className="p-8 rounded-2xl border transition-all hover:-translate-y-1" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <Users className="w-8 h-8 mb-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-xl font-bold mb-3">3. Personel ve Hizmetler</h2>
            <p style={{ color: "var(--text2)" }} className="mb-4">
              Dükkanınızda çalışan personelleri ve sunduğunuz hizmetleri (Saç kesimi, Sakal tıraşı vb.) sisteme ekleyerek fiyatlandırmaları ayarlayın.
            </p>
            <Link href="/staff" className="text-sm font-medium hover:underline inline-flex items-center gap-2" style={{ color: "var(--accent)" }}>
              Personel Ayarlarına Git <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-8 rounded-2xl border transition-all hover:-translate-y-1" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <Calendar className="w-8 h-8 mb-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-xl font-bold mb-3">4. Randevu Yönetimi</h2>
            <p style={{ color: "var(--text2)" }} className="mb-4">
              Panele girerek o günkü veya yaklaşan randevularınızı takvim üzerinden kolayca görüntüleyin, iptal edin veya onaylayın.
            </p>
            <Link href="/dashboard" className="text-sm font-medium hover:underline inline-flex items-center gap-2" style={{ color: "var(--accent)" }}>
              Panele git <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        <div className="text-center mt-12 pt-12 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text3)" }}>
            Daha fazla yardıma mı ihtiyacınız var? <Link href="mailto:destek@berberbot.com" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>destek@berberbot.com</Link> adresinden bize ulaşabilirsiniz.
          </p>
        </div>

      </div>
    </div>
  );
}

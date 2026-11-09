import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Clock, MapPin } from "lucide-react";
import { LegalPage, Section, CompanyInfo } from "@/components/legal/LegalPage";
import { COMPANY, SUPPORT, supportWhatsappLink } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "İletişim · BerberBot",
  description: "BerberBot destek ve iletişim bilgileri.",
};

export default function IletisimPage() {
  const wa = supportWhatsappLink();
  const card = "flex items-start gap-4 p-5 rounded-2xl border transition-colors";
  const cardStyle = { background: "var(--bg2)", borderColor: "var(--border)" };

  return (
    <LegalPage title="İletişim" path="/iletisim" updated={null}>
      <Section title="Bize ulaşın">
        <p>Kurulum, ödeme, iade veya teknik bir konuda yardıma mı ihtiyacınız var? Aşağıdaki kanallardan bize yazın.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <a href={`mailto:${SUPPORT.email}`} className={`${card} hover:border-[var(--accent)]`} style={cardStyle}>
            <Mail size={22} style={{ color: "var(--accent)" }} className="flex-shrink-0" aria-hidden />
            <div>
              <div className="font-bold text-[var(--text)]">E-posta</div>
              <div className="text-sm">{SUPPORT.email}</div>
            </div>
          </a>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className={`${card} hover:border-[var(--accent)]`} style={cardStyle}>
              <MessageCircle size={22} style={{ color: "var(--accent)" }} className="flex-shrink-0" aria-hidden />
              <div>
                <div className="font-bold text-[var(--text)]">WhatsApp Destek</div>
                <div className="text-sm">Mesaj gönderin</div>
              </div>
            </a>
          )}
          <div className={card} style={cardStyle}>
            <Clock size={22} style={{ color: "var(--accent)" }} className="flex-shrink-0" aria-hidden />
            <div>
              <div className="font-bold text-[var(--text)]">Destek saatleri</div>
              <div className="text-sm">{SUPPORT.hours}</div>
            </div>
          </div>
          <div className={card} style={cardStyle}>
            <MapPin size={22} style={{ color: "var(--accent)" }} className="flex-shrink-0" aria-hidden />
            <div>
              <div className="font-bold text-[var(--text)]">Adres</div>
              <div className="text-sm">{COMPANY.address}</div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Randevunuzla ilgili bir sorun mu var?">
        <p>
          Bir işletmeden aldığınız randevuyu iptal etmek için size WhatsApp ile gönderilen mesajdaki bağlantıyı kullanabilirsiniz.
          Randevu saati değişikliği gibi talepler için lütfen doğrudan randevu aldığınız işletmeyle iletişime geçin.
        </p>
      </Section>

      <Section title="Şirket Bilgileri">
        <CompanyInfo includeKvkk />
        <p className="mt-3 text-sm">
          Kişisel verilere ilişkin başvurular için{" "}
          <Link href="/gizlilik" className="underline" style={{ color: "var(--accent)" }}>Gizlilik Politikası</Link>&apos;na bakınız.
        </p>
      </Section>
    </LegalPage>
  );
}

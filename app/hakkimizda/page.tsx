import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, CompanyInfo, ul } from "@/components/legal/LegalPage";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Hakkımızda · BerberBot",
  description: "BerberBot: berberler için online randevu sayfası ve WhatsApp randevu bildirimleri.",
};

export default function HakkimizdaPage() {
  return (
    <LegalPage title="Hakkımızda" path="/hakkimizda" updated={null}>
      <Section title={`${SITE.name} nedir?`}>
        <p>
          {SITE.name}, berber ve erkek kuaförlerinin randevularını telefon trafiği olmadan yönetebilmesi için geliştirilmiş, Türkiye&apos;ye
          özel bir randevu yazılımıdır. İşletmeler kendilerine ait randevu linkini Instagram, Google ve WhatsApp üzerinden paylaşır;
          müşteriler uygun saati kendileri seçer, onay ve hatırlatma mesajları WhatsApp ile otomatik gider.
        </p>
      </Section>

      <Section title="Neye inanıyoruz?">
        <ul className={ul}>
          <li><strong className="text-[var(--text)]">Basitlik:</strong> Kurulum dakikalar sürer, teknik bilgi gerekmez.</li>
          <li><strong className="text-[var(--text)]">Şeffaflık:</strong> Tek plan, açık fiyat, otomatik yenileme ve gizli ücret yok.</li>
          <li><strong className="text-[var(--text)]">Gelmeme (no-show) ile mücadele:</strong> Hatırlatma mesajları ve tek tıkla iptal bağlantısı sayesinde boş kalan koltuk azalır.</li>
          <li><strong className="text-[var(--text)]">Veri güvenliği:</strong> Müşteri verileri yalnızca randevu hizmeti için kullanılır, asla satılmaz.</li>
        </ul>
      </Section>

      <Section title="Şirket Bilgileri">
        <CompanyInfo />
        <p className="mt-3 text-sm">
          Bize ulaşmak için <Link href="/iletisim" className="underline" style={{ color: "var(--accent)" }}>İletişim</Link> sayfasını kullanabilirsiniz.
        </p>
      </Section>
    </LegalPage>
  );
}

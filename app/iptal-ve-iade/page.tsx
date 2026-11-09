import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, CompanyInfo, ul } from "@/components/legal/LegalPage";
import { TRIAL_DAYS, YEARLY_REFUND_DAYS } from "@/lib/plan-limits";

export const metadata: Metadata = {
  title: "İptal ve İade Koşulları · BerberBot",
  description: "BerberBot abonelik iptal ve iade koşulları.",
};

export default function IptalVeIadePage() {
  return (
    <LegalPage title="İptal ve İade Koşulları" badge="↩️ İade" path="/iptal-ve-iade">
      <Section title="Ücretsiz Deneme">
        <ul className={ul}>
          <li>Yeni hesaplar {TRIAL_DAYS} gün boyunca ücretsiz kullanılır; kart bilgisi istenmez.</li>
          <li>Deneme süresi sonunda ödeme yapılmazsa hiçbir ücret alınmaz, hesap kısıtlanır ve randevu sayfası yeni randevu almayı durdurur.</li>
        </ul>
      </Section>

      <Section title="Otomatik Yenileme Yoktur">
        <p>
          Abonelikler otomatik olarak yenilenmez; kartınızdan tekrarlayan çekim yapılmaz. Bu nedenle ayrıca &quot;abonelik iptali&quot;
          yapmanıza gerek yoktur: dönem sonunda yenilemezseniz aboneliğiniz kendiliğinden sona erer. Bitişten önce e-posta ile
          hatırlatma gönderilir.
        </p>
      </Section>

      <Section title="Yıllık Plan: İlk Günlerde Koşulsuz Tam İade">
        <ul className={ul}>
          <li>Yıllık plan ödemesinden itibaren <strong className="text-[var(--text)]">{YEARLY_REFUND_DAYS} gün</strong> içinde talep ederseniz ödediğiniz tutarın tamamı iade edilir; gerekçe göstermeniz gerekmez.</li>
          <li>İade onaylandığında aboneliğiniz hemen sona erer.</li>
          <li>{YEARLY_REFUND_DAYS}. günden sonra iade yapılmaz; hizmet yıllık dönemin sonuna kadar devam eder.</li>
        </ul>
      </Section>

      <Section title="Aylık Plan">
        <p>
          Aylık plan ödemeleri iade edilmez. Yenilemediğiniz takdirde hizmet ödediğiniz ayın sonunda sona erer.
        </p>
      </Section>

      <Section title="İade Nasıl Talep Edilir?">
        <ul className={ul}>
          <li>Panelde <em>Fatura &amp; Abonelik</em> sayfasındaki ödeme geçmişinden ilgili ödeme için &quot;İade Talep Et&quot; butonunu kullanın, veya</li>
          <li>Hesabınıza kayıtlı e-posta adresinden aşağıdaki adrese yazın.</li>
        </ul>
        <p className="mt-3">
          Talepler en kısa sürede incelenerek sonuçlandırılır. İade, ödemenin yapıldığı karta iyzico üzerinden gerçekleştirilir;
          tutarın kart ekstrenize yansıma süresi bankanıza göre birkaç iş günü sürebilir.
        </p>
      </Section>

      <Section title="Hesap Kapatma">
        <p>
          Hesabınızı dilediğiniz zaman panelde <em>Profilim</em> sayfasından kapatabilirsiniz. Hesap kapatma, iade süresi geçmiş
          ödemelerin iadesini doğurmaz. Yasal saklama yükümlülüğü bulunan kayıtlar (ör. düzenlenmiş faturalar) muhasebe kayıtlarımızda ilgili süre boyunca saklanır.
        </p>
      </Section>

      <Section title="İletişim">
        <CompanyInfo />
        <p className="mt-3 text-sm">
          Satın alma koşullarının tamamı için{" "}
          <Link href="/mesafeli-satis-sozlesmesi" className="underline" style={{ color: "var(--accent)" }}>Mesafeli Satış Sözleşmesi</Link>&apos;ne bakınız.
        </p>
      </Section>
    </LegalPage>
  );
}

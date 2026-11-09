import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, CompanyInfo, Box, ul } from "@/components/legal/LegalPage";
import { PLANS, TRIAL_DAYS, YEARLY_REFUND_DAYS } from "@/lib/plan-limits";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Ön Bilgilendirme Formu · BerberBot",
  description: "BerberBot abonelik satın alımı öncesi ön bilgilendirme formu.",
};

const tl = (n: number) => `₺${n.toLocaleString("tr-TR")}`;

export default function OnBilgilendirmeFormuPage() {
  return (
    <LegalPage title="Ön Bilgilendirme Formu" badge="ℹ️ Satın Alma Öncesi" path="/on-bilgilendirme-formu">
      <Section title="1. Satıcı Bilgileri">
        <CompanyInfo />
      </Section>

      <Section title="2. Hizmet ve Temel Nitelikleri">
        <p>
          {SITE.name} Profesyonel abonelik: işletmeye özel online randevu sayfası, randevu/müşteri/personel yönetim paneli,
          WhatsApp randevu onay, hatırlatma ve iptal bildirimleri, analitik; sınırsız randevu ve personel. Hizmet dijitaldir ve
          ödeme onayıyla anında kullanıma açılır.
        </p>
      </Section>

      <Section title="3. Toplam Fiyat (Vergiler Dahil)">
        <Box>
          <div><strong className="text-[var(--text)]">Aylık abonelik:</strong> {tl(PLANS.pro.price)} – 1 ay</div>
          <div><strong className="text-[var(--text)]">Yıllık abonelik:</strong> {tl(PLANS.pro.yearlyPrice)} – 12 ay</div>
          <div>Teslimat / kargo ücreti yoktur. Ek ücret veya gizli masraf bulunmaz.</div>
        </Box>
      </Section>

      <Section title="4. Ödeme ve Yenileme">
        <ul className={ul}>
          <li>Ödeme kredi/banka kartı ile iyzico güvenli ödeme altyapısı üzerinden tek çekim olarak alınır.</li>
          <li>Abonelik <strong className="text-[var(--text)]">otomatik yenilenmez</strong>; süre bitiminden önce e-posta ile hatırlatma yapılır.</li>
          <li>Yeni hesaplara {TRIAL_DAYS} gün ücretsiz deneme sunulur; deneme sonunda kendiliğinden ücret alınmaz.</li>
        </ul>
      </Section>

      <Section title="5. İfa Şekli ve Süresi">
        <p>
          Hizmet, ödemenin onaylanmasıyla anında elektronik ortamda ifa edilir. Aktif abonelik veya devam eden deneme süresi
          varken yapılan ödemelerde yeni dönem mevcut bitiş tarihinin üzerine eklenir.
        </p>
      </Section>

      <Section title="6. Cayma Hakkı">
        <p>
          Elektronik ortamda anında ifa edilen hizmetlerde cayma hakkı bulunmamaktadır (Mesafeli Sözleşmeler Yönetmeliği m.15/1-ğ).
          Bununla birlikte yıllık planlarda ödeme tarihinden itibaren {YEARLY_REFUND_DAYS} gün içinde koşulsuz tam iade imkânı
          tanınır; aylık planlarda iade yapılmaz. Ayrıntılar:{" "}
          <Link href="/iptal-ve-iade" className="underline" style={{ color: "var(--accent)" }}>İptal ve İade Koşulları</Link>.
        </p>
      </Section>

      <Section title="7. Şikâyet ve İtiraz">
        <p>
          Talep ve şikâyetlerinizi yukarıdaki iletişim kanallarından iletebilirsiniz. Tüketici sayıldığınız hallerde, parasal sınırlar
          dahilinde yerleşim yerinizdeki Tüketici Hakem Heyeti&apos;ne veya Tüketici Mahkemesi&apos;ne başvurabilirsiniz.
        </p>
      </Section>

      <Section title="8. Onay">
        <p>
          Ödeme adımında bu formu ve{" "}
          <Link href="/mesafeli-satis-sozlesmesi" className="underline" style={{ color: "var(--accent)" }}>Mesafeli Satış Sözleşmesi</Link>&apos;ni
          okuduğunuzu onaylamanız istenir. Onay vermeden ödeme yapılamaz.
        </p>
      </Section>
    </LegalPage>
  );
}

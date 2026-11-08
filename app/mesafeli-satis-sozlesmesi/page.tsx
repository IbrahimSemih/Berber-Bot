import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, CompanyInfo, Box, ul } from "@/components/legal/LegalPage";
import { PLANS, TRIAL_DAYS, YEARLY_REFUND_DAYS } from "@/lib/plan-limits";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi · BerberBot",
  description: "BerberBot abonelik hizmeti mesafeli satış sözleşmesi.",
};

const tl = (n: number) => `₺${n.toLocaleString("tr-TR")}`;

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <LegalPage title="Mesafeli Satış Sözleşmesi" badge="📄 Sözleşme" path="/mesafeli-satis-sozlesmesi">
      <Section title="1. Taraflar">
        <p><strong className="text-white">Satıcı / Hizmet Sağlayıcı:</strong></p>
        <CompanyInfo />
        <p className="mt-4">
          <strong className="text-white">Alıcı:</strong> {SITE.name} platformuna üye olan ve ödeme adımında fatura bilgilerini
          beyan eden gerçek veya tüzel kişi (&quot;Alıcı&quot;). Alıcının ad-soyad/unvan, T.C. kimlik/vergi numarası, adres, telefon ve
          e-posta bilgileri ödeme sırasında beyan ettiği fatura bilgileridir.
        </p>
      </Section>

      <Section title="2. Sözleşmenin Konusu">
        <p>
          İşbu sözleşmenin konusu, Alıcının {SITE.url.replace(/^https?:\/\//, "")} adresi üzerinden elektronik ortamda satın aldığı
          {" "}{SITE.name} Profesyonel abonelik hizmetinin satışı ve ifasına ilişkin olarak tarafların hak ve yükümlülüklerinin
          belirlenmesidir. Sözleşme, 6098 sayılı Türk Borçlar Kanunu, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve —
          Alıcının tüketici sayıldığı hallerde — 6502 sayılı Tüketicinin Korunması Hakkında Kanun ile Mesafeli Sözleşmeler
          Yönetmeliği hükümlerine tabidir.
        </p>
      </Section>

      <Section title="3. Hizmetin Temel Nitelikleri">
        <ul className={ul}>
          <li>İşletmeye özel online randevu sayfası, paylaşılabilir link ve QR kod</li>
          <li>Randevu, müşteri, personel ve personel izin yönetimi paneli</li>
          <li>{SITE.name}&apos;un ortak WhatsApp bildirim numarası üzerinden müşterilere randevu onay, hatırlatma ve iptal bildirimleri</li>
          <li>Gelir ve randevu analitiği; sınırsız randevu ve personel</li>
        </ul>
        <p className="mt-3">
          Hizmet tamamen dijitaldir; fiziksel teslimat yoktur. Hizmetin güncel kapsamı{" "}
          <Link href="/#features" className="underline" style={{ color: "var(--accent)" }}>ana sayfada</Link> ve{" "}
          <Link href="/kullanim-kosullari" className="underline" style={{ color: "var(--accent)" }}>Kullanım Koşulları</Link>&apos;nda açıklanmıştır.
        </p>
      </Section>

      <Section title="4. Fiyat ve Ödeme">
        <Box>
          <div><strong className="text-white">Profesyonel – Aylık:</strong> {tl(PLANS.pro.price)} (1 ay)</div>
          <div><strong className="text-white">Profesyonel – Yıllık:</strong> {tl(PLANS.pro.yearlyPrice)} (12 ay; aylık fiyatın 10 katı)</div>
          <div>Fiyatlara tüm vergiler dahildir. Ödeme, kredi kartı veya banka kartı ile iyzico Ödeme Hizmetleri A.Ş. altyapısı üzerinden tek seferde alınır; taksit uygulanmaz.</div>
        </Box>
        <ul className={ul}>
          <li>Alıcının kart bilgileri Satıcı tarafından görülmez ve saklanmaz.</li>
          <li>Abonelik otomatik olarak yenilenmez ve karttan tekrarlayan çekim yapılmaz. Dönem sonunda hizmetin devamı için Alıcının yeni ödeme yapması gerekir.</li>
          <li>Yeni kayıt olan Alıcılara {TRIAL_DAYS} günlük ücretsiz deneme sunulur; deneme için ödeme bilgisi istenmez ve deneme sonunda ücret tahsil edilmez.</li>
          <li>Ödemeye ilişkin fatura, Alıcının beyan ettiği fatura bilgileriyle düzenlenerek elektronik ortamda iletilir.</li>
        </ul>
      </Section>

      <Section title="5. Hizmetin İfası">
        <p>
          Ödemenin onaylanmasıyla birlikte abonelik hemen (anında) aktifleşir ve hizmet elektronik ortamda ifa edilmeye başlanır.
          Abonelik süresi ödeme tarihinden; aktif abonelik veya devam eden deneme süresi varken yapılan ödemelerde ise mevcut
          bitiş tarihinden itibaren başlar ve aylık planda 1 ay, yıllık planda 12 ay sürer.
        </p>
      </Section>

      <Section title="6. Cayma Hakkı ve İade">
        <p>
          Hizmet, elektronik ortamda anında ifa edildiğinden Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesinin (ğ) bendi
          uyarınca cayma hakkı kapsamı dışındadır. Ayrıca hizmet işletmelere yöneliktir; Alıcının ticari veya mesleki amaçla
          hareket ettiği hallerde tüketici mevzuatındaki cayma hükümleri uygulanmaz.
        </p>
        <p className="mt-3">Buna rağmen Satıcı, Alıcıya aşağıdaki gönüllü iade imkânını tanır:</p>
        <ul className={ul}>
          <li><strong className="text-white">Yıllık plan:</strong> Ödeme tarihinden itibaren ilk {YEARLY_REFUND_DAYS} gün içinde talep edilmesi halinde ücretin tamamı koşulsuz iade edilir; iade ile birlikte abonelik derhal sona erer.</li>
          <li><strong className="text-white">Aylık plan:</strong> Ödenen ücret iade edilmez; hizmet ödenen dönemin sonuna kadar kullanılabilir.</li>
        </ul>
        <p className="mt-3">
          İade talebi panelde <em>Fatura &amp; Abonelik</em> sayfasından veya e-posta ile iletilir. Onaylanan iadeler ödemenin
          yapıldığı karta iyzico üzerinden gerçekleştirilir; tutarın hesaba yansıma süresi bankaya göre değişebilir.
          Ayrıntılar için{" "}
          <Link href="/iptal-ve-iade" className="underline" style={{ color: "var(--accent)" }}>İptal ve İade Koşulları</Link>&apos;na bakınız.
        </p>
      </Section>

      <Section title="7. Tarafların Yükümlülükleri">
        <ul className={ul}>
          <li>Satıcı, hizmeti{" "}<Link href="/kullanim-kosullari" className="underline" style={{ color: "var(--accent)" }}>Kullanım Koşulları</Link>&apos;na uygun şekilde sunmakla yükümlüdür.</li>
          <li>Alıcı, fatura bilgilerinin doğru olduğunu, hizmeti hukuka ve Kullanım Koşulları&apos;na uygun kullanacağını kabul eder.</li>
          <li>Alıcı, kendi müşterilerine ait kişisel verilerin veri sorumlusu olduğunu ve müşterilerini bu konuda bilgilendirmekle yükümlü olduğunu kabul eder.</li>
        </ul>
      </Section>

      <Section title="8. Uyuşmazlıkların Çözümü">
        <p>
          İşbu sözleşmeden doğan uyuşmazlıklarda Türk hukuku uygulanır. Alıcının tüketici sayıldığı hallerde, Ticaret Bakanlığınca
          her yıl ilan edilen parasal sınırlar dahilinde Alıcının veya Satıcının yerleşim yerindeki Tüketici Hakem Heyetleri ile
          Tüketici Mahkemeleri; diğer hallerde İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
        </p>
      </Section>

      <Section title="9. Yürürlük">
        <p>
          Alıcı, ödeme adımında bu sözleşmeyi ve{" "}
          <Link href="/on-bilgilendirme-formu" className="underline" style={{ color: "var(--accent)" }}>Ön Bilgilendirme Formu</Link>&apos;nu
          okuyup onayladığını elektronik ortamda beyan eder. Sözleşme, ödemenin tamamlanmasıyla kurulur ve Satıcının kayıtlarında
          saklanır; Alıcı talep etmesi halinde sözleşmenin bir kopyası e-posta ile iletilir.
        </p>
      </Section>
    </LegalPage>
  );
}

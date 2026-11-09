import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, CompanyInfo } from "@/components/legal/LegalPage";
import { COMPANY } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Gizlilik Politikası · BerberBot",
  description: "BerberBot kişisel verilerin korunması ve gizlilik politikası.",
};

export default function GizlilikPolitikasiPage() {
  return (
    <LegalPage title="Gizlilik Politikası" badge="🔒 KVKK" path="/gizlilik">
          {/* 1 */}
          <Section title="1. Giriş">
            <p>
              BerberBot (&quot;Şirket&quot;, &quot;Biz&quot;) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;)
              kapsamında kişisel verilerinizin güvenliğine büyük önem veriyoruz. Bu Gizlilik Politikası,
              BerberBot platformunu (&quot;Hizmet&quot;) kullanırken hangi verilerinizin toplandığını, nasıl işlendiğini
              ve korunduğunu açıklamaktadır.
            </p>
          </Section>

          {/* 2 */}
          <Section title="2. Veri Sorumlusu">
            <p>
              BerberBot hesabı açan işletme sahiplerinin (Kullanıcı) verileri bakımından KVKK kapsamında veri sorumlusu{" "}
              <strong className="text-[var(--text)]">{COMPANY.legalName}</strong>&apos;dır (&quot;BerberBot&quot;). İşletmelerin kendi müşterilerine
              (randevu alan kişiler) ait veriler bakımından ise veri sorumlusu ilgili işletme, BerberBot ise veri işleyendir; bu verilere ilişkin
              bilgilendirme{" "}
              <Link href="/aydinlatma-metni" className="underline" style={{ color: "var(--accent)" }}>KVKK Aydınlatma Metni</Link>&apos;nde yer alır.
            </p>
          </Section>

          {/* 3 */}
          <Section title="3. Toplanan Kişisel Veriler">
            <p>Hizmetimizi kullanırken aşağıdaki kişisel veriler toplanmaktadır:</p>
            <ul className="list-disc pl-6 mt-3 flex flex-col gap-2">
              <li><strong className="text-[var(--text)]">Kimlik ve İletişim Bilgileri:</strong> Ad-soyad, telefon numarası, e-posta adresi</li>
              <li><strong className="text-[var(--text)]">Hesap Bilgileri:</strong> Şifre (hashlenmiş), dükkan adı, kullanıcı tercihleri</li>
              <li><strong className="text-[var(--text)]">İşlem ve Fatura Verileri:</strong> Randevu bilgileri, hizmet tercihleri, ödeme kayıtları, fatura bilgileri (T.C. kimlik / vergi numarası, fatura adresi). Kart bilgileri BerberBot tarafından görülmez ve saklanmaz; ödeme kuruluşu iyzico tarafından işlenir.</li>
              <li><strong className="text-[var(--text)]">WhatsApp Verileri:</strong> Gönderilen bildirim mesajlarının içeriği, iletim durumu ve BerberBot bildirim numarasına gönderilen mesajlar ile telefon numaraları</li>
              <li><strong className="text-[var(--text)]">Teknik Veriler:</strong> IP adresi, tarayıcı bilgisi, oturum çerezleri, cihaz tipi</li>
              <li><strong className="text-[var(--text)]">Kullanım Verileri:</strong> Platform üzerindeki etkileşim ve davranış verileri</li>
            </ul>
          </Section>

          {/* 4 */}
          <Section title="4. Verilerin İşlenme Amaçları">
            <p>Kişisel verileriniz KVKK'nın 5. ve 6. maddelerinde belirtilen şartlara uygun olarak aşağıdaki amaçlarla işlenmektedir:</p>
            <ul className="list-disc pl-6 mt-3 flex flex-col gap-2">
              <li>Hizmet sözleşmesinin ifası ve platform işlevlerinin sağlanması</li>
              <li>Randevu yönetimi, hatırlatma mesajları ve bildirim gönderimi</li>
              <li>Kullanıcı hesaplarının oluşturulması ve yönetimi</li>
              <li>Müşteri desteği ve teknik destek sağlanması</li>
              <li>Hizmet kalitesinin iyileştirilmesi ve yeni özelliklerin geliştirilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>Güvenlik önlemlerinin alınması ve dolandırıcılığın önlenmesi</li>
            </ul>
          </Section>

          {/* 5 */}
          <Section title="5. Verilerin Paylaşılması">
            <p>Kişisel verileriniz aşağıdaki durumlar dışında üçüncü kişilerle paylaşılmaz:</p>
            <ul className="list-disc pl-6 mt-3 flex flex-col gap-2">
              <li><strong className="text-[var(--text)]">Altyapı Sağlayıcıları:</strong> Veritabanı ve kimlik doğrulama (Supabase), uygulama barındırma (Vercel), e-posta gönderimi (Resend), güvenlik amaçlı istek sınırlama (Upstash)</li>
              <li><strong className="text-[var(--text)]">Ödeme Kuruluşu:</strong> Abonelik ödemelerinin alınması ve iadesi için iyzico Ödeme Hizmetleri A.Ş.</li>
              <li><strong className="text-[var(--text)]">Mali Müşavir / e-Fatura Sağlayıcısı:</strong> Yasal fatura düzenleme ve muhasebe yükümlülükleri için</li>
              <li><strong className="text-[var(--text)]">WhatsApp (Meta):</strong> WhatsApp Business API üzerinden mesaj iletimi için gerekli minimum bilgi</li>
              <li><strong className="text-[var(--text)]">Hukuki Zorunluluklar:</strong> Mahkeme kararı veya yasal düzenleme gereği yetkili kurumlara</li>
            </ul>
            <p className="mt-3">
              Verileriniz hiçbir koşulda reklam amaçlı üçüncü taraflarla paylaşılmaz veya satılmaz.
            </p>
          </Section>

          {/* 6 */}
          <Section title="6. Çerezler (Cookies)">
            <p>
              Platformumuz, kullanıcı oturumunun yönetimi için zorunlu çerezler kullanmaktadır.
              Bu çerezler kimlik doğrulama, güvenlik ve temel site işlevleri için gereklidir.
              Analitik veya reklam amaçlı üçüncü taraf çerezleri kullanılmamaktadır.
            </p>
          </Section>

          {/* 7 */}
          <Section title="7. Verilerin Saklanması ve Güvenliği">
            <p>Kişisel verileriniz:</p>
            <ul className="list-disc pl-6 mt-3 flex flex-col gap-2">
              <li>Hizmet ilişkisi devam ettiği sürece ve sona erdikten sonra yasal saklama yükümlülükleri çerçevesinde muhafaza edilir</li>
              <li>SSL/TLS şifreleme protokolleri ile iletilir</li>
              <li>Endüstri standardı güvenlik önlemleri (şifreli veritabanları, erişim kontrolleri, güvenlik duvarları) ile korunur</li>
              <li>Düzenli güvenlik denetimleri ve güncellemeler ile güvence altına alınır</li>
            </ul>
          </Section>

          {/* 8 */}
          <Section title="8. KVKK Kapsamında Haklarınız">
            <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
            <div className="mt-3 rounded-xl border p-5 flex flex-col gap-2" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
              {[
                "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
                "İşlenmişse buna ilişkin bilgi talep etme",
                "İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme",
                "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme",
                "Eksik veya yanlış işlenmiş ise düzeltilmesini isteme",
                "KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini isteme",
                "Düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme",
                "Münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonuç çıkmasına itiraz etme",
                "Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme",
              ].map((right, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span style={{ color: "var(--accent)" }} className="flex-shrink-0 mt-0.5">✓</span>
                  <span>{right}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* 9 */}
          <Section title="9. Verilerin Yurt Dışına Aktarılması">
            <p>
              Platform altyapımızda kullanılan hizmet sağlayıcıların (Supabase, Vercel, Resend, Upstash, Meta)
              sunucuları yurt dışında bulunabilir. Bu aktarımlar KVKK&apos;nın 9. maddesi ve ilgili yönetmelik
              uyarınca; yeterlilik kararı bulunmadığı hallerde Kişisel Verileri Koruma Kurulu&apos;nca ilan edilen
              standart sözleşmeler gibi uygun güvenceler sağlanarak gerçekleştirilir.
            </p>
          </Section>

          {/* 10 */}
          <Section title="10. Çocukların Gizliliği">
            <p>
              Hizmetimiz 18 yaşın altındaki bireylere yönelik değildir. 18 yaşın altındaki kişilerin
              verilerinin tarafımıza ulaştığını fark etmemiz halinde, bu verileri derhal silmek için
              gerekli adımları atacağız.
            </p>
          </Section>

          {/* 11 */}
          <Section title="11. Değişiklikler">
            <p>
              Bu Gizlilik Politikası'nda yapılacak değişiklikler, güncellenmiş tarih ile birlikte
              bu sayfada yayımlanacaktır. Önemli değişiklikler için kayıtlı e-posta adresinize
              bilgilendirme yapılacaktır.
            </p>
          </Section>

          {/* 12 */}
          <Section title="12. İletişim">
            <p>
              Kişisel verileriniz hakkında sorularınız ve KVKK&apos;nın 11. maddesindeki haklarınıza ilişkin
              başvurularınız için aşağıdaki kanallardan bize ulaşabilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak yanıtlanır.
            </p>
            <CompanyInfo includeKvkk />
          </Section>
    </LegalPage>
  );
}

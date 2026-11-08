import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, CompanyInfo } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Kullanım Koşulları · BerberBot",
  description: "BerberBot hizmet ve kullanım koşulları.",
};

export default function KullanimKosullariPage() {
  return (
    <LegalPage title="Kullanım Koşulları" badge="📄 Sözleşme" path="/kullanim-kosullari">
          {/* 1 */}
          <Section title="1. Genel Hükümler">
            <p>
              Bu Kullanım Koşulları (&quot;Sözleşme&quot;), BerberBot SaaS platformunun (&quot;Hizmet&quot;)
              kullanımını düzenlemektedir. Hizmete kayıt olarak veya Hizmeti kullanarak bu Sözleşme&apos;nin
              tüm şartlarını kabul etmiş sayılırsınız. Kabul etmiyorsanız, lütfen Hizmeti kullanmayınız.
            </p>
          </Section>

          {/* 2 */}
          <Section title="2. Tanımlar">
            <div className="mt-2 rounded-xl border p-5 flex flex-col gap-3" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
              {[
                { term: "Platform", desc: "BerberBot tarafından sunulan web uygulaması, online randevu sayfaları, WhatsApp bildirim altyapısı ve ilgili tüm dijital hizmetler" },
                { term: "Kullanıcı", desc: "Platforma kayıt olan ve Hizmeti kullanan dükkan sahipleri ve işletmeciler" },
                { term: "Son Kullanıcı", desc: "Kullanıcının müşterileri (Kullanıcının online randevu sayfasından randevu alan veya Kullanıcı tarafından sisteme kaydedilen kişiler)" },
                { term: "İçerik", desc: "Platform üzerinde oluşturulan, yüklenen veya paylaşılan tüm veriler" },
              ].map((item, i) => (
                <div key={i} className="text-sm">
                  <strong className="text-white">{item.term}:</strong>{" "}
                  <span>{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* 3 */}
          <Section title="3. Hizmetin Kapsamı">
            <p>BerberBot aşağıdaki hizmetleri sunmaktadır:</p>
            <ul className="list-disc pl-6 mt-3 flex flex-col gap-2">
              <li>İşletmeye özel, paylaşılabilir online randevu sayfası ve QR kod</li>
              <li>Randevu takvimi, personel ve izin yönetimi paneli</li>
              <li>Müşteri listesi ve randevu geçmişi</li>
              <li>BerberBot&apos;un ortak WhatsApp bildirim numarası üzerinden randevu onay, hatırlatma ve iptal mesajları</li>
              <li>Müşterinin randevusunu kendisinin iptal edebildiği iptal bağlantısı</li>
              <li>Gelir ve randevu analitiği</li>
            </ul>
            <p className="mt-3">
              Hizmetin kapsamı, seçilen abonelik planına göre değişiklik gösterebilir.
            </p>
          </Section>

          {/* 4 */}
          <Section title="4. Hesap Oluşturma ve Güvenlik">
            <ul className="list-disc pl-6 flex flex-col gap-2">
              <li>Hesap oluşturmak için 18 yaşından büyük olmanız gerekmektedir</li>
              <li>Kayıt sırasında doğru ve güncel bilgiler vermeniz zorunludur</li>
              <li>Hesap güvenliğinizden (şifre, oturum bilgileri) siz sorumlusunuz</li>
              <li>Hesabınızda gerçekleşen tüm işlemlerden siz sorumlu tutulursunuz</li>
              <li>Yetkisiz erişim tespit etmeniz halinde derhal bize bildirmeniz gerekmektedir</li>
            </ul>
          </Section>

          {/* 5 */}
          <Section title="5. Kullanıcı Yükümlülükleri">
            <p>Kullanıcı olarak aşağıdaki kurallara uymayı kabul edersiniz:</p>
            <ul className="list-disc pl-6 mt-3 flex flex-col gap-2">
              <li>Platformu yalnızca yasal amaçlarla ve Türkiye Cumhuriyeti mevzuatına uygun şekilde kullanmak</li>
              <li>Müşterilerinizin kişisel verilerini KVKK ve ilgili mevzuata uygun olarak işlemek</li>
              <li>Sisteme yalnızca randevu vermiş/vermek isteyen müşterilerin bilgilerini girmek; bildirim altyapısını reklam, kampanya veya istenmeyen mesaj için kullanmamak</li>
              <li>Platformun güvenliğini tehlikeye atacak eylemlerden kaçınmak</li>
              <li>Ters mühendislik, hacking veya yetkisiz erişim girişiminde bulunmamak</li>
              <li>Platformu, üçüncü taraflara alt lisans vermemek veya yeniden satmamak</li>
            </ul>
          </Section>

          {/* 6 */}
          <Section title="6. Fikri Mülkiyet Hakları">
            <p>
              BerberBot platformunun tasarımı, yazılım kodları, logoları, markaları ve tüm özgün içerikleri
              BerberBot&apos;a aittir ve fikri mülkiyet hakları kapsamında korunmaktadır. Kullanıcılar,
              bu haklara müdahale etmeyeceğini kabul eder.
            </p>
            <p className="mt-3">
              Kullanıcılar tarafından platforma yüklenen içeriklerin (dükkan bilgileri, hizmet tanımları vb.)
              fikri mülkiyet hakları kullanıcıya aittir. BerberBot, bu içerikleri yalnızca hizmet sunumu
              amacıyla kullanma hakkına sahiptir.
            </p>
          </Section>

          {/* 7 */}
          <Section title="7. Abonelik ve Ücretlendirme">
            <ul className="list-disc pl-6 flex flex-col gap-2">
              <li>Hizmet, farklı özelliklere sahip ücretli abonelik planları ile sunulmaktadır</li>
              <li>Ücretler, seçilen plana göre aylık veya yıllık olarak faturalandırılır</li>
              <li>Fiyat değişiklikleri en az 30 gün önceden bildirilir</li>
              <li>Abonelikler otomatik olarak yenilenmez; dönem sonunda Kullanıcı dilerse yeni dönem için ödeme yapar. Bitişten önce e-posta ile hatırlatma gönderilir</li>
              <li>Kullanıcı dilediği zaman yenilememeyi tercih edebilir; ödenmiş dönemin sonuna kadar hizmetten yararlanmaya devam eder</li>
              <li>Yıllık planlar, aylık fiyatın 10 katı üzerinden (2 ay bedava) tek seferde faturalandırılır ve otomatik olarak yenilenmez</li>
              <li>Yıllık plan satın alımından itibaren ilk 30 gün içinde iptal talebinde ücretin tamamı koşulsuz iade edilir; 30. günden sonra iade yapılmaz, hizmet dönem sonuna kadar devam eder</li>
              <li>Aylık planlarda yapılan ödemeler için iade yapılmaz; iptal halinde hizmet ödenen dönemin sonuna kadar sürer</li>
              <li>Ücretsiz deneme süresi sona erdiğinde, abonelik başlatılmadığı takdirde hesap kısıtlanır ve online randevu sayfası yeni randevu almayı durdurur. Deneme için kart bilgisi istenmez</li>
              <li>Satın alma koşullarının ayrıntıları <Link href="/mesafeli-satis-sozlesmesi" className="underline" style={{ color: "var(--accent)" }}>Mesafeli Satış Sözleşmesi</Link> ve <Link href="/iptal-ve-iade" className="underline" style={{ color: "var(--accent)" }}>İptal ve İade Koşulları</Link> sayfalarında yer alır</li>
            </ul>
          </Section>

          {/* 8 */}
          <Section title="8. Hizmet Düzeyi ve Erişilebilirlik">
            <p>
              BerberBot, platformun kesintisiz ve yüksek erişilebilirlikle çalışmasını hedefler.
              Ancak aşağıdaki durumlarda hizmet kesintisi yaşanabilir:
            </p>
            <ul className="list-disc pl-6 mt-3 flex flex-col gap-2">
              <li>Planlı bakım ve güncelleme çalışmaları (önceden bildirilir)</li>
              <li>Üçüncü taraf hizmet sağlayıcılarından (WhatsApp API, sunucu altyapısı) kaynaklanan kesintiler</li>
              <li>Mücbir sebep halleri (doğal afet, siber saldırı, yasal düzenleme değişiklikleri)</li>
            </ul>
          </Section>

          {/* 9 */}
          <Section title="9. Verilerin Korunması">
            <p>
              Verilerinizin korunmasına ilişkin detaylı bilgi için lütfen{" "}
              <Link href="/gizlilik" className="font-medium underline underline-offset-2 transition-colors hover:text-white" style={{ color: "var(--accent)" }}>
                Gizlilik Politikamızı
              </Link>{" "}
              inceleyiniz. Kullanıcının müşterilerine ait veriler bakımından Kullanıcı veri sorumlusu, BerberBot ise
              Kullanıcı adına ve talimatları doğrultusunda veriyi işleyen &quot;veri işleyen&quot;dir. BerberBot bu verileri yalnızca
              Hizmetin sunulması (randevu kaydı, WhatsApp bildirimleri) amacıyla işler, başka amaçla kullanmaz ve üçüncü kişilere
              satmaz; gerekli teknik ve idari güvenlik tedbirlerini alır. Kullanıcı, müşterilerini{" "}
              <Link href="/aydinlatma-metni" className="font-medium underline underline-offset-2" style={{ color: "var(--accent)" }}>
                KVKK Aydınlatma Metni
              </Link>{" "}
              hakkında bilgilendirmekten ve gerektiğinde açık rızalarını almaktan sorumludur.
            </p>
          </Section>

          {/* 10 */}
          <Section title="10. Sorumluluk Sınırlaması">
            <div className="mt-2 rounded-xl border p-5" style={{ background: "rgba(255,95,87,0.05)", borderColor: "rgba(255,95,87,0.15)" }}>
              <p className="text-sm">
                BerberBot, platformun kullanımından veya kullanılamamasından doğan doğrudan, dolaylı,
                arızi veya özel zararlardan sorumlu tutulamaz. Bu sınırlamalar:
              </p>
              <ul className="list-disc pl-6 mt-3 flex flex-col gap-2 text-sm">
                <li>Randevu kayıpları veya müşteri iletişim aksaklıkları</li>
                <li>WhatsApp API değişiklikleri veya kesintileri nedeniyle oluşan aksaklıklar</li>
                <li>Kullanıcı hatasından kaynaklanan veri kayıpları</li>
                <li>Üçüncü taraf hizmetlerden kaynaklanan sorunlar</li>
              </ul>
              <p className="mt-3 text-sm">
                BerberBot&apos;un toplam sorumluluğu, her halükarda, kullanıcının son 12 ayda ödediği
                abonelik ücretini aşamaz.
              </p>
            </div>
          </Section>

          {/* 11 */}
          <Section title="11. Hesap Askıya Alma ve Fesih">
            <p>BerberBot, aşağıdaki durumlarda hesabınızı askıya alma veya feshetme hakkını saklı tutar:</p>
            <ul className="list-disc pl-6 mt-3 flex flex-col gap-2">
              <li>Bu Sözleşme şartlarının ihlali</li>
              <li>Yasadışı faaliyetlerde kullanım</li>
              <li>Platform güvenliğini tehdit eden davranışlar</li>
              <li>Ödenmemiş abonelik ücretleri</li>
              <li>Uzun süreli hesap hareketsizliği (6 aydan fazla)</li>
            </ul>
            <p className="mt-3">
              Hesap feshinde, kullanıcıya ait veriler KVKK kapsamında yasal saklama süreleri
              boyunca muhafaza edildikten sonra güvenli şekilde silinir.
            </p>
          </Section>

          {/* 12 */}
          <Section title="12. Değişiklikler">
            <p>
              BerberBot, bu Sözleşme&apos;yi herhangi bir zamanda güncelleme hakkına sahiptir.
              Önemli değişiklikler, en az 30 gün önceden kayıtlı e-posta adresinize ve/veya
              platform üzerinden bildirilir. Değişiklikler sonrasında Hizmeti kullanmaya devam
              etmeniz, güncellenmiş koşulları kabul ettiğiniz anlamına gelir.
            </p>
          </Section>

          {/* 13 */}
          <Section title="13. Uygulanacak Hukuk ve Uyuşmazlık Çözümü">
            <p>
              Bu Sözleşme, Türkiye Cumhuriyeti hukukuna tabidir. Sözleşme&apos;den doğan
              uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>
          </Section>

          {/* 14 */}
          <Section title="14. İletişim">
            <p>Bu Kullanım Koşulları hakkında sorularınız için:</p>
            <CompanyInfo />
          </Section>
    </LegalPage>
  );
}

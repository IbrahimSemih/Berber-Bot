import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, Box, ul } from "@/components/legal/LegalPage";
import { COMPANY, SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni (Randevu Alan Kişiler) · BerberBot",
  description: "BerberBot altyapısıyla online randevu alan kişiler için kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
};

export default function AydinlatmaMetniPage() {
  return (
    <LegalPage title="KVKK Aydınlatma Metni" badge="🔒 Randevu Alan Kişiler İçin" path="/aydinlatma-metni">
      <Section title="1. Bu Metin Kimler İçin?">
        <p>
          Bu metin, {SITE.name} altyapısını kullanan berber, kuaför ve benzeri işletmelerden (&quot;İşletme&quot;) online randevu
          sayfası üzerinden randevu alan veya İşletme tarafından randevusu sisteme kaydedilen kişileri, 6698 sayılı Kişisel
          Verilerin Korunması Kanunu (&quot;KVKK&quot;) m.10 uyarınca bilgilendirmek amacıyla hazırlanmıştır.
        </p>
      </Section>

      <Section title="2. Veri Sorumlusu ve Veri İşleyen">
        <ul className={ul}>
          <li><strong className="text-[var(--text)]">Veri sorumlusu:</strong> Randevu aldığınız İşletmedir. İşletmenin adı randevu sayfasında ve size gönderilen mesajlarda yer alır.</li>
          <li><strong className="text-[var(--text)]">Veri işleyen:</strong> {COMPANY.legalName} ({SITE.name}). {SITE.name}, verilerinizi yalnızca İşletme adına ve randevu hizmetinin sunulması amacıyla işler; başka amaçla kullanmaz, satmaz ve reklam için paylaşmaz.</li>
        </ul>
      </Section>

      <Section title="3. İşlenen Kişisel Veriler">
        <ul className={ul}>
          <li><strong className="text-[var(--text)]">Kimlik ve iletişim:</strong> Ad soyad, cep telefonu numarası</li>
          <li><strong className="text-[var(--text)]">Randevu bilgileri:</strong> Hizmet, tarih/saat, tercih edilen personel, randevu durumu (onaylı, iptal vb.) ve geçmiş randevular</li>
          <li><strong className="text-[var(--text)]">İşlem güvenliği:</strong> IP adresi ve işlem zamanı (kötüye kullanımı önlemek amacıyla, kısa süreli)</li>
        </ul>
      </Section>

      <Section title="4. İşleme Amaçları ve Hukuki Sebepler">
        <ul className={ul}>
          <li>Randevunuzun oluşturulması, değiştirilmesi, iptali ve İşletme tarafından yönetilmesi — <em>bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması</em> (KVKK m.5/2-c)</li>
          <li>Randevu onayı, hatırlatması ve iptal teyidinin WhatsApp ile size iletilmesi — <em>sözleşmenin ifası</em> (KVKK m.5/2-c)</li>
          <li>Sistemin güvenliğinin sağlanması, sahte ve tekrarlı randevu taleplerinin engellenmesi — <em>veri sorumlusunun meşru menfaati</em> (KVKK m.5/2-f)</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi ve yetkili makam taleplerinin karşılanması — <em>kanuni yükümlülük</em> (KVKK m.5/2-ç)</li>
        </ul>
        <p className="mt-3">
          Size reklam veya kampanya mesajı gönderilmez. İşletme bu amaçla iletişim kurmak isterse ayrıca açık rızanızı almakla yükümlüdür.
        </p>
      </Section>

      <Section title="5. Toplama Yöntemi">
        <p>
          Verileriniz, randevu formunu doldurmanız veya randevunuzu İşletmeye telefonla/yüz yüze bildirmeniz üzerine İşletme
          tarafından sisteme girilmesi yoluyla, elektronik ortamda toplanır.
        </p>
      </Section>

      <Section title="6. Aktarım">
        <ul className={ul}>
          <li><strong className="text-[var(--text)]">İşletme:</strong> Randevunuzu yönetebilmesi için.</li>
          <li><strong className="text-[var(--text)]">Meta Platforms (WhatsApp Business):</strong> Onay, hatırlatma ve iptal mesajlarının iletilmesi için yalnızca telefon numaranız ve mesaj içeriği.</li>
          <li><strong className="text-[var(--text)]">Barındırma hizmet sağlayıcıları:</strong> Verilerin güvenli şekilde saklanması için (Supabase, Vercel).</li>
          <li><strong className="text-[var(--text)]">Yetkili kamu kurum ve kuruluşları:</strong> Kanunen zorunlu hallerde.</li>
        </ul>
        <p className="mt-3">
          Bu hizmet sağlayıcıların sunucuları yurt dışında bulunabilir; aktarımlar KVKK m.9 uyarınca uygun güvenceler
          (standart sözleşmeler vb.) sağlanarak yapılır.
        </p>
      </Section>

      <Section title="7. Saklama Süresi">
        <p>
          Randevu kayıtları, İşletmenin {SITE.name} hesabı açık olduğu sürece İşletmenin randevu geçmişini görebilmesi için
          saklanır. İşletme kaydınızı silebilir; İşletme hesabını kapattığında verileriniz, kanuni saklama yükümlülükleri saklı
          kalmak kaydıyla silinir veya anonim hale getirilir.
        </p>
      </Section>

      <Section title="8. Haklarınız">
        <p>KVKK m.11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, aktarıldığı üçüncü kişileri bilme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz.</p>
        <Box>
          <div>Başvurularınızı öncelikle randevu aldığınız <strong className="text-[var(--text)]">İşletmeye</strong> iletebilirsiniz.</div>
          <div>
            Ayrıca <a className="underline" href={`mailto:${COMPANY.kvkkEmail}`}>{COMPANY.kvkkEmail}</a> adresine yazabilirsiniz; talebiniz
            ilgili İşletmeye iletilerek en geç 30 gün içinde sonuçlandırılır.
          </div>
        </Box>
        <p className="mt-3 text-sm">
          İşletme hesabı sahiplerinin verileri için bkz.{" "}
          <Link href="/gizlilik" className="underline" style={{ color: "var(--accent)" }}>Gizlilik Politikası</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}

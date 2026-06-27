"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GizlilikPolitikasiPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Nav */}
      <nav
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,10,10,0.8)" }}
        className="fixed top-0 left-0 right-0 h-16 flex items-center px-6 md:px-12 gap-5 z-50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>✂</div>
          <span className="font-heading font-black text-xl tracking-tight">BerberBot</span>
        </Link>
        <Link
          href="/"
          className="ml-auto flex items-center gap-2 text-sm font-medium transition-colors hover:text-white"
          style={{ color: "var(--text3)" }}>
          <ArrowLeft size={16} /> Ana Sayfa
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <div className="mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-dim2)", color: "var(--accent)" }}>
            🔒 KVKK Uyumlu
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tight mb-4">
            Gizlilik Politikası
          </h1>
          <p className="text-base font-light" style={{ color: "var(--text3)" }}>
            Son güncelleme: 27 Haziran 2025
          </p>
        </div>

        {/* Sections */}
        <article className="flex flex-col gap-10 text-base leading-relaxed" style={{ color: "var(--text2)" }}>
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
              KVKK kapsamında veri sorumlusu BerberBot SaaS platformunun sahibi ve işleticisidir.
              Veri sorumlusu iletişim bilgileri bu politikanın sonunda yer almaktadır.
            </p>
          </Section>

          {/* 3 */}
          <Section title="3. Toplanan Kişisel Veriler">
            <p>Hizmetimizi kullanırken aşağıdaki kişisel veriler toplanmaktadır:</p>
            <ul className="list-disc pl-6 mt-3 flex flex-col gap-2">
              <li><strong className="text-white">Kimlik ve İletişim Bilgileri:</strong> Ad-soyad, telefon numarası, e-posta adresi</li>
              <li><strong className="text-white">Hesap Bilgileri:</strong> Şifre (hashlenmiş), dükkan adı, kullanıcı tercihleri</li>
              <li><strong className="text-white">İşlem Verileri:</strong> Randevu bilgileri, hizmet tercihleri, ödeme kayıtları</li>
              <li><strong className="text-white">WhatsApp Verileri:</strong> WhatsApp üzerinden bot ile gerçekleştirilen yazışma içerikleri ve telefon numaraları</li>
              <li><strong className="text-white">Teknik Veriler:</strong> IP adresi, tarayıcı bilgisi, oturum çerezleri, cihaz tipi</li>
              <li><strong className="text-white">Kullanım Verileri:</strong> Platform üzerindeki etkileşim ve davranış verileri</li>
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
              <li><strong className="text-white">Altyapı Sağlayıcıları:</strong> Sunucu barındırma (Supabase/AWS), e-posta gönderim hizmetleri gibi teknik altyapı ortaklarımız</li>
              <li><strong className="text-white">WhatsApp (Meta):</strong> WhatsApp Business API üzerinden mesaj iletimi için gerekli minimum bilgi</li>
              <li><strong className="text-white">Hukuki Zorunluluklar:</strong> Mahkeme kararı veya yasal düzenleme gereği yetkili kurumlara</li>
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
              Platform altyapımız bulut tabanlı hizmetler kullanmaktadır. Kişisel verileriniz,
              KVKK&apos;nın 9. maddesi kapsamında yeterli korumanın bulunduğu ülkelere veya veri
              sorumlusunun yeterli bir korumayı yazılı olarak taahhüt ettiği ülkelerdeki sunucularda
              işlenebilir. Bu aktarımlar, KVKK ve ilgili mevzuata uygun şekilde gerçekleştirilmektedir.
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
              Kişisel verileriniz hakkında sorularınız veya talepleriniz için aşağıdaki kanallardan
              bizimle iletişime geçebilirsiniz:
            </p>
            <div className="mt-3 rounded-xl border p-5" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
              <div className="flex flex-col gap-2 text-sm">
                <div><strong className="text-white">Platform:</strong> BerberBot SaaS</div>
                <div><strong className="text-white">E-posta:</strong> destek@berberbot.com</div>
                <div><strong className="text-white">KVKK Başvuru:</strong> kvkk@berberbot.com</div>
              </div>
            </div>
          </Section>
        </article>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-20 py-8 border-t" style={{ borderColor: "var(--border)", background: "var(--bg2)" }}>
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-4 md:justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>✂</div>
            <span className="font-heading font-bold text-lg text-white">BerberBot</span>
          </div>
          <div className="flex gap-6 text-sm font-medium" style={{ color: "var(--text3)" }}>
            <span className="text-white">Gizlilik Politikası</span>
            <Link href="/kullanim-kosullari" className="hover:text-white transition-colors">Kullanım Koşulları</Link>
          </div>
          <div className="text-sm" style={{ color: "var(--text3)" }}>
            © 2025 BerberBot SaaS.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading font-bold text-xl md:text-2xl mb-4 text-white">{title}</h2>
      {children}
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function KullanimKosullariPage() {
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
            📋 Hizmet Sözleşmesi
          </div>
          <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tight mb-4">
            Kullanım Koşulları
          </h1>
          <p className="text-base font-light" style={{ color: "var(--text3)" }}>
            Son güncelleme: 27 Haziran 2025
          </p>
        </div>

        {/* Sections */}
        <article className="flex flex-col gap-10 text-base leading-relaxed" style={{ color: "var(--text2)" }}>
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
                { term: "Platform", desc: "BerberBot tarafından sunulan web uygulaması, WhatsApp botu ve ilgili tüm dijital hizmetler" },
                { term: "Kullanıcı", desc: "Platforma kayıt olan ve Hizmeti kullanan dükkan sahipleri ve işletmeciler" },
                { term: "Son Kullanıcı", desc: "Kullanıcının müşterileri (WhatsApp üzerinden randevu alan kişiler)" },
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
              <li>WhatsApp üzerinden otomatik randevu alma ve yönetme botu</li>
              <li>Randevu takvimi ve zamanlama yönetim paneli</li>
              <li>Müşteri veritabanı ve müşteri ilişkileri yönetimi</li>
              <li>Otomatik hatırlatma mesajları gönderimi</li>
              <li>İş analitiği ve raporlama araçları</li>
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
              <li>WhatsApp bot üzerinden spam, istenmeyen mesaj veya yanıltıcı içerik göndermemek</li>
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
              <li>Abonelik, kullanıcı tarafından herhangi bir zamanda iptal edilebilir</li>
              <li>İptal durumunda, mevcut dönemin sonuna kadar hizmetten yararlanılabilir</li>
              <li>Ücretsiz deneme süresi sona erdiğinde, abonelik başlatılmadığı takdirde hesap kısıtlanır</li>
            </ul>
          </Section>

          {/* 8 */}
          <Section title="8. Hizmet Düzeyi ve Erişilebilirlik">
            <p>
              BerberBot, platformun %99,5 çalışma süresi (uptime) ile erişilebilir olmasını hedefler.
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
              inceleyiniz. Kullanıcılar, kendi müşterilerinin verilerinin KVKK uyumlu şekilde
              işlenmesinden bireysel olarak da sorumludur.
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
            <p>
              Bu Kullanım Koşulları hakkında sorularınız için aşağıdaki kanallardan
              bizimle iletişime geçebilirsiniz:
            </p>
            <div className="mt-3 rounded-xl border p-5" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
              <div className="flex flex-col gap-2 text-sm">
                <div><strong className="text-white">Platform:</strong> BerberBot SaaS</div>
                <div><strong className="text-white">E-posta:</strong> destek@berberbot.com</div>
                <div><strong className="text-white">Genel Destek:</strong> yardim@berberbot.com</div>
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
            <Link href="/gizlilik" className="hover:text-white transition-colors">Gizlilik Politikası</Link>
            <span className="text-white">Kullanım Koşulları</span>
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

# BerberBot - SaaS Hazırlık Raporu

Proje şu anki haliyle **SaaS (Software as a Service) olarak hizmete sunulmaya tam anlamıyla hazır değildir.** Temel bir "multi-tenant" (çoklu kiracı) mimarisi kurulmuş (Supabase RLS ve `shops` tablosu ile), ancak ticari bir SaaS ürününün sahip olması gereken kritik parçalar eksiktir.

Projeyi canlıya alıp müşteri kabul etmeye başlamadan önce tamamlanması gereken eksiklikler aşağıda detaylandırılmıştır.

---

## 1. Ödeme ve Abonelik Sistemi (En Kritik Eksik)

Kod tabanında Stripe, Iyzico, LemonSqueezy veya PayTR gibi herhangi bir ödeme altyapısı entegrasyonu bulunmamaktadır.

*   **Abonelik Planları:** Kullanıcılara sunulacak paketler (Örn: Başlangıç Planı, Pro Plan, Sınırsız Plan) tanımlı değil.
*   **Fatura Yönetimi:** Müşterilerin kredi kartı bilgilerini girebileceği, aboneliklerini başlatıp iptal edebilecekleri bir "Faturalandırma (Billing)" sayfası veya portalı yok.
*   **Yetki Kontrolü:** Müşterinin aboneliği bittiğinde veya ödeme alınamadığında sistem kullanımını kısıtlayacak (örn: botu durduracak, yeni randevu alımını kapatacak) iş mantığı kurulmamış.

## 2. WhatsApp Bot Mimarisi (Ölçeklenebilirlik ve Çoklu Kiracı Sorunu)

`whatsapp-service` klasöründeki yapı şu an tekil bir bot gibi görünmektedir (`.wwebjs_auth` klasörü tek bir oturumu tutar).

*   **Kendi Numarasını Bağlama:** Bir SaaS modelinde her berber kendi dükkanının WhatsApp numarasını bağlamak isteyecektir. Bunun için sistemin her bir dükkan (`shop_id`) için ayrı bir WhatsApp istemcisi (client) başlatabilmesi ve yönetebilmesi gerekir.
*   **QR Kod Entegrasyonu:** Berberlerin sisteme giriş yaptıktan sonra ayarlar sayfasından "WhatsApp'ı Bağla" seçeneğine tıklayıp ekranda çıkan QR kodu kendi telefonlarından okutarak botu aktif etmeleri sağlayan bir arayüz ve backend mantığı eksik.
*   **Sunucu Yükü:** Çok sayıda WhatsApp botunu tek bir Node.js sürecinde çalıştırmak belleği (RAM) hızla tüketir. Bot servisinin ölçeklenebilir bir mimariye (örn: Redis Pub/Sub veya BullMQ gibi kuyruk sistemleri ile) geçirilmesi, her botun bağımsız süreçlerde (veya container'larda) çalışabilmesi gerekebilir.

## 3. Yönetici (Super Admin) Paneli

Berberler için bir `/dashboard` var ancak **sistemin sahibinin (sizin)** tüm sistemi yöneteceğiniz merkezi bir panel bulunmuyor.

*   Sisteme kaç berber kayıt oldu?
*   Hangi dükkan ne kadar randevu alıyor, sistemi aktif kullanıyor mu?
*   Abonelik durumları, elde edilen aylık gelir (MRR) nedir?
*   Aboneliğini ödemeyen veya kuralları ihlal eden bir dükkanı tek tıkla kapatabilme (banlama) yeteneği.
*   Bu işlemler için sadece size özel (Rolü Super Admin olan) ayrı bir dashboard'a ihtiyacınız var.

## 4. Her Dükkana Özel Halka Açık Sayfa (Müşteri Linkleri)

Veritabanında her dükkan için benzersiz bir `slug` oluşturuluyor (örn: `maestro-berber`). Ancak berberlerin kendi müşterilerinin tarayıcıdan girip randevu alabileceği açık bir sayfa yapısı tam olarak kurgulanmamış görünmektedir.

Sadece WhatsApp üzerinden değil, web üzerinden de randevu kabul edebilmek için her dükkana özel bir randevu sayfası (Örn: `berberbot.com/maestro-berber`) SaaS'ın değerini büyük ölçüde artırır.

## 5. İşlemsel E-postalar (Transactional Emails)

Kullanıcıların platformla sağlıklı etkileşimi için güçlü bir e-posta altyapısı (Resend, SendGrid vb.) kurulmalıdır:

*   Kayıt sonrası "Hoş Geldiniz" ve eğitim mailleri.
*   Abonelik başlatıldı, ödeme alındı veya ödeme başarısız oldu mailleri.
*   Şifre sıfırlama, hesap güvenlik uyarıları.
*   (Opsiyonel) Berberin kendi müşterilerine giden randevu hatırlatma mailleri.

## 6. Landing Page (Açılış/Pazarlama Sayfası)

Uygulamanın ana sayfası (`app/page.tsx`) SaaS ürününüzü satacak olan vitrindir.

*   Ürünün değer teklifinin net bir şekilde anlatılması.
*   Fiyatlandırma (Pricing) tablolarının açıkça sunulması.
*   Özelliklerin (WhatsApp oto-yanıt, randevu takibi) ekran görüntüleri veya animasyonlarla desteklenerek tanıtılması.
*   Sıkça sorulan sorular (SSS).
*   İkna edici bir "Hemen Başla" (Call-to-Action) yönlendirmesi gereklidir.

## 7. Hukuki Sayfalar ve Veri Güvenliği Uyumluluğu (KVKK/GDPR)

Projede `/gizlilik` ve `/kullanim-kosullari` klasörleri mevcut ancak bir SaaS için bunların gerçek, bağlayıcı hukuki metinlerle doldurulması şarttır.

Özellikle WhatsApp üzerinden üçüncü kişilerin telefon numaralarını (kişisel veri) işlediğiniz için:
*   Türkiye için KVKK, Avrupa müşterileri hedefleniyorsa GDPR kapsamında açık rıza ve aydınlatma metinlerini kullanıcılara (ve onların müşterilerine) sunmanız kritik ve yasal bir zorunluluktur.

---

> [!TIP]
> **Sonraki Adım Önerisi:** Tüm bu eksikleri aynı anda yapmaya çalışmak yerine önceliklendirme yapın. En büyük öncelik **Ödeme Altyapısı (Stripe/Iyzico vb.)** ve WhatsApp botunun **Çoklu Kiracı (Multi-tenant) QR kod entegrasyonu** olmalıdır.

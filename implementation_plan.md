# BerberBot SaaS Hazırlık Analizi — Güncel Yol Haritası

> 📱 Şirket kurulana kadar abonelik satışını mobil uygulama (App Store / Google Play) üzerinden yapma planı: [mobile_app_plan.md](mobile_app_plan.md). Bu plan uygulanırsa aşağıdaki iyzico ve fatura maddeleri (P0 #3, #4) ertelenir.
>
> Faz 1 (sunucu) tamamlandı; `migrations/2026-11-08c_mobile_billing.sql` çalıştırıldı.
> Faz 2 (mobil iskelet, `mobile/`) tamamlandı. Supabase → Authentication → Email Templates'te "Confirm signup" ve "Reset password" şablonlarına `{{ .Token }}` (doğrulama kodu) eklenmeli; ayrıntı `mobile/README.md`.
> - Web'de iyzico satışı artık varsayılan olarak **kapalı**. Yerelde iyzico'yu denemek için `.env.local` dosyasına `WEB_BILLING_ENABLED=true` ekleyin.

Son güncelleme: 5 Kasım 2026. Kod tarafındaki kritik açıklar kapatıldı; aşağıdakiler **kod dışı** veya henüz yapılmamış işlerdir.

---

## 🔴 KRİTİK (P0) — Lansmandan Önce

### 1. Veritabanı güncellemesini çalıştır
- Supabase SQL Editor'da `migrations/2026-11-05_launch_hardening.sql` dosyasını çalıştır. Bu olmadan: fatura bilgisi kaydedilemez (ödeme alınamaz), adres/Instagram kaydedilmez, abonelik hatırlatma cron'u hata verir ve **paywall açığı / müşteri verisi sızıntısı kapanmaz**.
- Çalıştırdıktan sonra kontrol: tarayıcı konsolundan `supabase.from('shops').update({subscription_status:'active'})` değişiklik yapmamalı; anon key ile `appointments_full` okunamamalı.
- Ardından `migrations/2026-11-08_integrity_and_paywall.sql` dosyasını çalıştır: hesap silinince ödeme kayıtları korunur, aynı ödeme iki kez işlenemez, süresi dolan işletme veritabanına doğrudan yazamaz. (Unique index hata verirse dosyadaki mükerrer ödeme sorgusunu çalıştır.) Sonra `migrations/2026-11-08b_drop_legacy_policies.sql`: canlı DB'de panelden eklenmiş eski politikalar `customers` ve `settings` tablolarında paywall'ı deliyordu.
- `.env.local` / Vercel: webhook imzası için değişken adı `WHATSAPP_APP_SECRET` olmalı (`WHATSAPP_API_SECRET` okunmuyor). Lokal `WHATSAPP_PHONE_ID` Meta tarafından reddediliyor (ID yanlış ya da token'ın o numaraya yetkisi yok).
- Production'da Upstash env değişkenleri zorunlu (yoksa hız sınırı yalnızca sunucu belleğinde). Superadmin için `SUPERADMIN_PASSWORD_HASH` (bcrypt) kullan; tüm değişkenler `.env.local.example` içinde.

### 2. Şirket ve yasal bilgiler
- `lib/site-config.ts` içindeki `[ ... ]` alanlarını (unvan, adres, vergi dairesi/no, telefon) doldur. Bunlar yasal sayfalarda ve footer'da görünür.
- Yasal metinler (Mesafeli Satış, Ön Bilgilendirme, İptal-İade, Aydınlatma, Gizlilik, Kullanım Koşulları) şablon olarak yazıldı: **bir avukata / mali müşavire kontrol ettir.**
- "Fiyatlara vergiler dahildir" ifadesi kullanılıyor: fiyatlandırmanın KDV dahil olduğunu mali müşavirle doğrula.

### 3. iyzico canlı başvurusu
- Canlı üye işyeri başvurusu (gerekli sayfalar artık sitede mevcut). Footer'a iyzico'nun verdiği "iyzico ile Öde" logo bandını ekle.
- Canlı `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL=https://api.iyzipay.com`.
- Kurumsal alıcılarda `identityNumber` olarak VKN gönderiliyor; iyzico ile teyit et.

### 4. Fatura (e-Arşiv / e-Fatura)
- Otomatik e-Arşiv entegrasyonu yok. Şimdilik her ödemeyi `/superadmin/invoices` sayfasından görüp muhasebe programında fatura kesip numarasını işaretle.
- Hacim artınca Paraşüt / Logo İşbaşı / Uyumsoft API entegrasyonu (P1).

### 5. WhatsApp (Meta) canlıya geçiş
- Meta Business doğrulaması, kalıcı token, şablon onayları (`randevu_onay`, `randevu_hatirlatma`, `randevu_iptal`, değişken sırası `lib/appointment-messages.ts`'te).
- `WHATSAPP_APP_SECRET` env değişkenini ekle (webhook imza doğrulaması).
- Webhook URL: `https://<domain>/api/whatsapp/webhook`.

### 6. Cron
- Randevu hatırlatma cron'u `vercel.json`'dan çıkarıldı (Hobby planı 15 dakikalık cron'u reddedip **tüm deploy'u** başarısız yapıyordu). cron-job.org (ücretsiz) veya Upstash QStash'te bir görev aç:
  - Adres: `https://<site>/api/cron/reminders`, yöntem GET veya POST, her 15 dakikada bir.
  - Başlık: `Authorization: Bearer <CRON_SECRET>`. `CRON_SECRET` Vercel env'de de tanımlı olmalı; yoksa uç her isteğe 401 döner.
- `/api/cron/subscriptions` günde bir çalışır (Hobby'de de çalışır).

### 7. E-posta ve key rotasyonu
- Resend'de domaini doğrula, `EMAIL_FROM="BerberBot <destek@berberbot.com>"` ayarla.
- Daha önce paylaşılmış olabilecek Supabase, Redis, Resend key'lerini rotate et.
- `lib/site-config.ts` > `SUPPORT.whatsappNumber` doldurulursa panelde ve iletişim sayfasında WhatsApp destek butonu çıkar.

---

## 🟠 ÖNEMLİ (P1) — Lansmandan Kısa Süre Sonra

- **Otomatik yenileme:** iyzico Abonelik API / kart saklama. Şu an bitişten 3 gün önce e-posta hatırlatması var.
- **Hata izleme:** Sentry + uptime monitoring (ödeme callback'i ve cron'lar sessizce bozulabilir).
- **Pazarlama ölçümü:** GA4 / Meta Pixel; eklendiği anda çerez onay banner'ı zorunlu olur.
- **Migration yönetimi:** Supabase CLI ile versiyonlu migration'lar.
- **Test & CI:** Ödeme ve randevu akışı için e2e testler; staging ortamı.
- **Bağımlılıklar:** `npm audit` 25 açık gösteriyor (çoğu Next 14 kaynaklı). Next 15/16 yükseltmesi ayrı bir iş olarak planlanmalı.

---

## 🟡 SONRA (P2) — Büyüme

- WhatsApp üzerinden sohbetle randevu botu (landing'de artık vaat edilmiyor).
- Kendi WhatsApp numarasını bağlama (Embedded Signup).
- Referans / tavsiye programı, kupon ve sadakat.
- "Tekrar gel" hatırlatmaları, no-show listesi.
- Personel bazlı çalışma saatleri ve molalar.
- Çok şubeli işletmeler (Franchise) paneli.
- Google Business "Rezervasyon" entegrasyonu, blog/SEO içerikleri.

---

## ✅ Tamamlananlar (5 Kasım 2026)
- Paywall açığı: abonelik/durum/slug alanları trigger ile korunuyor; dükkan oluşturma sunucuya taşındı.
- `appointments_full` view'ı anon/authenticated rollere kapatıldı (müşteri verisi sızıntısı).
- `confirmAppointmentAndNotify` ve `initiatePayment` yetkisiz çağrıya kapatıldı; panel işlemleri oturum kontrollü action'lardan geçiyor.
- Saat dilimi: tüm sunucu hesapları Europe/Istanbul (`lib/time.ts`). Dashboard "bugün" ve manuel randevu saatleri düzeltildi.
- Randevu sunucuda doğrulanıyor: çakışma (hizmet süresine göre), çalışma saatleri, izinler, geçmiş saat, hizmet/personel sahipliği.
- Otomatik onay, hatırlatma ve bildirim ayarları gerçekten uygulanıyor; işletme iptalinde müşteriye WhatsApp gidiyor.
- Ödeme: fatura bilgileri formu (TC/VKN doğrulamalı), sözleşme onayı, gerçek alıcı bilgisi, idempotent callback, kalan gün devri, başarı/başarısızlık e-postaları, superadmin faturalar sayfası.
- Abonelik bitiş hatırlatma e-postası (günlük cron).
- Landing page ürünle uyumlu hale getirildi; ölü linkler/butonlar düzeltildi.
- Yasal sayfalar: Mesafeli Satış, Ön Bilgilendirme, İptal-İade, KVKK Aydınlatma (son kullanıcı), Hakkımızda, İletişim; kayıtta sözleşme onayı; randevu formunda aydınlatma onayı.
- Favicon, Apple ikonu, OG görseli, manifest, sitemap/robots, dükkan sayfası metadata'sı.
- Randevu linki düzenleme, QR kod indirme ve yazdırılabilir afiş; dükkan iletişim bilgileri (telefon/adres/Instagram) ve çalışma saatleri randevu sayfasında.
- Hizmet süresi düzenlenebilir; hizmet silme geçmiş randevuları silmiyor (pasife alma).
- WhatsApp webhook imza doğrulaması ve otomatik yanıt hız sınırı.

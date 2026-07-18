# BerberBot SaaS Hazırlık Analizi — Güncel Yol Haritası

Mevcut projede yapılan son güncellemelerle (Super Admin HMAC Auth, Rate Limiting, Şifre Sıfırlama akışları, Middleware Paywall kontrolleri vb.) bazı kritik eksiklikler giderilmiştir. Aşağıda SaaS lansmanından önce **kalan eksikliklerin** güncel öncelik sırasını bulabilirsiniz.

---

## 🔴 KRİTİK (P0) — Bunlar Olmadan Lansman Yapılamaz

### 1. WhatsApp Business API (Cloud API) Canlıya Geçişi
- **Kod Tarafı Hazır:** Proje içerisindeki `lib/whatsapp.ts` ve `/api/whatsapp/webhook/route.ts` altyapısı zaten Meta Cloud API ile merkezi bir numaradan bildirim atmak üzere kodlanmış durumda.
- **Yapılacaklar:** Meta Developer Console üzerinden uygulama oluşturulup, alınacak yeni numara bu sisteme bağlanmalı ve oluşan kalıcı `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` ve `WHATSAPP_VERIFY_TOKEN` değişkenleri `.env.local`'e işlenmeli.
- **Webhook Bağlantısı:** Canlı ortama çıkıldığında (örn: Vercel üzerinde) Meta'ya `https://domain.com/api/whatsapp/webhook` adresi tanımlanarak kullanıcıların bot'a cevap vermesi durumunda verilecek otomatik yanıtlar aktif edilmeli.

### 2. Canlı Ortam Öncesi Key Rotasyonu
- `.env.local` dosyasındaki şifreler hash'e çevrilerek kod bazlı güvenlik sağlandı. Ancak daha önce Git history'ye veya uzak sunucuya düz metin düşmüş olabilecek **Supabase, Redis ve Resend key'leri canlıya çıkmadan önce mutlaka rotate edilmelidir** (yenilenmelidir).

---

## 🟠 ÖNEMLİ (P1) — Lansmandan Kısa Süre İçinde Tamamlanmalı

### 3. Database Migration Yönetimi
- Şema değişiklikleri manuel SQL dosyaları ile yapılıyor. Supabase CLI kullanılarak düzenli bir migration altyapısına (versiyon kontrollü) geçilmeli.

---

## 🟡 ORTA (P2) — İlk Sürüm Sonrası Geliştirilebilir

### 5. Monitoring & Logging Altyapısı
- Sentry, LogRocket gibi bir hata izleme servisinin entegre edilmesi.
- Uptime monitoring (WhatsApp bot'un health-check ile izlenmesi).

### 6. Test & CI/CD Altyapısı
- Hiçbir unit, integration veya e2e test bulunmuyor.
- Vercel vb. ortamlarda CI/CD (Github Actions vs) pipeline kurulması.
- Canlı DB haricinde staging (test) ortamının ayrılması.

### 7. E-posta ve Müşteri Destek Altyapısı
- E-postalar `onboarding@resend.dev` üzerinden gidiyor; doğrulanmış `destek@berberbot.com` gibi kendi domaininize geçilmeli.
- Canlı destek widget'ı veya dökümantasyon/yardım merkezi sayfası eklenmeli.

### 8. Yasal Sayfalar (KVKK & Çerez Onayı)
- KVKK kapsamında aydınlatma metni, veri işleme sözleşmesi (DPA) ve site girişinde çerez onay (cookie consent) banner'ı eklenmeli.

### 9. Performans Optimizasyonu & Lokalizasyon
- Dashboard üzerinde paralel yapılabilecek DB sorgularının optimize edilmesi.
- Image optimization ve font preloading eklenmesi.
- (Gerekirse) UI metinlerinin ileride i18n altyapısına uygun hale getirilmesi.

---

## ✅ Tamamlananlar (Listedekinden Çıkarılanlar)
- **Superadmin Auth:** HMAC bazlı JWT cookie ile güvenlik sağlandı. Hash interpolasyon sorunu çözüldü.
- **Rate Limiting:** Login ve API isteklerine Upstash Redis tabanlı rate limiting eklendi.
- **Hesap Yönetimi:** Şifremi unuttum (`/forgot-password`) ve sıfırlama (`/reset-password`) akışları eklendi.
- **Error Handling & Validasyon:** `zod` kütüphanesi kullanılarak (`lib/validations.ts`) form validasyonları (telefon formatı vb.) sağlandı. `error.tsx` ve `global-error.tsx` ile hata yakalama sınırları eklendi.
- **Multi-Tenancy Hardcoded Değerleri:** `lib/supabase.ts` içerisindeki varsayılan dükkan ID'si ve şema doyasındaki "Maestro Berber" seed verileri kaldırılarak dinamik yapı sağlandı.
- **Ödeme Sistemi ve Abonelik Altyapısı:** iyzico API (`lib/iyzico.ts`) ödeme entegrasyonu, veritabanındaki `subscriptions` mantığı ve UI (Settings > Billing sayfası) tamamen koda dahil edilmiş.
- **Analytics & Raporlama:** Superadmin paneli için detaylı analitik sayfası (aktif dükkanlar, MRR, churn, MAU vb.) `app/superadmin/analytics` dizininde uygulanmış durumda.
- **SEO & Meta Tags:** Uygulama genelinde Open Graph etiketleri eklendi. Dinamik `sitemap.ts` ve `robots.ts` dosyaları oluşturuldu.

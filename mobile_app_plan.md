# BerberBot Mobil Uygulama Dönüşüm Planı

Son güncelleme: 8 Kasım 2026. Hedef: işletme panelini iOS ve Android uygulamasına taşımak ve aboneliği **App Store / Google Play uygulama içi satın alma** ile satmak. Böylece şirket kurmadan, bireysel geliştirici hesabıyla ve GVK mükerrer 20/B istisnası kapsamında gelir elde edilebilir.

> ⚠️ Vergi ve hukuk notları bilgi amaçlıdır. 20/B kapsamı, KDV ve yasal metinler başlamadan önce mali müşavir ve avukata teyit ettirilmelidir. "(doğrula)" işaretli maddeler bu planı yazarken kesinleştirilemeyen bilgilerdir.

---

## 1. Kapsam ve temel kararlar

| Konu | Karar | Gerekçe |
|---|---|---|
| Müşterinin randevu sayfası (`app/[slug]`, `app/r/[token]`) | **Web'de kalır, değişmez** | Müşteriler linkle (WhatsApp, Instagram, QR) gelir; uygulama indirmez |
| İşletme paneli | **Expo (React Native) uygulaması** | Berberler gün boyu telefonda; anlık bildirim büyük artı |
| Web paneli | **Kalır**, abone olan işletme kullanmaya devam eder | Bilgisayardan kullanan da olur; `computeIsLocked` iki tarafta aynı çalışır |
| Sunucu (Supabase, Vercel API, cron, WhatsApp) | **Aynen kalır**, mobil için API eklenir | Tek veritabanı, tek iş mantığı |
| Ödeme | **RevenueCat + App Store / Google Play** | Makbuz doğrulama, yenileme, platformlar arası abonelik hazır gelir |
| iyzico | **Kod kalır, bayrakla kapatılır** (`WEB_BILLING_ENABLED=false`) | Şirket kurulunca tekrar açılabilir |
| Deneme süresi | **Mevcut sunucu taraflı 7 gün** korunur, mağazada ayrıca ücretsiz deneme tanımlanmaz | Kart istemeden deneme; çift deneme karmaşası olmaz |
| Satılan plan | Sadece **Pro**: aylık + yıllık | `lib/plan-limits.ts` ile aynı |
| Süperadmin | Web'de kalır | Sadece senin kullandığın bir panel |

### Önce verilmesi gereken karar: uygulama adı
Bundle ID (`com.<ad>.app`) ve mağaza kaydı **sonradan değiştirilemez** ya da değiştirmek çok zahmetlidir. Daha önce konuşulan isim değişikliği (ör. "Sıradaki") yapılacaksa, Apple/Google hesapları açılmadan önce karar verilmeli.

---

## 2. Mimari

```
┌──────────────── Mobil (Expo) ────────────────┐      ┌──────── Web (Next.js, Vercel) ────────┐
│ supabase-js (kullanıcı JWT, RLS)             │      │ /[slug] randevu sayfası (değişmez)     │
│  ├─ okuma: shops, appointments, customers... │      │ web paneli (değişmez)                  │
│  ├─ basit CRUD: services, staff, settings,   │      │ /api/mobile/v1/*  ← YENİ               │
│  │   staff_leaves, notifications             │─────▶│ /api/revenuecat/webhook ← YENİ         │
│  └─ realtime: appointments, notifications    │      │ /api/cron/* (değişmez)                 │
│ fetch → /api/mobile/v1/* (Bearer JWT)        │      │ /api/whatsapp/webhook (değişmez)       │
│ react-native-purchases (RevenueCat SDK)      │      └────────────────┬───────────────────────┘
│ expo-notifications (push token)              │                       │ admin client
└──────────────────────────────────────────────┘                       ▼
                                                        Supabase Postgres (RLS + paywall)
RevenueCat ──webhook──▶ /api/revenuecat/webhook ──▶ shops.subscription_status / current_period_end
```

**Neden bu ayrım?** Mevcut web paneli zaten basit CRUD işlemlerini tarayıcıdaki Supabase client'ı ile RLS altında yapıyor. 2026-11-08 migration'larıyla paywall da RLS'te uygulanıyor. Mobil aynı şekilde çalışabilir. Sadece **service role gerektiren** veya **yan etkisi olan** (WhatsApp, e-posta, slug, dükkan oluşturma, hesap silme) işlemler API üzerinden gider.

### 2.1 Repo yapısı
Aynı repo, yeni klasörler:

```
/                      ← mevcut Next.js (yerinde kalır)
/shared                ← YENİ: web + mobil ortak, saf TypeScript
    time.ts            (lib/time.ts taşınır; date-fns-tz)
    plan.ts            (PLANS, TRIAL_DAYS, computeIsLocked, getAccessEndDate — Supabase bağımlılığı olmadan)
    validations.ts     (zod şemaları, normalizeTrPhone, phoneLookupVariants)
    slug.ts            (slugify, RESERVED_SLUGS, kurallar)
    api-types.ts       (mobil API istek/yanıt tipleri)
/mobile                ← YENİ: Expo uygulaması (kendi package.json'ı)
```

- Web: `lib/time.ts` vb. `shared/` dosyalarını yeniden export eder (`export * from "@/shared/time"`). Böylece mevcut import'lar bozulmaz.
- Mobil: Metro `watchFolders: [path.resolve(__dirname, "../shared")]` ve `tsconfig` path alias `@shared/*`.
- `lib/plan-limits.ts` içindeki `getShopUsageAndLimits` (Supabase sorgusu yapan kısım) web'de kalır; saf kısım `shared/plan.ts`'e geçer.

---

## 3. Sunucu tarafı değişiklikler (Faz 1)

### 3.1 Ortak servis katmanı
Server Action'lardaki iş mantığı `lib/services/*.ts` fonksiyonlarına taşınır; hem Server Action hem mobil API aynı fonksiyonu çağırır.

`lib/owner.ts` genişletilir:
```ts
// Cookie (web) veya Bearer token (mobil) ile aynı OwnerContext'i üretir
export async function requireOwner(opts?: { requireActive?: boolean; client?: SupabaseClient })
export async function requireOwnerFromRequest(req: Request, opts?: { requireActive?: boolean })
//   Authorization: Bearer <access_token> → createClient(url, anon, { global: { headers: { Authorization } } })
//   → auth.getUser(token) → shops satırı → banned / kilit kontrolü
```

### 3.2 Mobil API uç noktaları (`/api/mobile/v1/...`)
Middleware matcher `/api`'yi hariç tuttuğu için her route kendi yetkisini `requireOwnerFromRequest` ile doğrular. Kullanıcı başına `apiLimiter` uygulanır.

| Mevcut Server Action | Mobil uç nokta | requireActive |
|---|---|---|
| `onboarding/actions#createShopAction` | `POST /shop` | – |
| `settings/actions#updateShopSlug` | `PATCH /shop/slug` | ✓ |
| `appointments/actions#confirmAppointmentAndNotify` | `POST /appointments/:id/confirm` | ✓ |
| `appointments/actions#cancelAppointmentByOwner` | `POST /appointments/:id/cancel` | – |
| `appointments/actions#createAppointmentByOwner` | `POST /appointments` | ✓ |
| `customers/actions#anonymizeCustomer` | `POST /customers/:id/anonymize` | – |
| `staff/actions#getShopLimitsAction` | `GET /shop/limits` | – |
| `profile/actions#deleteAccountAction` | `DELETE /account` | – |
| (yeni) push token kaydı | `POST /push-tokens`, `DELETE /push-tokens` (token gövdede: `[...]` içerdiği için yolda değil) | – |
| (yeni) dükkan ve kilit durumu | `GET /shop` (dükkan yoksa 404 `no_shop`) | – |

> **Faz 1 durumu (8 Kasım 2026): tamamlandı.** `shared/`, `lib/services/*`, `/api/mobile/v1/*`, `lib/notify.ts`, `WEB_BILLING_ENABLED` ve `migrations/2026-11-08c_mobile_billing.sql` yazıldı. Migration Supabase'de çalıştırıldı. Uç noktalar yerelde 54 senaryoyla test edildi (yetki, kilit, ban, başka dükkanın kaydı, doğrulama, push token kaydı/silme, Expo'nun geçersiz cihaz yanıtıyla token temizliği, istemcinin abonelik alanlarını ve push_tokens tablosunu değiştirememesi). RevenueCat webhook'u Faz 4'te yazılacak.

Mobilde **doğrudan supabase-js ile** (RLS altında) yapılacaklar: randevu listesi ve personel atama (`appointments.update staff_id`), müşteri listesi, hizmet/personel/izin/ayar CRUD, bildirim okuma/silme, dükkan adı güncelleme. Bunlar web'de de aynı şekilde yapılıyor.

Web'e özgü kalanlar: `billingProfileActions`, `refundActions` (iyzico), süperadmin action'ları.

### 3.3 RevenueCat webhook (`/api/revenuecat/webhook`)
- **Yetki:** RevenueCat panelinde tanımlanan `Authorization` başlığı, `REVENUECAT_WEBHOOK_AUTH` env ile sabit sürede karşılaştırılır.
- **Idempotency:** `store_webhook_events.event_id` birincil anahtar; tekrar gelen olay atlanır.
- **Gerçek durum:** Olay sırasına güvenmek yerine her olayda `GET https://api.revenuecat.com/v1/subscribers/{app_user_id}` (gizli API key) ile güncel `pro` entitlement'ı okunur ve dükkana yazılır:

| Entitlement durumu | `shops` güncellemesi |
|---|---|
| Aktif (`expires_date` gelecekte) | `subscription_status='active'`, `current_period_end=expires_date`, `plan_id='pro'`, `billing_provider='app_store' \| 'play_store'`, `store_will_renew` |
| Süresi dolmuş | `subscription_status='canceled'`, `current_period_end` korunur → `computeIsLocked` kilitler |
| İade (`CANCELLATION`, `cancel_reason=CUSTOMER_SUPPORT`) | Entitlement zaten düşer; `payments` satırı `refunded` yapılır |

- **app_user_id = shop.id.** Mobil uygulama giriş sonrası `Purchases.logIn(shop.id)` çağırır. Abonelik dükkana bağlı olur; iOS'ta alan Android'de veya web'de girişte aboneliğini görür.
- **Ödeme kaydı:** `INITIAL_PURCHASE` ve `RENEWAL` olaylarında `payments` satırı eklenir: `payment_id = transaction_id` (mevcut unique index tekrar kaydı engeller), `provider`, `environment`, `product_id`, `amount = price_in_purchased_currency`, `currency`. 20/B gelir takibi ve süperadmin raporları için gerekir.
- **SANDBOX olayları reddedilmez.** Apple'ın inceleme ekibi canlı uygulamada sandbox ile satın alır; sunucu sandbox'ı yok sayarsa uygulama reddedilir. Sandbox ödemeleri `environment='sandbox'` olarak işaretlenir, gelir raporlarından hariç tutulur.

### 3.4 Push bildirimleri
- `lib/notify.ts#notifyShop(admin, shopId, { type, message, push })`: `notifications` satırını ekler ve dükkanın push token'larına Expo Push API (`https://exp.host/--/api/v2/push/send`) ile gönderir. `DeviceNotRegistered` dönen token silinir.
- Değişecek yerler: `app/[slug]/actions.ts` (yeni randevu) ve `app/api/appointments/cancel/route.ts` (müşteri iptali). Mevcut `notify_new` / `notify_cancel` ayarları aynen geçerli.
- (Faz 2) Hatırlatma cron'u öncesi "bugünkü randevular" özeti, push makbuz kontrolü.

### 3.5 Şema değişiklikleri (`migrations/YYYY-MM-DD_mobile_billing.sql`, idempotent)
```sql
ALTER TABLE shops ADD COLUMN IF NOT EXISTS billing_provider TEXT;      -- 'iyzico' | 'app_store' | 'play_store'
ALTER TABLE shops ADD COLUMN IF NOT EXISTS store_will_renew BOOLEAN;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'iyzico';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS product_id TEXT;

CREATE TABLE IF NOT EXISTS store_webhook_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  app_user_id TEXT,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);
ALTER TABLE store_webhook_events ENABLE ROW LEVEL SECURITY;   -- politika yok: yalnızca service role

CREATE TABLE IF NOT EXISTS push_tokens (
  token TEXT PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,                -- 'ios' | 'android'
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;            -- yazma API üzerinden; politika yok
```
- `protect_shop_billing_fields` tetikleyicisine `billing_provider` ve `store_will_renew` eklenir (istemci değiştiremesin).
- Aynı içerik `supabase-schema.sql`'e eklenir (proje kuralı).

### 3.6 Web'de yapılacak değişiklikler
- `WEB_BILLING_ENABLED` bayrağı (sunucu env, varsayılan `false`):
  - `/api/payment/checkout` → 403.
  - `/settings/billing` → "Aboneliğinizi BerberBot uygulamasından başlatın" + App Store / Google Play rozetleri. Abonelik durumu ve bitiş tarihi gösterilmeye devam eder. Mağaza aboneliği olanlara "Aboneliği yönet" açıklaması.
  - İade talep butonu yalnızca `provider='iyzico'` ödemeler için görünür.
- Süperadmin: faturalar sayfası `provider='iyzico'` filtreler; dükkan listesinde `billing_provider` ve mağaza durumu gösterilir.
- Landing (`app/page.tsx`): fiyat bölümü "uygulamadan abone olun" + mağaza rozetleri; "uygulamayı indir" bölümü.
- `lib/slug.ts`: yeni üst seviye rota eklenirse (ör. `/indir`) `RESERVED_SLUGS`'a ekle.
- Yasal metinler: bkz. bölüm 7.

---

## 4. Mobil uygulama (Faz 2–3)

> **Faz 2 durumu (8 Kasım 2026): tamamlandı.**
> - Yapılanlar: `mobile/` Expo SDK 58 iskeleti, tema, Supabase oturumu, mobil API istemcisi, `Stack.Protected` ile yönlendirme. Ekranlar: giriş, kayıt, OTP doğrulama, şifre sıfırlama (kodla), onboarding, askı, paywall yer tutucusu ve sekmeler. "Bugün" ekranı gerçek veriyle çalışıyor; diğer sekmeler iskelet.
> - Android emülatöründe (Pixel 8, Android 16, Expo Go) de test edildi: giriş, onboarding, Bugün ekranı, paylaşım, kilit ve askı (uygulama ön plana dönünce de), çıkış. Hermes'te saat dilimi hesabı doğru; polyfill gerekmiyor.
> - Expo web'de uçtan uca test edildi. Kapsam: kodla doğrulama, dükkan kurma (API), kilit/yenileme, askı, şifre sıfırlama, giriş hataları, çıkış. Tip kontrolü, lint ve expo-doctor temiz.
> - Plandan sapmalar:
>   - NativeWind yerine `StyleSheet` ve `src/theme.ts` kullanıldı: daha az yapılandırma ve sürüm riski.
>   - Giriş ekranları `(auth)` grubunda değil, en üst seviyede. İndekssiz grup, koruma yönlendirmesini bozuyordu.
> - Bekleyenler:
>   - Supabase e-posta şablonlarına `{{ .Token }}` eklenmesi.
>   - Uygulama adı/bundle ID kararı.

> **Faz 3 durumu (9 Kasım 2026): tamamlandı.**
> - Ekranlar:
>   - Randevular: gün seçici, takvim, durum filtresi, onay/iptal, personel atama, yeni randevu.
>   - Müşteriler: arama, istatistik, arama/WhatsApp, KVKK silme, CSV paylaşımı.
>   - Personel: aktif/pasif, ekle/düzenle/sil, izinler.
>   - Hizmetler: ekle/düzenle/pasife al.
>   - Dükkan ayarları: iletişim, çalışma saatleri, otomatik onay, bildirim tercihleri.
>   - Randevu linki ve QR: QR paylaşma, link değiştirme.
>   - Bildirimler ve profil: şifre/e-posta değiştirme, yasal metinler, hesap silme. Profil abonelik bitince de açılır.
> - Ortak parçalar: React Query veri kancaları (`src/lib/queries.ts`), canlı güncelleme köprüsü (`src/lib/realtime.tsx`), seçim ve takvim pencereleri (ek paket yok), kısa bildirim (toast).
> - Android emülatöründe tüm ekranlar uçtan uca test edildi; yazılanlar veritabanından doğrulandı.
> - Bekleyen: `migrations/2026-11-09_realtime_appointments.sql` çalıştırılmalı. Çalışmadan randevu değişiklikleri canlı gelmez; ekranlar aşağı çekince ve uygulamaya dönünce yenilenir.
> - Analitik ekranı ilk sürümde yok (plan gereği web'de kalıyor).

### 4.1 Teknoloji
| Alan | Seçim |
|---|---|
| Çatı | Expo (güncel SDK), Expo Router, TypeScript strict |
| Veri | `@supabase/supabase-js` + `@react-native-async-storage/async-storage` (oturum), `react-native-url-polyfill`, TanStack Query |
| Form | `react-hook-form` + `zod` (`shared/validations.ts`) |
| Stil | NativeWind (Tailwind sınıfları); `globals.css`'teki `--bg`, `--accent` (#c8f060) vb. tema renkleri `tailwind.config` token'larına taşınır |
| Ödeme | `react-native-purchases` (RevenueCat); hazır paywall için isteğe bağlı `react-native-purchases-ui` |
| Bildirim | `expo-notifications`, `expo-device` |
| Diğer | `react-native-qrcode-svg` + `expo-sharing` (randevu linki/QR), `expo-linking`, `expo-haptics` |
| Derleme | EAS Build, EAS Submit, EAS Update (OTA düzeltmeler) |

> RevenueCat SDK'sı native modül içerir: **Expo Go'da çalışmaz**, development build (`eas build --profile development`) gerekir.

### 4.2 Ekranlar ve web karşılıkları

```
mobile/app/
  _layout.tsx            Providers: QueryClient, AuthProvider, Purchases.configure, bildirim dinleyici
  (auth)/login.tsx       ← app/login
  (auth)/signup.tsx      ← app/signup (sözleşme onayı dahil)
  (auth)/verify.tsx      E-posta doğrulama kodu (OTP)
  (auth)/forgot.tsx      ← app/forgot-password (+ kodla yeni şifre)
  onboarding.tsx         ← app/onboarding (POST /shop)
  banned.tsx             ← app/banned
  paywall.tsx            ← app/settings/billing (mağaza satın alma, geri yükleme, yönetme)
  (tabs)/_layout.tsx     Alt sekmeler: Bugün · Randevular · Müşteriler · Daha fazla
  (tabs)/index.tsx       ← app/dashboard (bugünkü randevular, günlük/aylık özet)
  (tabs)/appointments.tsx← app/appointments (gün seçici, onayla/iptal, personel ata, realtime)
  appointments/new.tsx   ← components/AddAppointmentModal (POST /appointments)
  (tabs)/customers.tsx   ← app/customers (arama, "Verileri sil"; CSV → paylaşım menüsü, Faz 2)
  (tabs)/more.tsx        Menü
  staff/index.tsx        ← app/staff (+ plan limiti)
  staff/[id].tsx         ← StaffModal + StaffLeaveModal (izinler)
  services.tsx           ← app/settings (hizmetler bölümü)
  shop-settings.tsx      ← app/settings (çalışma saatleri, otomatik onay, bildirim tercihleri, adres, Instagram)
  booking-link.tsx       ← components/BookingLinkCard + app/settings/qr (link düzenle, QR paylaş)
  notifications.tsx      ← app/notifications
  profile.tsx            ← app/profile (e-posta, şifre, hesabı sil, yasal linkler, destek)
```
Analitik (`app/analytics`) ilk sürümde mobilde yok; dashboard'daki özet yeterli. Web'de kalmaya devam eder.

### 4.3 Yönlendirme kuralları (middleware'in mobil karşılığı)
Uygulama açılışında ve oturum değiştiğinde:
1. Oturum yok → `(auth)/login`
2. Dükkan yok → `onboarding`
3. `status='banned'` → `banned`
4. `computeIsLocked(shop)` (`shared/plan.ts`) → `paywall`. Kilitliyken yalnızca paywall, profil ve çıkış açık. Sunucu ve RLS zaten yazmayı engelliyor; bu kontrol kullanıcı deneyimi için.
5. Aksi halde `(tabs)`

Satın alma sonrası `Purchases` `customerInfo` güncellemesi beklenir, ardından dükkan satırı yeniden çekilir (webhook birkaç saniye gecikebilir; 10 sn boyunca birkaç kez tekrar dene, gerekirse "Aboneliğiniz işleniyor" mesajı).

### 4.4 Kimlik doğrulama
- E-posta + şifre (web ile aynı Supabase Auth). Apple, sadece üçüncü taraf giriş (Google vb.) sunulursa "Apple ile Giriş" ister; şu an gerekmiyor.
- **E-posta doğrulama ve şifre sıfırlama kodla:** Supabase e-posta şablonlarına `{{ .Token }}` (6 haneli kod) eklenir; link de kalır, web bozulmaz. Mobil `verifyOtp({ type: 'signup' | 'recovery' })` kullanır. Deep link (`berberbot://`) karmaşası olmaz.
- Oturum AsyncStorage'da; `autoRefreshToken: true`, uygulama ön plana geldiğinde `startAutoRefresh`.
- API çağrılarında `Authorization: Bearer <session.access_token>`.

### 4.5 Saat dilimi
Tüm hesaplar `shared/time.ts` ile Europe/Istanbul'a göre yapılır (cihaz saat diliminden bağımsız). **Erken doğrula:** Hermes motorunda `Intl.DateTimeFormat` saat dilimi desteği Android'de beklendiği gibi çalışıyor mu? Çalışmazsa `@formatjs/intl-datetimeformat` polyfill'i eklenir.

---

## 5. Abonelik kurgusu (Faz 4)

### 5.1 Mağaza ürünleri
| | App Store | Google Play |
|---|---|---|
| Yapı | 1 abonelik grubu: `pro_monthly`, `pro_yearly` | 1 abonelik `pro`, 2 base plan: `monthly`, `yearly` |
| Fiyat | 349 ₺/ay ve 3.490 ₺/yıl'a en yakın fiyat noktaları | Aynı |
| Ücretsiz deneme | Yok (sunucu taraflı 7 gün var) | Yok |
| Ödeme sorunu | Billing Grace Period açık | Grace period + account hold açık |

RevenueCat: entitlement `pro`; offering `default` → paketler `$rc_monthly`, `$rc_annual`.

### 5.2 Gelir hesabı (aylık plan, kabaca)
| Kalem | Tutar |
|---|---|
| Liste fiyatı | 349 ₺ |
| Mağaza komisyonu (küçük işletme programı %15) | −52 ₺ |
| Kalan | ≈ 297 ₺ |
| 20/B banka stopajı %15 | −45 ₺ |
| Net | ≈ 252 ₺ |

Mağazanın KDV'yi fiyatın içinden düşüp düşmediği ve nasıl beyan edildiği netleşmeli **(doğrula, mali müşavir)**. Gerekirse liste fiyatı yükseltilir.

### 5.3 Paywall ekranı (Apple 3.1.2 zorunlulukları)
- Plan adı, süre, fiyat, yıllıkta aylık karşılığı ve "otomatik yenilenir, mağaza ayarlarından iptal edilebilir" metni.
- **Satın Alımları Geri Yükle** butonu.
- Kullanım Koşulları (EULA) ve Gizlilik Politikası linkleri; aynı linkler App Store Connect metadata'sında da olmalı.
- Aboneliği yönet: `customerInfo.managementURL`.
- iOS uygulamasında **web'den satın almaya yönlendiren link veya metin olmayacak** (Türkiye'de Apple kuralı 3.1.1).

### 5.4 Uç durumlar
| Durum | Davranış |
|---|---|
| iOS'ta abone, Android'e giriş | `logIn(shop.id)` → entitlement aktif; satın alma butonu yerine "aktif" gösterilir |
| Abone, web paneline giriş | `shops` alanları güncel → paywall yok |
| Deneme sürerken satın alma | Mağaza dönemi hemen başlar; `current_period_end = expires_date`. Kalan deneme günleri eklenmez; paywall'da "deneme süreniz sona erer" diye belirt |
| Yenileme başarısız | Grace period boyunca entitlement aktif → erişim devam; bitince `canceled` → kilit |
| İade (Apple/Google kendi süreciyle) | Webhook → entitlement düşer → kilit; `payments` `refunded` |
| Eski iyzico ödemesiyle aktif dönem | Dönem bitene kadar geçerli; sonra uygulamadan abone olur |
| Hesap silme | Mağaza aboneliği **otomatik iptal olmaz**. Silme öncesi uyarı: "Aboneliğinizi mağaza ayarlarından iptal edin" + yönet linki. `payments` satırları korunur (mevcut davranış) |
| Dükkan banlandı | Abonelik mağazada sürer; destek üzerinden iade süreci |

---

## 6. Hesaplar, vergi ve mağaza hazırlığı (Faz 0, paralel)

| İş | Not |
|---|---|
| Apple Developer Program (bireysel) | Yıllık 99 USD; kimlik doğrulama birkaç gün sürebilir |
| Google Play Console (bireysel) | Tek seferlik 25 USD; kimlik doğrulama. **Yeni bireysel hesaplarda üretime çıkmadan önce en az 12 test kullanıcısı 14 gün kesintisiz kapalı testte olmalı** |
| Apple ve Google'da vergi/banka bilgisi | Ödemeler **20/B için açılan banka hesabına** yatmalı |
| 20/B | Bankada 20/B hesabı açılır, vergi dairesinden istisna belgesi alınır. 2026 sınırı ≈ 5,3 milyon ₺ (doğrula) |
| Apple Small Business Program ve Google %15 | İkisine de başvur (Google'da abonelikler zaten %15) |
| RevenueCat hesabı | Belirli bir aylık gelire kadar ücretsiz (doğrula) |
| Expo / EAS hesabı | Ücretsiz katmanda build sayısı sınırlı (doğrula) |
| Mağaza görselleri | İkon, ekran görüntüleri (6,7" iPhone, Android telefon), kısa/uzun açıklama (Türkçe) |
| App Review demo hesabı | Seed verili, denemesi aktif bir test dükkanı; inceleme notuna giriş bilgisi |

**Kritik zamanlama:** Google'ın 14 günlük sayacı ancak kapalı test yayınlandığında başlar. Ödeme hazır olmasa bile giriş ve randevu ekranları çalışan ilk sürüm Faz 3'ün başında kapalı teste çıkarılmalı. İlk berber müşterileri ve tanıdıklar test kullanıcısı yapılır.

---

## 7. Yasal ve KVKK

- **Kullanım Koşulları:** mağaza aboneliği, otomatik yenileme, iptal ve iade (Apple/Google süreçleri) bölümü eklenir. Apple'ın standart EULA'sı da kullanılabilir.
- **Mesafeli Satış / Ön Bilgilendirme / İptal-İade:** web satışı kapalıyken "abonelikler App Store / Google Play üzerinden satılır; tahsilat ve iade bu platformların koşullarına tabidir" şeklinde güncellenir. Footer'daki iyzico bandı kaldırılır.
- **Aydınlatma metni / Gizlilik:** yeni işlenen veriler (push token, cihaz platformu, satın alma kayıtları) ve yeni veri işleyenler (RevenueCat, Expo push servisi, Apple, Google). **Yurt dışına aktarım:** KVKK'nın yurt dışı aktarım kuralları (standart sözleşme veya açık rıza) için avukat görüşü alınmalı.
- **`lib/site-config.ts`:** şirket unvanı ve vergi no alanları yerine "işletmeci: <ad soyad>" ve iletişim bilgileri. Hangi bilgilerin zorunlu olduğu avukata sorulmalı.
- Yukarıdakilerin hepsi avukat kontrolünden geçmeli.

---

## 8. Test stratejisi

Projede şu an otomatik test yok. Bu dönüşümle birlikte asgari bir güvenlik ağı eklenmeli:

1. **Birim testleri (Vitest, kökte):** `shared/time.ts` (ay ekleme, gün aralığı), `shared/plan.ts` (`computeIsLocked` tüm durumlar), `shared/validations.ts` (telefon biçimleri). `npm test` script'i.
2. **Webhook testleri:** RevenueCat örnek olay JSON'ları (fixture) ve saf fonksiyon `deriveShopBilling(subscriberInfo)` → beklenen `shops` alanları. Tekrar gelen olay ve sandbox olayı dahil.
3. **Entegrasyon (RLS):** 8 Kasım'da yapılan geçici self-test senaryoları kalıcı bir script'e dönüştürülür (`scripts/rls-check.ts`): test kullanıcısı oluştur → aktif/kilitli yazma → başka dükkana yazma → temizle. Her migration'dan sonra çalıştırılır.
4. **Mobil API:** her uç nokta için yetkisiz (401), kilitli (403) ve başkasının kaydı (404) senaryoları.
5. **Satın alma (manuel matris):**
   - iOS sandbox: satın al, yenileme (sandbox'ta aylık abonelik birkaç dakikada yenilenir), iptal → süre sonunda kilit, geri yükleme, iade testi.
   - Android lisans test kullanıcıları: aynı akışlar + grace period.
   - Platformlar arası: iOS'ta al → Android ve web'de giriş.
6. **Cihaz testleri:** küçük ekranlı Android, iPhone; zayıf internet; uygulama arka plandayken push.
7. (Faz 2) Maestro ile giriş → randevu onayla akışı için uçtan uca test.

---

## 9. Fazlar ve zaman çizelgesi

Tek geliştirici, tam zamanlı tahmin (yarı zamanlıda yaklaşık iki katı):

| Faz | İçerik | Süre | Bitti sayılır |
|---|---|---|---|
| **0. Hazırlık** | İsim kararı, Apple/Google/RevenueCat/EAS hesapları, 20/B (mali müşavir), banka hesabı | 1 hafta (paralel) | Hesaplar onaylı, bundle ID belli |
| **1. Sunucu** | `shared/` çıkarma, servis katmanı, `/api/mobile/v1/*`, şema migration'ı, `notifyShop`, `WEB_BILLING_ENABLED` | 1 hafta | Web eskisi gibi çalışıyor; API uçları curl ile test edildi; tip kontrolü ve build temiz |
| **2. Mobil iskelet** | Expo kurulumu, tema, auth (OTP), onboarding, yönlendirme kuralları, development build | 1 hafta | Cihazda kayıt ol → dükkan kur → boş dashboard |
| **3. Çekirdek ekranlar** | Dashboard, randevular (+realtime, manuel ekleme), müşteriler, personel + izinler, hizmetler, ayarlar, randevu linki/QR, bildirimler, profil | 2 hafta | Web panelindeki her günlük iş mobilde yapılabiliyor. **Başında Google kapalı testi başlar** |
| **4. Abonelik** | Mağaza ürünleri, RevenueCat, paywall, webhook, web billing sayfası güncellemesi | 1 hafta | Bölüm 8.5 matrisi sandbox'ta geçti |
| **5. Push** | Token kaydı, `notifyShop`, bildirime dokununca ilgili randevuyu açma | 2–3 gün | Web'den alınan randevu telefonda bildirim olarak düşüyor |
| **6. Yayın** | Yasal metinler, mağaza sayfaları, TestFlight, App Review, Play üretim başvurusu | 1–2 hafta (inceleme süreleri dahil) | İki mağazada yayında |

**Toplam:** yaklaşık 6–8 hafta.

---

## 10. Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Apple reddi: minimum işlevsellik (4.2) | Gecikme | Native ekranlar, WebView yok; push ve QR gibi mobil özellikler |
| Apple reddi: demo hesap / satın alma çalışmıyor (2.1) | Gecikme | Demo dükkan; sandbox olaylarını sunucuda kabul et |
| Apple reddi: harici ödeme yönlendirmesi (3.1.1) | Ret | iOS'ta web satın alma linki ve metni yok |
| Google 14 günlük kapalı test / üretim başvurusu reddi | 2–3 hafta gecikme | Testi erken başlat; test kullanıcılarını aktif tut |
| 20/B kapsamının B2B abonelik için yorumlanması | Vergi riski | Başlamadan mali müşavir görüşü |
| Webhook gecikmesi veya kaybı | Ödeyen kullanıcı kilitli kalır | Satın alma sonrası istemci tarafı yeniden deneme; günlük cron'a RevenueCat ile mutabakat eklenmesi (Faz 2) |
| Hermes `Intl` saat dilimi | Yanlış saatler | Faz 2'de ilk iş doğrula; polyfill |
| Komisyon ve stopaj sonrası düşük net gelir | Kârlılık | Fiyat noktalarını buna göre seç; yıllık planı öne çıkar |
| İki panelin (web + mobil) bakım yükü | Yavaşlama | Ortak `shared/` ve servis katmanı; yeni özellikler önce mobilde |

---

## 11. Başlamadan önce netleşmesi gerekenler

1. **Uygulama adı** ve bundle ID (bölüm 1).
2. **Mali müşavir:** 20/B bu iş için uygun mu, mağaza KDV'si nasıl işliyor, banka hesabı.
3. **Fiyatlar:** 349 ₺ / 3.490 ₺ korunacak mı, komisyon ve stopaja göre artırılacak mı?
4. **Platform sırası:** İkisi birlikte mi, önce Android mi? (Türkiye'de Android payı çok daha yüksek; ancak Google'ın 14 günlük test şartı var.)
5. **Mevcut kullanıcılar:** Varsa iyzico ile ödemiş işletmeler dönemleri bitene kadar web'de devam eder; onlara bilgilendirme e-postası.

---

## 12. İlk adım önerisi

Faz 0'daki hesap ve vergi işlemleri beklenirken **Faz 1 hemen başlayabilir**: `shared/` çıkarma, servis katmanı ve mobil API uçları web'i bozmadan yapılabilir ve tamamen geri alınabilir. Faz 1 bittiğinde mevcut web paneli aynı servisleri kullanır, mobil uygulama için de sunucu hazır olur.

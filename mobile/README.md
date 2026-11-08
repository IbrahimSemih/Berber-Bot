# BerberBot Mobil (işletme paneli)

Expo SDK 58, Expo Router, TypeScript. Planın tamamı: [../mobile_app_plan.md](../mobile_app_plan.md).

## Kurulum

```bash
cd mobile
npm install
cp .env.example .env.local   # değerleri doldurun
npx expo start               # Expo Go / development build
npm run web                  # tarayıcıda önizleme (yalnızca geliştirme için)
```

`.env.local` içinde:

- `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY`: web projesinin `NEXT_PUBLIC_*` değerleriyle aynı.
- `EXPO_PUBLIC_API_URL`: Next.js sunucusunun adresi.
  - Android emülatörü: `http://10.0.2.2:3000` (emülatörde `localhost` emülatörün kendisini gösterir).
  - Fiziksel telefon: bilgisayarın yerel ağ IP'si (`ipconfig` → IPv4, ör. `http://192.168.x.x:3000`). Telefon ve bilgisayar aynı ağda olmalı.
  - Değiştirince `npx expo start -c` ile yeniden başlatın; değer paket oluşturulurken gömülür.
- `EXPO_PUBLIC_*` değerleri uygulama paketine gömülür. Buraya hiçbir zaman service role anahtarı yazılmaz.

## Supabase e-posta şablonları (bir kez, zorunlu)

Uygulama e-posta doğrulama ve şifre sıfırlamayı link yerine **kodla** yapar.

1. Supabase panelinde **Authentication → Email Templates** bölümünü açın.
2. **Confirm signup** ve **Reset password** şablonlarının ikisine de koda ait bir satır ekleyin:

```html
<p>Doğrulama kodunuz: <strong>{{ .Token }}</strong></p>
```

Şablondaki link kalabilir, web akışı bozulmaz. Kod uzunluğu Supabase ayarına göre 6–10 hanedir; uygulama ikisini de kabul eder.

## Mimari notları

- **Ortak kod:** `../shared/` (saat, plan/kilit kuralı, doğrulama, slug, API tipleri) `@shared/*` ile import edilir.
  - `metro.config.js` bu klasörü Metro'ya tanıtır.
  - `shared/` içindeki paketler (zod, date-fns-tz) bu klasörün `node_modules`'ından çözülür.
- **Yönlendirme (`src/app/_layout.tsx`):** `Stack.Protected` ile web'deki middleware'in karşılığıdır. Her durumda tek bir ekran grubu erişilebilir:
  - yükleniyor → `status`
  - oturum yok → `login` / `signup` / `verify` / `forgot`
  - dükkan yok → `onboarding`
  - askıda → `banned`
  - süre doldu → `paywall`
  - normal → `(tabs)`
- **Oturum ve dükkan durumu:** `src/lib/auth.tsx`. Dükkan React Query ile okunur ve uygulama ön plana her geldiğinde yenilenir.
- **Okuma ve basit yazma:** Supabase ile, kullanıcının yetkisiyle (RLS) yapılır.
- **Yan etkili işlemler** (dükkan kurma, onay/iptal, KVKK silme, hesap silme): `src/lib/api.ts` → `/api/mobile/v1/*`.
- **Tema:** `src/theme.ts`, web'deki `globals.css` renkleriyle aynı.
- **Tarayıcı önizlemesi:** mobil API'ye başka porttan istek attığı için CORS iznine ihtiyaç duyar. Bu izin `next.config.js` içinde yalnızca geliştirmede açıktır; telefondaki uygulama CORS'a tabi değildir.

## Cihazda test

- **Android emülatörü (Windows):**
  - `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk` olmalı; `emulator` ve `platform-tools` klasörleri PATH'te olmalı.
  - `npx expo start` ardından `a` tuşu.
  - Emülatöre en az 4 GB RAM verin (Android Studio → Device Manager → Edit → RAM). 2 GB'ta Android 16 "System isn't responding" uyarısıyla takılıyor.

- Yerel derleme için Android Studio/Xcode gerekir. RevenueCat ve push gibi native modüller eklenince Expo Go yetmez; development build gerekir:

```bash
npx eas-cli@latest build --profile development --platform android
```

- **Saat dilimi kontrolü:** "Daha fazla" ekranının altında "Saat dilimi doğru / HATALI" yazar.
  - Android'de (Hermes) HATALI görünürse `@formatjs/intl-datetimeformat` polyfill'i eklenmelidir.

## Kontroller

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Mağaza öncesi yapılacaklar

- `app.json` içindeki `com.berberbot.app` kimliği ve uygulama adı yer tutucudur. İsim kararı verildikten sonra, ilk mağaza build'inden **önce** değiştirilmelidir; sonra değiştirilemez.
- İkon ve açılış ekranı görselleri şablondan gelir, BerberBot görselleriyle değiştirilmelidir.

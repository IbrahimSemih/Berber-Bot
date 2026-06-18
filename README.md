# BerberBot 💈

WhatsApp üzerinden otomatik randevu sistemi. Berber dükkanları için SaaS.

## Proje Yapısı

```
berberbot/
├── app/
│   ├── page.tsx              → Landing page
│   ├── dashboard/page.tsx    → Admin dashboard
│   ├── appointments/page.tsx → Randevular
│   ├── customers/page.tsx    → Müşteriler
│   ├── whatsapp/page.tsx     → Bot simülatörü & akış
│   ├── settings/page.tsx     → Ayarlar
│   └── api/
│       ├── whatsapp/route.ts → WhatsApp webhook (GET verify + POST messages)
│       ├── appointments/     → CRUD API
│       └── customers/        → Müşteri API
├── components/
│   ├── layout/AdminLayout.tsx
│   ├── ui/index.tsx          → Button, Badge, Card, Avatar, Toggle...
│   └── AddAppointmentModal.tsx
├── lib/
│   ├── supabase.ts           → Supabase client
│   ├── whatsapp.ts           → WhatsApp Cloud API helper + bot state
│   ├── mock-data.ts          → Geliştirme için örnek veri
│   └── utils.ts              → formatPrice, formatDate, cn...
├── types/index.ts            → TypeScript tipleri
└── supabase-schema.sql       → Veritabanı şeması
```

---

## Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Ortam değişkenlerini ayarla

```bash
cp .env.local.example .env.local
```

`.env.local` dosyasını düzenle:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_VERIFY_TOKEN=rastgele-bir-string-yaz
```

### 3. Supabase veritabanını kur

1. [app.supabase.com](https://app.supabase.com) → Yeni proje oluştur
2. SQL Editor → `supabase-schema.sql` içeriğini kopyalayıp çalıştır
3. Settings → API → URL ve Anon Key'i kopyala

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
```

→ http://localhost:3000

---

## WhatsApp Cloud API Kurulumu

1. [developers.facebook.com](https://developers.facebook.com) → Uygulama oluştur
2. WhatsApp → API Setup
3. Test numaranı ekle
4. **Webhook URL:** `https://your-domain.com/api/whatsapp`
5. **Verify Token:** `.env.local`'daki `WHATSAPP_VERIFY_TOKEN` ile aynı
6. Subscribe: `messages`

> Yerel geliştirme için [ngrok](https://ngrok.com) kullan:
> ```bash
> ngrok http 3000
> ```
> Ngrok URL'ini webhook olarak ekle.

---

## Deploy (Vercel)

```bash
npm install -g vercel
vercel
```

Vercel dashboard'da environment variable'ları ekle.

---

## Sonraki Adımlar

- [ ] Stripe abonelik sistemi entegrasyonu
- [ ] Cron job: 24 saat öncesi hatırlatma (Vercel Cron)
- [ ] Çoklu çalışan takvimi
- [ ] Google Calendar sync
- [ ] Müşteri portalı (randevu iptali için link)
- [ ] Analitik sayfası (charts)

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14, Tailwind CSS |
| Backend | Next.js API Routes |
| Veritabanı | Supabase (PostgreSQL) |
| WhatsApp | Meta Cloud API |
| Deploy | Vercel |
| Font | Syne + DM Sans |

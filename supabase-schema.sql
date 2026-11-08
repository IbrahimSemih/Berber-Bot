-- 0. Shops (Dükkanlar)
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SaaS Abonelik Kolonları (Varolan tabloya ekleme)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'pro';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_subscription_status_check;
ALTER TABLE shops ADD CONSTRAINT shops_subscription_status_check CHECK (subscription_status IN ('trialing','active','past_due','canceled'));
ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS iyzico_customer_reference_code TEXT;

-- 1. Services (Hizmetler)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Staff (Personeller)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Staff Leaves (Personel İzinleri)
CREATE TABLE IF NOT EXISTS staff_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_date_after_start_date CHECK (end_date >= start_date)
);

-- 2. Customers (Müşteriler)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT NOT NULL, -- E.164: +905321234567
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, phone)
);

-- 3. Appointments (Randevular)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp','manual')),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  cancel_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tablo zaten varsa staff_id kolonunu güvenle eklemek için:
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancel_token TEXT UNIQUE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- 4. Settings (Dükkan Ayarları)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE UNIQUE,
  shop_name TEXT,
  whatsapp_number TEXT,
  work_start TIME DEFAULT '09:00',
  work_end TIME DEFAULT '20:00',
  work_days INTEGER[] DEFAULT '{1,2,3,4,5,6}',
  working_hours JSONB DEFAULT '[{"day":1,"is_open":true,"start":"09:00","end":"20:00"},{"day":2,"is_open":true,"start":"09:00","end":"20:00"},{"day":3,"is_open":true,"start":"09:00","end":"20:00"},{"day":4,"is_open":true,"start":"09:00","end":"20:00"},{"day":5,"is_open":true,"start":"09:00","end":"20:00"},{"day":6,"is_open":true,"start":"09:00","end":"20:00"},{"day":0,"is_open":false,"start":"09:00","end":"20:00"}]',
  reminder_hours INTEGER DEFAULT 24,
  auto_confirm BOOLEAN DEFAULT true,
  notify_new BOOLEAN DEFAULT true,
  notify_cancel BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notifications (Bildirimler)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'cancel', 'new_booking', etc.
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payments (Ödemeler)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL, -- ödeme kayıtları yasal olarak saklanır
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  payment_id TEXT, -- İyzico'dan dönen paymentId
  status TEXT NOT NULL, -- 'success', 'failure'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yıllık plan & iade takibi (status: 'success', 'failure', 'refunded')
ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;


-- ─── Seed Data ────────────────────────────────────────────────────────────

/*
INSERT INTO shops (id, name, slug) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Maestro Berber', 'maestro-berber')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (shop_id, name, duration_minutes, price) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Saç Kesimi', 30, 150),
  ('11111111-1111-1111-1111-111111111111', 'Sakal Düzeltme', 20, 80),
  ('11111111-1111-1111-1111-111111111111', 'Komple Paket', 45, 200),
  ('11111111-1111-1111-1111-111111111111', 'Çocuk Kesimi', 20, 100)
ON CONFLICT DO NOTHING;

INSERT INTO settings (shop_id, shop_name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Maestro Berber')
ON CONFLICT DO NOTHING;
*/

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ── shops ──
-- Kullanıcı sadece kendi dükkanını görebilir
DROP POLICY IF EXISTS "Users can view own shop" ON shops;
CREATE POLICY "Users can view own shop" ON shops
  FOR SELECT USING (owner_id = auth.uid());

-- Yeni kayıt olan kullanıcılar dükkan oluşturabilir
DROP POLICY IF EXISTS "Users can create shop" ON shops;
CREATE POLICY "Users can create shop" ON shops
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Sadece sahibi güncelleyebilir
DROP POLICY IF EXISTS "Users can update own shop" ON shops;
CREATE POLICY "Users can update own shop" ON shops
  FOR UPDATE USING (owner_id = auth.uid());

-- ── services ──
DROP POLICY IF EXISTS "Users can manage own services" ON services;
CREATE POLICY "Users can manage own services" ON services
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ── staff ──
DROP POLICY IF EXISTS "Users can manage own staff" ON staff;
CREATE POLICY "Users can manage own staff" ON staff
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ── staff_leaves ──
DROP POLICY IF EXISTS "Users can manage own staff_leaves" ON staff_leaves;
CREATE POLICY "Users can manage own staff_leaves" ON staff_leaves
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ── customers ──
DROP POLICY IF EXISTS "Users can manage own customers" ON customers;
CREATE POLICY "Users can manage own customers" ON customers
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ── appointments ──
DROP POLICY IF EXISTS "Users can manage own appointments" ON appointments;
CREATE POLICY "Users can manage own appointments" ON appointments
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ── settings ──
DROP POLICY IF EXISTS "Users can manage own settings" ON settings;
CREATE POLICY "Users can manage own settings" ON settings
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ── notifications ──
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ── payments ──
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ─── Useful Views ─────────────────────────────────────────────────────────

-- appointments_full view'ı aşağıdaki "LANSMAN GÜNCELLEMESİ" bölümünde (security_invoker ile) tanımlanır.

-- ═══════════════════════════════════════════════════════════════════════════
-- LANSMAN GÜNCELLEMESİ (2026-11-05) — migrations/2026-11-05_launch_hardening.sql ile aynıdır
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Eksik / yeni kolonlar ───────────────────────────────────────────────
ALTER TABLE shops ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS expiry_reminder_sent_for TIMESTAMPTZ;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS instagram TEXT;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_snapshot JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- ── 2. Fatura bilgileri ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_profiles (
  shop_id UUID PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'individual' CHECK (type IN ('individual', 'corporate')),
  full_name TEXT NOT NULL,
  company_name TEXT,
  identity_number TEXT,
  tax_office TEXT,
  tax_number TEXT,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  zip_code TEXT,
  contract_accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE billing_profiles ENABLE ROW LEVEL SECURITY;

-- Sahibi kendi fatura bilgisini okuyabilir; yazma yalnızca sunucu (service role) üzerinden yapılır
DROP POLICY IF EXISTS "Users can view own billing profile" ON billing_profiles;
CREATE POLICY "Users can view own billing profile" ON billing_profiles
  FOR SELECT USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ── 3. Abonelik alanlarını tarayıcıdan değiştirmeyi engelle ────────────────
-- RLS "Users can update own shop" politikası kolon bazlı değildir: trigger olmadan
-- dükkan sahibi tarayıcı konsolundan subscription_status / current_period_end /
-- status alanlarını değiştirip ödeme yapmadan sistemi kullanabilir veya ban'ını
-- kaldırabilir. Bu trigger, anon/authenticated rollerinden gelen isteklerde bu
-- alanları eski değerinde tutar. service_role (sunucu) ve SQL Editor etkilenmez.
CREATE OR REPLACE FUNCTION public.protect_shop_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Dükkanlar sunucuda (app/onboarding/actions.ts) oluşturulur
    RAISE EXCEPTION 'Dükkan oluşturma yalnızca sunucu üzerinden yapılabilir.'
      USING ERRCODE = '42501';
  END IF;

  NEW.owner_id := OLD.owner_id;
  NEW.slug := OLD.slug;
  NEW.status := OLD.status;
  NEW.plan_id := OLD.plan_id;
  NEW.subscription_status := OLD.subscription_status;
  NEW.trial_end := OLD.trial_end;
  NEW.current_period_end := OLD.current_period_end;
  NEW.iyzico_customer_reference_code := OLD.iyzico_customer_reference_code;
  NEW.expiry_reminder_sent_for := OLD.expiry_reminder_sent_for;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_shop_billing_fields ON shops;
CREATE TRIGGER protect_shop_billing_fields
  BEFORE INSERT OR UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION public.protect_shop_billing_fields();

-- ── 4. appointments_full view'ını kapat ─────────────────────────────────────
-- Postgres view'ları varsayılan olarak sahibinin yetkisiyle çalışır ve RLS'i
-- atlar; Supabase'de anon rolü public şemadaki view'lara erişebildiği için
-- tarayıcıdaki anon key ile TÜM dükkanların müşteri adı, telefonu ve iptal
-- token'ı okunabiliyordu. View yalnızca sunucuda (service role) kullanılıyor.
CREATE OR REPLACE VIEW appointments_full WITH (security_invoker = true) AS
SELECT
  a.id,
  a.shop_id,
  a.scheduled_at,
  a.status,
  a.source,
  a.notes,
  a.reminder_sent,
  a.cancel_token,
  a.created_at,
  c.id as customer_id,
  c.name as customer_name,
  c.phone as customer_phone,
  s.id as service_id,
  s.name as service_name,
  s.duration_minutes,
  s.price,
  st.id as staff_id,
  st.name as staff_name,
  sh.name as shop_name
FROM appointments a
LEFT JOIN customers c ON c.id = a.customer_id
LEFT JOIN services s ON s.id = a.service_id
LEFT JOIN staff st ON st.id = a.staff_id
LEFT JOIN shops sh ON sh.id = a.shop_id;

REVOKE ALL ON appointments_full FROM anon, authenticated;

-- ── 5. Performans indeksleri ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS appointments_shop_scheduled_idx ON appointments (shop_id, scheduled_at);
CREATE INDEX IF NOT EXISTS appointments_reminder_idx ON appointments (scheduled_at) WHERE status = 'confirmed' AND reminder_sent = false;
CREATE INDEX IF NOT EXISTS payments_payment_id_idx ON payments (payment_id);
CREATE INDEX IF NOT EXISTS staff_leaves_shop_dates_idx ON staff_leaves (shop_id, start_date, end_date);

-- ─── Realtime ─────────────────────────────────────────────────────────────
-- Bildirimlerin anında gelmesi için supabase_realtime publication'a ekliyoruz
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERİ BÜTÜNLÜĞÜ VE PAYWALL (2026-11-08) — migrations/2026-11-08_integrity_and_paywall.sql ile aynıdır
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Ödeme kayıtları hesap silinince kaybolmasın ─────────────────────────
-- Fatura/ödeme kayıtları yasal olarak saklanmalı (VUK). Dükkan silinince
-- payments satırı silinmez; shop_id NULL olur, billing_snapshot fatura
-- bilgilerini korur.
DO $$
DECLARE
  c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND contype = 'f'
      AND confrelid = 'public.shops'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE payments
  ADD CONSTRAINT payments_shop_id_fkey
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL;

-- ── 2. Aynı iyzico ödemesi iki kez işlenemesin ─────────────────────────────
-- Bu index oluşturulamazsa önce mükerrer kayıtları kontrol edin:
--   SELECT payment_id, count(*) FROM payments
--   WHERE status IN ('success','refunded') GROUP BY payment_id HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS payments_payment_id_paid_uidx
  ON payments (payment_id)
  WHERE status IN ('success', 'refunded');

-- ── 3. Paywall'ı veritabanında da uygula ───────────────────────────────────
-- Deneme/abonelik süresi dolan işletme, tarayıcıdaki Supabase client'ıyla
-- da veri ekleyip değiştiremesin. Kural lib/plan-limits.ts#computeIsLocked ile aynıdır.
CREATE OR REPLACE FUNCTION public.owns_active_shop(p_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shops s
    WHERE s.id = p_shop_id
      AND s.owner_id = auth.uid()
      AND COALESCE(s.status, 'active') <> 'banned'
      AND (
        (s.subscription_status = 'trialing' AND s.trial_end IS NOT NULL AND s.trial_end > now())
        OR (s.subscription_status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > now()))
      )
  );
$$;

REVOKE ALL ON FUNCTION public.owns_active_shop(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_active_shop(uuid) TO authenticated;

-- Okuma ve silme: sahibi her zaman yapabilir. Ekleme ve güncelleme: yalnızca
-- aboneliği/denemesi aktif sahip. (notifications bu kurala dahil değildir.)
DO $$
DECLARE
  t text;
  owner_check text := 'shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())';
BEGIN
  FOREACH t IN ARRAY ARRAY['services', 'staff', 'staff_leaves', 'customers', 'appointments', 'settings'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Users can manage own ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Owner can read own ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Owner can delete own ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Active owner can insert ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Active owner can update ' || t, t);

    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (%s)', 'Owner can read own ' || t, t, owner_check);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (%s)', 'Owner can delete own ' || t, t, owner_check);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (public.owns_active_shop(shop_id))', 'Active owner can insert ' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (%s) WITH CHECK (public.owns_active_shop(shop_id))', 'Active owner can update ' || t, t, owner_check);
  END LOOP;
END $$;

-- Kontrol (süresi dolmuş bir test hesabıyla tarayıcı konsolunda):
--   await supabase.from('customers').insert({ shop_id: '<id>', phone: '+905000000000' })
-- RLS hatası ("new row violates row-level security policy") dönmeli.

-- ── 4. Panelden eklenmiş eski politikaları kaldır (migrations/2026-11-08b) ──
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('services', 'staff', 'staff_leaves', 'customers', 'appointments', 'settings')
      AND policyname NOT IN (
        'Owner can read own ' || tablename,
        'Owner can delete own ' || tablename,
        'Active owner can insert ' || tablename,
        'Active owner can update ' || tablename
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    RAISE NOTICE 'Kaldırıldı: %.%', r.tablename, r.policyname;
  END LOOP;
END $$;

-- ═══ 2026-11-08c — Mobil uygulama altyapısı (migrations/2026-11-08c_mobile_billing.sql) ═══
-- ── 1. Abonelik kaynağı ─────────────────────────────────────────────────────
-- billing_provider: 'iyzico' | 'app_store' | 'play_store' (NULL: hiç ödeme yok / deneme)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS billing_provider TEXT;
-- Mağaza aboneliği otomatik yenilenecek mi (kullanıcı mağazadan iptal ettiyse false)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS store_will_renew BOOLEAN;

-- Ödemenin kaynağı ve ortamı. Sandbox ödemeleri (App Review dahil) gelir raporlarından hariç tutulur.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'iyzico';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS product_id TEXT;

-- Mevcut ödemesi olan dükkanlar iyzico ile ödemiş sayılır
UPDATE shops s SET billing_provider = 'iyzico'
WHERE s.billing_provider IS NULL
  AND EXISTS (SELECT 1 FROM payments p WHERE p.shop_id = s.id AND p.status IN ('success', 'refunded'));

-- ── 2. Mağaza webhook olayları ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS store_webhook_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  app_user_id TEXT,
  environment TEXT,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);
-- Politika yok: yalnızca service role (webhook) okur/yazar
ALTER TABLE store_webhook_events ENABLE ROW LEVEL SECURITY;

-- ── 3. Push token'ları ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  token TEXT PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_tokens_shop_idx ON push_tokens (shop_id);
-- Politika yok: kayıt /api/mobile/v1/push-tokens üzerinden (service role) yapılır
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- ── 4. Abonelik alanlarını istemciden koru ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_shop_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Dükkanlar sunucuda (lib/services/shop.ts) oluşturulur
    RAISE EXCEPTION 'Dükkan oluşturma yalnızca sunucu üzerinden yapılabilir.'
      USING ERRCODE = '42501';
  END IF;

  NEW.owner_id := OLD.owner_id;
  NEW.slug := OLD.slug;
  NEW.status := OLD.status;
  NEW.plan_id := OLD.plan_id;
  NEW.subscription_status := OLD.subscription_status;
  NEW.trial_end := OLD.trial_end;
  NEW.current_period_end := OLD.current_period_end;
  NEW.iyzico_customer_reference_code := OLD.iyzico_customer_reference_code;
  NEW.expiry_reminder_sent_for := OLD.expiry_reminder_sent_for;
  NEW.billing_provider := OLD.billing_provider;
  NEW.store_will_renew := OLD.store_will_renew;
  RETURN NEW;
END;
$$;


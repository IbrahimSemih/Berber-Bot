-- ═══════════════════════════════════════════════════════════════════════════
-- LANSMAN GÜNCELLEMESİ (2026-11-05)
-- Supabase SQL Editor'da TEK SEFERDE çalıştırın. Tekrar çalıştırılması güvenlidir
-- (idempotent). Aynı ifadeler supabase-schema.sql içinde de bulunur.
-- Gereksinim: PostgreSQL 15+ (Supabase projelerinde varsayılan).
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

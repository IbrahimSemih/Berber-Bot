-- ═══════════════════════════════════════════════════════════════════════════
-- 2026-11-08c — Mobil uygulama altyapısı (mobile_app_plan.md, Faz 1)
-- 2026-11-08 ve 2026-11-08b'den SONRA çalıştırın. Tekrar çalıştırılabilir.
--
-- 1. Mağaza (App Store / Google Play) aboneliği için shops ve payments sütunları
-- 2. RevenueCat webhook olayları (idempotency) için store_webhook_events
-- 3. Mobil push bildirimleri için push_tokens
-- 4. protect_shop_billing_fields: yeni abonelik alanları da istemciden korunur
-- ═══════════════════════════════════════════════════════════════════════════

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

-- Kontrol:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name IN ('shops', 'payments') AND column_name IN
--     ('billing_provider', 'store_will_renew', 'provider', 'environment', 'product_id');   -- 5 satır
--   SELECT to_regclass('public.push_tokens'), to_regclass('public.store_webhook_events');  -- ikisi de dolu

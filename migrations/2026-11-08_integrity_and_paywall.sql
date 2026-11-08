-- ═══════════════════════════════════════════════════════════════════════════
-- 2026-11-08 — Veri bütünlüğü ve paywall güncellemesi
-- Supabase SQL Editor'da çalıştırın. Tekrar çalıştırılabilir (idempotent).
-- Önce 2026-11-05_launch_hardening.sql çalışmış olmalı.
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

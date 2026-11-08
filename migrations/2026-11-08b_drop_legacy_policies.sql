-- ═══════════════════════════════════════════════════════════════════════════
-- 2026-11-08b — Eski / panelden eklenmiş RLS politikalarını temizle
-- 2026-11-08_integrity_and_paywall.sql'den SONRA çalıştırın. Tekrar çalıştırılabilir.
--
-- Neden: Postgres'te aynı tablodaki politikalar OR ile birleşir. Canlı veritabanında
-- customers ve settings tablolarında SQL dosyalarında olmayan ek bir sahip politikası
-- bulunduğu için süresi dolmuş işletme bu tablolara yazmaya devam edebiliyordu.
-- Bu dosya, aşağıdaki tablolarda 2026-11-08 migration'ının oluşturduğu 4 politika
-- dışındaki TÜM politikaları kaldırır. (Herkese açık sayfalar admin client kullandığı
-- için anon politikası gerekmez.)
-- ═══════════════════════════════════════════════════════════════════════════

-- Silinecekleri önce görmek isterseniz yalnızca bu sorguyu çalıştırın:
--   SELECT tablename, policyname, cmd, roles, qual, with_check FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('services','staff','staff_leaves','customers','appointments','settings')
--   ORDER BY tablename, policyname;

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

-- Kontrol: her tabloda tam 4 politika kalmalı
SELECT tablename, count(*) AS policy_count, string_agg(policyname, ', ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('services', 'staff', 'staff_leaves', 'customers', 'appointments', 'settings')
GROUP BY tablename
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2026-11-09 — Randevuları canlı güncelleme (Supabase Realtime) yayınına ekle
-- Tekrar çalıştırılabilir.
--
-- Neden: supabase-schema.sql yalnızca notifications tablosunu supabase_realtime
-- yayınına ekliyordu. Web randevular sayfası ve mobil uygulama appointments
-- değişikliklerini dinliyor; tablo yayında değilse olay gelmez (ekran ancak elle
-- yenilenince güncellenir). Realtime, RLS'e uyar: her işletme yalnızca kendi
-- randevularının değişikliklerini alır.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Kontrol: iki satır dönmeli (appointments, notifications)
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' ORDER BY tablename;

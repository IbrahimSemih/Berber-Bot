-- ============================================================
-- BerberBot — Supabase Database Schema
-- Supabase SQL Editor'a kopyalayıp çalıştır
-- ============================================================

-- 0. Shops (Dükkanlar)
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp','manual')),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Settings (Dükkan Ayarları)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE UNIQUE,
  shop_name TEXT DEFAULT 'Maestro Berber',
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

-- ─── Seed Data ────────────────────────────────────────────────────────────

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

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Geliştirme aşamasında herkese izin ver (canlıya geçince düzenle)
CREATE POLICY "Allow all" ON shops FOR ALL USING (true);
CREATE POLICY "Allow all" ON services FOR ALL USING (true);
CREATE POLICY "Allow all" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all" ON settings FOR ALL USING (true);

-- ─── Useful Views ─────────────────────────────────────────────────────────

-- Randevular + müşteri + hizmet bilgisiyle
CREATE OR REPLACE VIEW appointments_full AS
SELECT
  a.id,
  a.shop_id,
  a.scheduled_at,
  a.status,
  a.source,
  a.notes,
  a.reminder_sent,
  a.created_at,
  c.id as customer_id,
  c.name as customer_name,
  c.phone as customer_phone,
  s.id as service_id,
  s.name as service_name,
  s.duration_minutes,
  s.price
FROM appointments a
LEFT JOIN customers c ON c.id = a.customer_id
LEFT JOIN services s ON s.id = a.service_id;

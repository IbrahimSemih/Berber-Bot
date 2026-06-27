-- ============================================================
-- BerberBot — RLS Migration
-- Bu SQL'i Supabase Dashboard → SQL Editor'a yapıştırıp çalıştırın
-- ============================================================

-- 1. Eski "Allow all" politikalarını kaldır
DROP POLICY IF EXISTS "Allow all" ON shops;
DROP POLICY IF EXISTS "Allow all" ON services;
DROP POLICY IF EXISTS "Allow all" ON customers;
DROP POLICY IF EXISTS "Allow all" ON appointments;
DROP POLICY IF EXISTS "Allow all" ON settings;

-- 2. shops — Kullanıcı sadece kendi dükkânını görebilir/düzenleyebilir
CREATE POLICY "Users can view own shop" ON shops
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create shop" ON shops
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own shop" ON shops
  FOR UPDATE USING (owner_id = auth.uid());

-- 3. services — Sadece kendi dükkânının hizmetleri
CREATE POLICY "Users can manage own services" ON services
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- 4. customers — Sadece kendi dükkânının müşterileri
CREATE POLICY "Users can manage own customers" ON customers
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- 5. appointments — Sadece kendi dükkânının randevuları
CREATE POLICY "Users can manage own appointments" ON appointments
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- 6. settings — Sadece kendi dükkânının ayarları
CREATE POLICY "Users can manage own settings" ON settings
  FOR ALL USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
  );

-- ✅ Tamamlandı! Artık her kullanıcı sadece kendi verisine erişebilir.
-- Not: WhatsApp bot servisi SERVICE_ROLE_KEY kullandığı için RLS'den etkilenmez.

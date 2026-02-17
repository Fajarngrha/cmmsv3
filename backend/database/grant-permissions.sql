-- ============================================================
-- CMMS - Grant hak akses ke user aplikasi (perbaikan error 42501)
-- ============================================================
-- PENTING: Ganti cmms_userv3/cmms_dbv3 di bawah jika pakai user/database lain
--          (lihat DB_USER/DB_NAME atau DATABASE_URL di backend .env)
--
-- Jalankan sebagai superuser postgres:
--   sudo -u postgres psql -d cmms_dbv3 -f backend/database/grant-permissions.sql

-- Atau pakai file siap pakai: grant-permissions-cmms_dbv3.sql

-- Schema
GRANT USAGE ON SCHEMA public TO cmms_userv3;
GRANT CREATE ON SCHEMA public TO cmms_userv3;

-- Semua tabel (SELECT, INSERT, UPDATE, DELETE)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cmms_userv3;

-- Sequence (untuk SERIAL / nextval)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cmms_userv3;

-- Fungsi (trigger set_updated_at)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cmms_userv3;

-- Jadikan user aplikasi sebagai OWNER tabel (agar tidak ada "permission denied")
ALTER TABLE assets OWNER TO cmms_userv3;
ALTER TABLE permintaan_perbaikan OWNER TO cmms_userv3;
ALTER TABLE spare_parts OWNER TO cmms_userv3;
ALTER TABLE spare_part_history OWNER TO cmms_userv3;
ALTER TABLE purchase_orders OWNER TO cmms_userv3;
ALTER TABLE upcoming_pm OWNER TO cmms_userv3;

-- Hak pakai tipe ENUM (tanpa ini bisa tetap 42501 saat akses tabel)
GRANT USAGE ON TYPE asset_health TO cmms_userv3;
GRANT USAGE ON TYPE wo_status TO cmms_userv3;
GRANT USAGE ON TYPE wo_type TO cmms_userv3;
GRANT USAGE ON TYPE po_kategori TO cmms_userv3;
GRANT USAGE ON TYPE po_status TO cmms_userv3;

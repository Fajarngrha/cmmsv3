-- ============================================================
-- CMMS - Grant hak akses ke user aplikasi (perbaikan error 42501)
-- ============================================================
-- PENTING: Ganti 'cmms_user' di bawah dengan user yang dipakai di backend .env
--          (lihat DB_USER atau user di DATABASE_URL)
--
-- Jalankan sebagai superuser postgres:
--   sudo -u postgres psql -d cmms_db -f backend/database/grant-permissions.sql

-- Schema
GRANT USAGE ON SCHEMA public TO cmms_userv2;
GRANT CREATE ON SCHEMA public TO cmms_userv2;

-- Semua tabel (SELECT, INSERT, UPDATE, DELETE)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cmms_userv2;

-- Sequence (untuk SERIAL / nextval)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cmms_userv2;

-- Fungsi (trigger set_updated_at)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cmms_userv2;

-- Jadikan user aplikasi sebagai OWNER tabel (agar tidak ada "permission denied")
ALTER TABLE assets OWNER TO cmms_userv2;
ALTER TABLE permintaan_perbaikan OWNER TO cmms_userv2;
ALTER TABLE spare_parts OWNER TO cmms_userv2;
ALTER TABLE spare_part_history OWNER TO cmms_userv2;
ALTER TABLE purchase_orders OWNER TO cmms_userv2;
ALTER TABLE upcoming_pm OWNER TO cmms_userv2;

-- Hak pakai tipe ENUM (tanpa ini bisa tetap 42501 saat akses tabel)
GRANT USAGE ON TYPE asset_health TO cmms_userv2;
GRANT USAGE ON TYPE wo_status TO cmms_userv2;
GRANT USAGE ON TYPE wo_type TO cmms_userv2;
GRANT USAGE ON TYPE po_kategori TO cmms_userv2;
GRANT USAGE ON TYPE po_status TO cmms_userv2;

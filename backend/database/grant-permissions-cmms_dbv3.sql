-- ============================================================
-- CMMS - Grant hak akses untuk database cmms_dbv3 (user cmms_userv3)
-- ============================================================
-- Jalankan di VPS (pastikan schema sudah ada di cmms_dbv3):
--   sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f backend/database/grant-permissions-cmms_dbv3.sql
-- Lalu: pm2 restart cmms-apiv2

-- Hak sambung ke database (wajib)
GRANT CONNECT ON DATABASE cmms_dbv3 TO cmms_userv3;

-- Schema
GRANT USAGE ON SCHEMA public TO cmms_userv3;
GRANT CREATE ON SCHEMA public TO cmms_userv3;

-- Tabel & sequence & fungsi
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cmms_userv3;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cmms_userv3;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cmms_userv3;

-- ENUM types (wajib untuk tabel yang pakai wo_status, wo_type, dll.)
GRANT USAGE ON TYPE asset_health TO cmms_userv3;
GRANT USAGE ON TYPE wo_status TO cmms_userv3;
GRANT USAGE ON TYPE wo_type TO cmms_userv3;
GRANT USAGE ON TYPE po_kategori TO cmms_userv3;
GRANT USAGE ON TYPE po_status TO cmms_userv3;

-- Owner tabel + sequence (hilangkan 42501)
ALTER TABLE assets OWNER TO cmms_userv3;
ALTER TABLE permintaan_perbaikan OWNER TO cmms_userv3;
ALTER TABLE spare_parts OWNER TO cmms_userv3;
ALTER TABLE spare_part_history OWNER TO cmms_userv3;
ALTER TABLE purchase_orders OWNER TO cmms_userv3;
ALTER TABLE po_no_registrasi_seq OWNER TO cmms_userv3;
ALTER TABLE upcoming_pm OWNER TO cmms_userv3;

ALTER SEQUENCE IF EXISTS assets_id_seq OWNER TO cmms_userv3;
ALTER SEQUENCE IF EXISTS permintaan_perbaikan_id_seq OWNER TO cmms_userv3;
ALTER SEQUENCE IF EXISTS spare_parts_id_seq OWNER TO cmms_userv3;
ALTER SEQUENCE IF EXISTS purchase_orders_id_seq OWNER TO cmms_userv3;
ALTER SEQUENCE IF EXISTS upcoming_pm_id_seq OWNER TO cmms_userv3;

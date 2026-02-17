-- ============================================================
-- CMMS - Grant hak akses untuk database cmms_dbv2 (user cmms_userv2)
-- ============================================================
-- Jalankan di VPS (pastikan schema sudah ada di cmms_dbv2):
--   sudo -u postgres psql -d cmms_dbv2 -v ON_ERROR_STOP=1 -f /var/www/fid-cmmsv2/backend/database/grant-permissions-cmms_dbv2.sql
-- Lalu: pm2 restart cmms-apiv2

-- Hak sambung ke database (wajib)
GRANT CONNECT ON DATABASE cmms_dbv2 TO cmms_userv2;

-- Schema
GRANT USAGE ON SCHEMA public TO cmms_userv2;
GRANT CREATE ON SCHEMA public TO cmms_userv2;

-- Tabel & sequence & fungsi
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cmms_userv2;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cmms_userv2;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cmms_userv2;

-- ENUM types (wajib untuk tabel yang pakai wo_status, wo_type, dll.)
GRANT USAGE ON TYPE asset_health TO cmms_userv2;
GRANT USAGE ON TYPE wo_status TO cmms_userv2;
GRANT USAGE ON TYPE wo_type TO cmms_userv2;
GRANT USAGE ON TYPE po_kategori TO cmms_userv2;
GRANT USAGE ON TYPE po_status TO cmms_userv2;

-- Owner tabel + sequence (hilangkan 42501)
ALTER TABLE assets OWNER TO cmms_userv2;
ALTER TABLE permintaan_perbaikan OWNER TO cmms_userv2;
ALTER TABLE spare_parts OWNER TO cmms_userv2;
ALTER TABLE spare_part_history OWNER TO cmms_userv2;
ALTER TABLE purchase_orders OWNER TO cmms_userv2;
ALTER TABLE upcoming_pm OWNER TO cmms_userv2;

ALTER SEQUENCE IF EXISTS assets_id_seq OWNER TO cmms_userv2;
ALTER SEQUENCE IF EXISTS permintaan_perbaikan_id_seq OWNER TO cmms_userv2;
ALTER SEQUENCE IF EXISTS spare_parts_id_seq OWNER TO cmms_userv2;
ALTER SEQUENCE IF EXISTS purchase_orders_id_seq OWNER TO cmms_userv2;
ALTER SEQUENCE IF EXISTS upcoming_pm_id_seq OWNER TO cmms_userv2;

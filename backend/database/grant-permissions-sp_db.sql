-- ============================================================
-- CMMS - Grant hak akses untuk database sp_db
-- ============================================================
-- User aplikasi default: cmms_userv3
--
-- Jalankan (dari folder project):
--   sudo -u postgres psql -d sp_db -v ON_ERROR_STOP=1 \
--     -f backend/database/grant-permissions-sp_db.sql
--
-- Jika user PostgreSQL juga diganti (contoh: sp_user):
--   sudo -u postgres psql -d sp_db -v ON_ERROR_STOP=1 -v app_user=sp_user \
--     -f backend/database/grant-permissions-sp_db.sql

\if :{?app_user}
\else
\set app_user cmms_userv3
\endif

GRANT CONNECT ON DATABASE sp_db TO :"app_user";

GRANT USAGE ON SCHEMA public TO :"app_user";
GRANT CREATE ON SCHEMA public TO :"app_user";

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO :"app_user";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"app_user";
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO :"app_user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO :"app_user";

GRANT USAGE ON TYPE asset_health TO :"app_user";
GRANT USAGE ON TYPE wo_status TO :"app_user";
GRANT USAGE ON TYPE wo_type TO :"app_user";
GRANT USAGE ON TYPE po_kategori TO :"app_user";
GRANT USAGE ON TYPE po_status TO :"app_user";

ALTER TABLE IF EXISTS assets OWNER TO :"app_user";
ALTER TABLE IF EXISTS permintaan_perbaikan OWNER TO :"app_user";
ALTER TABLE IF EXISTS spare_parts OWNER TO :"app_user";
ALTER TABLE IF EXISTS spare_part_history OWNER TO :"app_user";
ALTER TABLE IF EXISTS purchase_orders OWNER TO :"app_user";
ALTER TABLE IF EXISTS po_no_registrasi_seq OWNER TO :"app_user";
ALTER TABLE IF EXISTS upcoming_pm OWNER TO :"app_user";
ALTER TABLE IF EXISTS app_users OWNER TO :"app_user";

ALTER SEQUENCE IF EXISTS assets_id_seq OWNER TO :"app_user";
ALTER SEQUENCE IF EXISTS permintaan_perbaikan_id_seq OWNER TO :"app_user";
ALTER SEQUENCE IF EXISTS spare_parts_id_seq OWNER TO :"app_user";
ALTER SEQUENCE IF EXISTS spare_part_history_id_seq OWNER TO :"app_user";
ALTER SEQUENCE IF EXISTS purchase_orders_id_seq OWNER TO :"app_user";
ALTER SEQUENCE IF EXISTS upcoming_pm_id_seq OWNER TO :"app_user";
ALTER SEQUENCE IF EXISTS app_users_id_seq OWNER TO :"app_user";

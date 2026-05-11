-- ============================================================
-- CMMS - Pengguna aplikasi (login web), multi-user, tanpa sesi DB
-- ============================================================
-- Jalankan (contoh):
--   sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f backend/database/migration-cmms-app-users.sql
--
-- Tambah pengguna setelah migrasi:
--   cd backend && npm run user:create -- <username> <password> ["Nama tampilan"]

CREATE TABLE IF NOT EXISTS cmms_app_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(200),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cmms_app_users_username_lower_idx
  ON cmms_app_users (lower(username));

COMMENT ON TABLE cmms_app_users IS 'Akun login CMMS web; beberapa token aktif per user (login bersamaan)';

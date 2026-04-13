-- ============================================================
-- CMMS - Grant hak akses untuk database cmms_db (Windows/local)
-- User aplikasi: cmms_userv3
-- Jalankan sebagai superuser (postgres) di database: cmms_db
-- ============================================================

GRANT CONNECT ON DATABASE cmms_db TO cmms_userv3;

GRANT USAGE ON SCHEMA public TO cmms_userv3;
GRANT CREATE ON SCHEMA public TO cmms_userv3;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cmms_userv3;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cmms_userv3;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cmms_userv3;

-- Default privileges untuk object baru
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO cmms_userv3;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO cmms_userv3;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO cmms_userv3;

-- ENUM types (wajib, jika tipe ada)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_health') THEN
    EXECUTE 'GRANT USAGE ON TYPE asset_health TO cmms_userv3';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wo_status') THEN
    EXECUTE 'GRANT USAGE ON TYPE wo_status TO cmms_userv3';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wo_type') THEN
    EXECUTE 'GRANT USAGE ON TYPE wo_type TO cmms_userv3';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_kategori') THEN
    EXECUTE 'GRANT USAGE ON TYPE po_kategori TO cmms_userv3';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status') THEN
    EXECUTE 'GRANT USAGE ON TYPE po_status TO cmms_userv3';
  END IF;
END
$$;

-- Pindahkan ownership object public ke user aplikasi
DO $$
DECLARE
  obj RECORD;
BEGIN
  FOR obj IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO cmms_userv3', obj.tablename);
  END LOOP;
END
$$;

DO $$
DECLARE
  seq RECORD;
BEGIN
  FOR seq IN
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO cmms_userv3', seq.sequence_name);
  END LOOP;
END
$$;

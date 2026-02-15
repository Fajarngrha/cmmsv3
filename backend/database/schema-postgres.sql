-- ============================================================
-- CMMS - Database Schema (PostgreSQL 14+)
-- Sesuai entitas di backend/src/data/mock.ts dan fitur aplikasi
-- ============================================================
-- Fitur yang didukung:
-- - Assets: health, uptime, installed_at (usia mesin), section
-- - Work Orders: section, created_at (filter Dashboard Period/Section), status, type
-- - Purchase Orders: tanggal (filter Dashboard Period), untuk History & Maintenance Cost
-- - Spare Parts: spec, for_machine
-- - Upcoming PM: asset_name (filter Dashboard Section), scheduled_date
-- Buat database dulu (sebagai superuser): createdb cmms_db
-- Lalu: psql -d cmms_db -f schema-postgres.sql

-- ------------------------------------------------------------
-- ENUM types
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE asset_health AS ENUM ('Running', 'Warning', 'Breakdown');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE wo_status AS ENUM ('PM', 'Open', 'Pending', 'In Progress', 'Completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE wo_type AS ENUM ('Corrective', 'PM', 'Inspection');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE po_kategori AS ENUM ('Preventive', 'Sparepart', 'Breakdown/Repair');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE po_status AS ENUM ('Tahap 1', 'Tahap 2', 'Tahap 3', 'Tahap 4', 'Tahap 5', 'Tahap 6', 'Tahap 7');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------
-- Tabel: assets
-- ------------------------------------------------------------
DROP TABLE IF EXISTS assets CASCADE;
CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  section VARCHAR(100) NOT NULL,
  health asset_health NOT NULL DEFAULT 'Running',
  last_pm_date DATE,
  next_pm_date DATE,
  uptime_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  installed_at DATE NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_assets_asset_id ON assets (asset_id);
CREATE INDEX idx_assets_section ON assets (section);
CREATE INDEX idx_assets_health ON assets (health);

COMMENT ON COLUMN assets.asset_id IS 'e.g. AST-001';
COMMENT ON COLUMN assets.installed_at IS 'Tanggal instalasi mesin (untuk hitung usia mesin)';

-- ------------------------------------------------------------
-- Tabel: work_orders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS work_orders CASCADE;
CREATE TABLE work_orders (
  id SERIAL PRIMARY KEY,
  wo_id VARCHAR(50) NOT NULL,
  machine_name VARCHAR(255) NOT NULL,
  machine_brand VARCHAR(100),
  section VARCHAR(100) NOT NULL,
  machine_status VARCHAR(50),
  damage_type TEXT NOT NULL,
  status wo_status NOT NULL DEFAULT 'Open',
  due_date DATE NOT NULL,
  reported_by VARCHAR(100) NOT NULL,
  technician VARCHAR(100),
  assigned VARCHAR(100),
  type wo_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  cause_of_damage TEXT,
  repairs_performed TEXT,
  action_type VARCHAR(50),
  replaced_spare_parts VARCHAR(500),
  replaced_parts_spec VARCHAR(255),
  replaced_parts_qty INTEGER,
  total_downtime_hours DECIMAL(10,2),
  pending_reason TEXT,
  pm_scheduled_date DATE
);

CREATE UNIQUE INDEX uq_work_orders_wo_id ON work_orders (wo_id);
CREATE INDEX idx_work_orders_status ON work_orders (status);
CREATE INDEX idx_work_orders_machine_name ON work_orders (machine_name);
CREATE INDEX idx_work_orders_created_at ON work_orders (created_at);
CREATE INDEX idx_work_orders_section ON work_orders (section);

COMMENT ON COLUMN work_orders.wo_id IS 'e.g. WO1032';

-- ------------------------------------------------------------
-- Tabel: spare_parts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS spare_parts CASCADE;
CREATE TABLE spare_parts (
  id SERIAL PRIMARY KEY,
  part_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
  location VARCHAR(100),
  spec VARCHAR(500),
  for_machine VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_spare_parts_part_code ON spare_parts (part_code);
CREATE INDEX idx_spare_parts_category ON spare_parts (category);

COMMENT ON COLUMN spare_parts.spec IS 'Spesifikasi part';
COMMENT ON COLUMN spare_parts.for_machine IS 'Untuk mesin';

-- ------------------------------------------------------------
-- Tabel: purchase_orders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS purchase_orders CASCADE;
CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  item_deskripsi VARCHAR(500) NOT NULL,
  model VARCHAR(255),
  harga_per_unit DECIMAL(18,2) NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 0,
  no_registrasi VARCHAR(50) NOT NULL,
  no_po VARCHAR(50),
  mesin VARCHAR(255),
  no_quotation VARCHAR(50),
  supplier VARCHAR(255),
  kategori po_kategori NOT NULL DEFAULT 'Sparepart',
  total_harga DECIMAL(18,2) NOT NULL DEFAULT 0,
  status po_status NOT NULL DEFAULT 'Tahap 1',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_purchase_orders_no_registrasi ON purchase_orders (no_registrasi);
CREATE INDEX idx_purchase_orders_tanggal ON purchase_orders (tanggal);
CREATE INDEX idx_purchase_orders_status ON purchase_orders (status);

COMMENT ON COLUMN purchase_orders.no_registrasi IS 'MTC/SPB/MM/YY/XXXX';
-- Jika enum po_status sudah ada (hanya 5 tahap), tambah Tahap 6 & 7:
-- ALTER TYPE po_status ADD VALUE 'Tahap 6';
-- ALTER TYPE po_status ADD VALUE 'Tahap 7';

-- ------------------------------------------------------------
-- Tabel: upcoming_pm
-- ------------------------------------------------------------
DROP TABLE IF EXISTS upcoming_pm CASCADE;
CREATE TABLE upcoming_pm (
  id SERIAL PRIMARY KEY,
  pm_id VARCHAR(50) NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  activity VARCHAR(255) NOT NULL,
  scheduled_date DATE NOT NULL,
  assigned_to VARCHAR(100) NOT NULL,
  asset_serial_number VARCHAR(100),
  asset_location VARCHAR(255),
  pm_type VARCHAR(50),
  pm_category VARCHAR(50),
  start_time TIME,
  end_time TIME,
  frequency VARCHAR(50),
  manpower INTEGER,
  shift_schedule VARCHAR(100),
  required_equipment TEXT,
  spare_parts_list TEXT,
  detailed_instructions TEXT,
  procedural_doc_link VARCHAR(500),
  priority VARCHAR(50),
  pm_status VARCHAR(50),
  approval_status VARCHAR(50),
  reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  warning_days INTEGER,
  special_notes TEXT,
  feedback TEXT,
  manager_approval VARCHAR(100),
  audit_trail TEXT,
  photo_urls TEXT,
  report_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_upcoming_pm_pm_id ON upcoming_pm (pm_id);
CREATE INDEX idx_upcoming_pm_scheduled_date ON upcoming_pm (scheduled_date);

COMMENT ON COLUMN upcoming_pm.pm_id IS 'e.g. PM2401';

-- ------------------------------------------------------------
-- Trigger: updated_at otomatis (assets, spare_parts, purchase_orders, upcoming_pm)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_spare_parts_updated_at
  BEFORE UPDATE ON spare_parts FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_upcoming_pm_updated_at
  BEFORE UPDATE ON upcoming_pm FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ------------------------------------------------------------
-- Catatan:
-- - Dashboard KPIs dihitung dari work_orders, assets, purchase_orders.
-- - maintenance_trend, pareto_downtime, dll. = agregasi via query/VIEW.
-- ------------------------------------------------------------

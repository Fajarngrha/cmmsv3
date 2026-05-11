-- Tambah field khusus asset kompresor di tabel assets
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS maker VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS model VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS flow_capacity DECIMAL(10,2) NULL;

COMMENT ON COLUMN assets.flow_capacity IS 'Kapasitas debit kompresor (m3/Min)';

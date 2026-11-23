-- Tambah kolom section pada spare_parts (inventory terpusat per area).
ALTER TABLE spare_parts
  ADD COLUMN IF NOT EXISTS section VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_spare_parts_section ON spare_parts (section);

COMMENT ON COLUMN spare_parts.section IS 'Section pemilik / pemakai part. Umum = stok bersama semua section.';

UPDATE spare_parts SET section = 'Umum' WHERE section IS NULL OR TRIM(section) = '';

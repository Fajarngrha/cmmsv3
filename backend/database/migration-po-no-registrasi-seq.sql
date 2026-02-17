-- ============================================================
-- Migration: Tabel counter no_registrasi PO (menghilangkan duplicate key)
-- Jalankan sekali pada DB yang sudah ada: psql -d cmms_dbv3 -f migration-po-no-registrasi-seq.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS po_no_registrasi_seq (
  prefix VARCHAR(20) PRIMARY KEY,
  next_val INTEGER NOT NULL DEFAULT 1
);
COMMENT ON TABLE po_no_registrasi_seq IS 'Nomor urut no_registrasi per prefix bulan/tahun';

-- Isi dari data purchase_orders yang sudah ada (agar nomor berikutnya tidak bentrok)
-- Format no_registrasi: MTC/SPB/MM/YY/XXXX → prefix 14 char (MTC/SPB/02/26/), nomor dari posisi 15
INSERT INTO po_no_registrasi_seq (prefix, next_val)
SELECT prefix, max_val + 1
FROM (
  SELECT
    substring(no_registrasi FROM 1 FOR 14) AS prefix,
    max(CAST(substring(no_registrasi FROM 15) AS INTEGER)) AS max_val
  FROM purchase_orders
  WHERE no_registrasi ~ '^MTC/SPB/\d{2}/\d{2}/\d+$'
  GROUP BY 1
) s
ON CONFLICT (prefix) DO UPDATE SET
  next_val = greatest(po_no_registrasi_seq.next_val, EXCLUDED.next_val);

#!/bin/bash
# ============================================================
# Perbaikan error duplicate no_registrasi (purchase_orders)
# Jalankan di VPS dari folder project: bash backend/database/fix-duplicate-no-registrasi.sh
# ============================================================
set -e
cd "$(dirname "$0")/../.."
ROOT="$(pwd)"
BACKEND="$ROOT/backend"
DB_NAME="${DB_NAME:-cmms_dbv3}"

echo "[1/5] Cek kode sumber pakai po_no_registrasi_seq..."
if ! grep -q 'po_no_registrasi_seq' "$BACKEND/src/routes/purchaseOrders.ts" 2>/dev/null; then
  echo "ERROR: Kode sumber belum pakai tabel counter. Pastikan git pull / kode terbaru sudah ada."
  exit 1
fi

echo "[2/5] Migration: buat tabel counter & isi dari purchase_orders..."
sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$BACKEND/database/migration-po-no-registrasi-seq.sql"

echo "[3/5] Grant hak akses..."
sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$BACKEND/database/grant-permissions-cmms_dbv3.sql" 2>/dev/null || true

echo "[4/5] Build backend..."
cd "$BACKEND"
npm run build

echo "[5/5] Cek file hasil build pakai po_no_registrasi_seq..."
if ! grep -q 'po_no_registrasi_seq' "$BACKEND/dist/routes/purchaseOrders.js" 2>/dev/null; then
  echo "WARNING: dist/routes/purchaseOrders.js tidak mengandung po_no_registrasi_seq. Build mungkin pakai kode lama. Hapus backend/dist lalu npm run build lagi."
fi

echo "Restart PM2..."
pm2 restart cmms-apiv3

echo "Selesai. Cek log: pm2 logs cmms-apiv3 --lines 25"

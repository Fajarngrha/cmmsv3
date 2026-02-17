#!/bin/bash
# ============================================================
# CMMS - Perbaikan permission denied (42501) di VPS
# ============================================================
# Jalankan di VPS dari folder project (yang berisi backend/):
#   chmod +x backend/database/fix-permissions.sh
#   ./backend/database/fix-permissions.sh
#
# Script ini: 1) baca user dari backend/.env  2) cetak perintah psql  3) Anda jalankan sebagai postgres

set -e
BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$BACKEND_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "File tidak ditemukan: $ENV_FILE"
  echo "Pastikan Anda di folder project yang berisi backend/.env"
  exit 1
fi

# Ambil user dari DATABASE_URL (postgresql://USER:...) atau DB_USER
DB_USER=""
if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
  # Parse postgresql://user:pass@host/...
  DB_USER=$(grep "^DATABASE_URL=" "$ENV_FILE" | sed -E 's|.*://([^:]+):.*|\1|')
elif grep -q "^DB_USER=" "$ENV_FILE"; then
  DB_USER=$(grep "^DB_USER=" "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$DB_USER" ]; then
  echo "Tidak ditemukan DB_USER atau DATABASE_URL di $ENV_FILE"
  exit 1
fi

echo "User dari .env: [$DB_USER]"
echo ""

if [ "$1" = "-y" ] || [ "$1" = "--yes" ]; then
  echo "Menjalankan grant sebagai postgres..."
  sudo -u postgres psql -d cmms_db -v ON_ERROR_STOP=1 <<SQL
GRANT USAGE ON SCHEMA public TO $DB_USER;
GRANT CREATE ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;
GRANT USAGE ON TYPE asset_health TO $DB_USER;
GRANT USAGE ON TYPE wo_status TO $DB_USER;
GRANT USAGE ON TYPE wo_type TO $DB_USER;
GRANT USAGE ON TYPE po_kategori TO $DB_USER;
GRANT USAGE ON TYPE po_status TO $DB_USER;
ALTER TABLE assets OWNER TO $DB_USER;
ALTER TABLE permintaan_perbaikan OWNER TO $DB_USER;
ALTER TABLE spare_parts OWNER TO $DB_USER;
ALTER TABLE spare_part_history OWNER TO $DB_USER;
ALTER TABLE purchase_orders OWNER TO $DB_USER;
ALTER TABLE upcoming_pm OWNER TO $DB_USER;
SQL
  echo "Selesai. Restart backend: pm2 restart cmms-apiv2"
else
  echo "Jalankan dengan -y untuk menerapkan grant otomatis:"
  echo "  ./backend/database/fix-permissions.sh -y"
  echo ""
  echo "Atau jalankan manual (copy-paste di VPS):"
  echo "  sudo -u postgres psql -d cmms_db -c \"ALTER TABLE permintaan_perbaikan OWNER TO $DB_USER;\""
  echo "  sudo -u postgres psql -d cmms_db -c \"GRANT ALL ON permintaan_perbaikan TO $DB_USER;\""
  echo "  (dan tabel lain: assets, spare_parts, spare_part_history, purchase_orders, upcoming_pm)"
fi

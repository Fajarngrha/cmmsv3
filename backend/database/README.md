# Database CMMS

**Go-live:** Backend tidak lagi menggunakan data mock. Semua data dibaca/tulis dari database. Wajib konfigurasi PostgreSQL dan jalankan skema (dan opsional seed) sebelum menjalankan backend.

## Persyaratan

- **PostgreSQL 14+** (disarankan)
- (Alternatif) MySQL 8 / MariaDB 10.5+ — gunakan `schema.sql` dan `seed.sql`

## Struktur

| File | Kegunaan |
|------|----------|
| **PostgreSQL** | |
| `schema-postgres.sql` | DDL: buat semua tabel + ENUM + trigger di PostgreSQL |
| `seed-postgres.sql` | Data awal (assets, WO, spare parts, PO, PM) |
| `grant-permissions-cmms_dbv3.sql` | Grant hak akses ke user cmms_userv3 (database cmms_dbv3) |
| **MySQL** | |
| `schema.sql` | DDL: buat database dan semua tabel |
| `seed.sql` | Data awal (MySQL) |

## Tabel

| Tabel | Keterangan singkat |
|-------|---------------------|
| `assets` | Mesin/aset (nama, section, health, last/next PM, **installed_at** untuk usia mesin) |
| `permintaan_perbaikan` | Permintaan perbaikan (WO); **section**, **created_at** dipakai filter Dashboard (Period/Section) |
| `spare_parts` | Spare part & stok (spec, for_machine) |
| `purchase_orders` | PO; **tanggal** dipakai filter Dashboard & fitur History banding harga supplier |
| `upcoming_pm` | Jadwal PM (**asset_name** dipakai filter Dashboard by section) |

Dashboard KPIs (downtime, maintenance cost, total WO, diagram trend/pareto) dihitung dari data di tabel di atas via query/API. Seed data diselaraskan dengan mock (section Die Casting, Line 1/2/3, tanggal 2026).

---

## PostgreSQL (disarankan)

### 1. Buat database & user (contoh: cmms_dbv3, cmms_userv3)

```bash
sudo -u postgres createuser -P cmms_userv3
sudo -u postgres createdb -O cmms_userv3 cmms_dbv3
```

Atau dari `psql`:

```sql
CREATE USER cmms_userv3 WITH PASSWORD 'your_password';
CREATE DATABASE cmms_dbv3 OWNER cmms_userv3;
\c cmms_dbv3
```

### 2. Jalankan skema

```bash
psql -d cmms_dbv3 -f backend/database/schema-postgres.sql
```

### 3. Grant hak akses (agar tidak error 42501)

```bash
sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f backend/database/grant-permissions-cmms_dbv3.sql
```

### 4. Isi data awal (opsional)

```bash
psql -d cmms_dbv3 -f backend/database/seed-postgres.sql
```

### Jika database sudah ada (hanya tambah kolom)

Jika tabel `assets` sudah ada tanpa kolom `installed_at`:

```sql
ALTER TABLE assets ADD COLUMN IF NOT EXISTS installed_at DATE NULL;
COMMENT ON COLUMN assets.installed_at IS 'Tanggal instalasi mesin (untuk hitung usia mesin)';
```

Jika tabel `upcoming_pm` sudah ada tanpa kolom keterangan:

```sql
ALTER TABLE upcoming_pm ADD COLUMN IF NOT EXISTS keterangan_status VARCHAR(50) NULL;
ALTER TABLE upcoming_pm ADD COLUMN IF NOT EXISTS keterangan_notes TEXT NULL;
```

Lalu isi ulang atau update seed sesuai kebutuhan.

### Koneksi dari Node.js

```bash
cd backend
npm install pg
```

Contoh variabel lingkungan (`.env` di folder `backend`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=cmms_userv3
DB_PASSWORD=your_password
DB_NAME=cmms_dbv3
```

Atau satu URL:

```env
DATABASE_URL=postgresql://cmms_userv3:your_password@localhost:5432/cmms_dbv3
```

---

## MySQL (alternatif)

### 1. Buat database dan tabel

```bash
mysql -u root -p < backend/database/schema.sql
```

### 2. Isi data awal (opsional)

```bash
mysql -u root -p < backend/database/seed.sql
```

Koneksi Node: `npm install mysql2`, gunakan `DATABASE_URL=mysql://...` atau `DB_HOST`, `DB_PORT=3306`, dll.

---

## Mapping ke mock & fitur aplikasi

- `WorkOrder` / Permintaan perbaikan → `permintaan_perbaikan` (section, created_at untuk filter Dashboard)
- `Asset` → `assets` (**installed_at** untuk hitung usia mesin di form/tabel/View)
- `SparePart` → `spare_parts` (spec, for_machine)
- `PurchaseOrder` → `purchase_orders` (tanggal untuk filter & History PO)
- `UpcomingPM` → `upcoming_pm` (asset_name untuk filter by section)

Response API bisa tetap mengembalikan format yang sama (camelCase) agar frontend tidak perlu diubah. Seed `seed-postgres.sql` mengikuti data mock terbaru (mesin 350T 4, section Die Casting/Line 1/2/3, tahun 2026).

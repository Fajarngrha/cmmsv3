# Database CMMS

Skema dan seed data untuk menggantikan data in-memory di `backend/src/data/mock.ts`.

## Persyaratan

- **PostgreSQL 14+** (disarankan)
- (Alternatif) MySQL 8 / MariaDB 10.5+ — gunakan `schema.sql` dan `seed.sql`

## Struktur

| File | Kegunaan |
|------|----------|
| **PostgreSQL** | |
| `schema-postgres.sql` | DDL: buat semua tabel + ENUM + trigger di PostgreSQL |
| `seed-postgres.sql` | Data awal (assets, WO, spare parts, PO, PM) |
| **MySQL** | |
| `schema.sql` | DDL: buat database `cmms_db` dan semua tabel |
| `seed.sql` | Data awal (MySQL) |

## Tabel

| Tabel | Keterangan singkat |
|-------|---------------------|
| `assets` | Mesin/aset (nama, section, health, last/next PM, **installed_at** untuk usia mesin) |
| `work_orders` | Work order (WO); **section**, **created_at** dipakai filter Dashboard (Period/Section) |
| `spare_parts` | Spare part & stok (spec, for_machine) |
| `purchase_orders` | PO; **tanggal** dipakai filter Dashboard & fitur History banding harga supplier |
| `upcoming_pm` | Jadwal PM (**asset_name** dipakai filter Dashboard by section) |

Dashboard KPIs (downtime, maintenance cost, total WO, diagram trend/pareto) dihitung dari data di tabel di atas via query/API. Seed data diselaraskan dengan mock (section Die Casting, Line 1/2/3, tanggal 2026).

---

## PostgreSQL (disarankan)

### 1. Buat database

```bash
createdb cmms_db
```

Atau dari `psql`:

```sql
CREATE DATABASE cmms_db;
\c cmms_db
```

### 2. Jalankan skema

```bash
psql -d cmms_db -f backend/database/schema-postgres.sql
```

### 3. Isi data awal (opsional)

```bash
psql -d cmms_db -f backend/database/seed-postgres.sql
```

### Jika database sudah ada (hanya tambah kolom)

Jika tabel `assets` sudah ada tanpa kolom `installed_at`:

```sql
ALTER TABLE assets ADD COLUMN IF NOT EXISTS installed_at DATE NULL;
COMMENT ON COLUMN assets.installed_at IS 'Tanggal instalasi mesin (untuk hitung usia mesin)';
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
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=cmms_db
```

Atau satu URL:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/cmms_db
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

- `WorkOrder` → `work_orders` (section, created_at untuk filter Dashboard)
- `Asset` → `assets` (**installed_at** untuk hitung usia mesin di form/tabel/View)
- `SparePart` → `spare_parts` (spec, for_machine)
- `PurchaseOrder` → `purchase_orders` (tanggal untuk filter & History PO)
- `UpcomingPM` → `upcoming_pm` (asset_name untuk filter by section)

Response API bisa tetap mengembalikan format yang sama (camelCase) agar frontend tidak perlu diubah. Seed `seed-postgres.sql` mengikuti data mock terbaru (mesin 350T 4, section Die Casting/Line 1/2/3, tahun 2026).

# Persiapan Release / Go-Live

Aplikasi CMMS siap go-live dengan **database PostgreSQL** (tidak menggunakan data mock).

## 1. Database PostgreSQL

- Install PostgreSQL 14+.
- Buat database: `createdb cmms_db`
- Jalankan skema:
  ```bash
  psql -d cmms_db -f backend/database/schema-postgres.sql
  ```
- (Opsional) Isi data awal:
  ```bash
  psql -d cmms_db -f backend/database/seed-postgres.sql
  ```

## 2. Backend

- Di folder `backend`, copy `.env.example` ke `.env`.
- Set koneksi database:
  - **Opsi A:** `DATABASE_URL=postgresql://user:password@host:5432/cmms_db`
  - **Opsi B:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Install & jalankan:
  ```bash
  cd backend
  npm install
  npm run build
  npm start
  ```
- Jika koneksi DB gagal, backend tidak akan start (exit 1).

## 3. Frontend

- Jika frontend dan backend **satu origin** (frontend dilayani dari Express `frontend/dist`): tidak perlu set env.
- Jika frontend di host/port lain (mis. development `npm run dev` ke backend di port 3001): buat `frontend/.env` dengan:
  ```env
  VITE_API_URL=http://localhost:3001
  ```
- Untuk production (frontend di domain lain): set `VITE_API_URL=https://api.domain.com` (tanpa trailing slash).
- Build frontend:
  ```bash
  cd frontend
  npm install
  npm run build
  ```
- Untuk production gabungan: taruh isi `frontend/dist` ke folder yang dilayani backend (atau set `STATIC_DIR` di backend), lalu jalankan backend; backend akan melayani SPA dari `/`.

## 4. Ringkasan alur data

| Layer     | Sumber data                    |
|----------|---------------------------------|
| Frontend | Memanggil API (`/api/...`)      |
| Backend  | Express; semua route pakai DB  |
| Database | PostgreSQL (tabel di `schema-postgres.sql`) |

Tidak ada mock: permintaan perbaikan, assets, inventory, purchase orders, upcoming PM, dan dashboard KPIs semua dari database.

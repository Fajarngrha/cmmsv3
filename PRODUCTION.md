# CMMS – Deploy Production (Frontend → Backend → Database)

Panduan singkat agar aplikasi CMMS bisa berjalan di production dengan koneksi **Frontend → Backend → PostgreSQL**.

---

## 1. Database (PostgreSQL)

1. **Install PostgreSQL** (jika belum), lalu buat database:
   ```bash
   createdb cmms_db
   ```

2. **Jalankan schema** dari folder project:
   ```bash
   cd CMMS/backend/database
   psql -d cmms_db -f schema-postgres.sql
   ```

3. **(Opsional)** Isi data awal:
   ```bash
   psql -d cmms_db -f seed-postgres.sql
   ```

---

## 2. Backend

1. **Salin env dan isi nilai**:
   ```bash
   cd CMMS/backend
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   # Opsional: port & host
   # PORT=3001
   # HOST=0.0.0.0

   # Pilih salah satu:

   # Opsi A: variabel terpisah
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=password_anda
   DB_NAME=cmms_db

   # Opsi B: satu URL
   # DATABASE_URL=postgresql://postgres:password_anda@localhost:5432/cmms_db
   ```
   Jika **tidak** ada `DATABASE_URL` atau `DB_*`, backend tetap jalan dengan **mock data** (tanpa database).

2. **Build & jalankan**:
   ```bash
   npm run build
   npm start
   ```
   Backend akan listen di `http://0.0.0.0:3001` (atau sesuai `PORT`/`HOST`).

---

## 3. Frontend (production)

### Opsi A: Frontend dilayani oleh Backend (satu server)

1. **Build frontend** dari root project:
   ```bash
   cd CMMS/frontend
   npm run build
   ```
   Output ada di `frontend/dist`.

2. **Pastikan backend membaca folder static**  
   Backend sudah dikonfigurasi untuk melayani `../../frontend/dist` jika folder itu ada. Jadi:
   - Setelah `frontend` di-build, jalankan backend dari `CMMS/backend`:
     ```bash
     cd CMMS/backend
     npm start
     ```
   - Buka **http://localhost:3001** — halaman utama dan semua request `/api/*` dilayani oleh backend yang sama. **Tidak perlu set `VITE_API_URL`.**

### Opsi B: Frontend di host/domain terpisah

Jika frontend di-deploy terpisah (mis. Vercel/Netlify) dan backend di server lain:

1. Buat file **`CMMS/frontend/.env.production`** (atau set env di platform):
   ```env
   VITE_API_URL=https://api.domain-anda.com
   ```
   Ganti dengan URL asli backend (tanpa trailing slash).

2. Build frontend:
   ```bash
   cd CMMS/frontend
   npm run build
   ```

3. Deploy folder `dist` ke hosting frontend. Semua request API akan mengarah ke `VITE_API_URL`.

4. **Backend:** pastikan CORS mengizinkan origin frontend (saat ini `cors()` tanpa option = allow all; untuk production bisa dibatasi origin).

---

## 4. Ringkasan alur production

| Langkah | Keterangan |
|--------|------------|
| PostgreSQL | Buat DB, jalankan `schema-postgres.sql` (dan optional `seed-postgres.sql`). |
| Backend `.env` | Set `DATABASE_URL` atau `DB_HOST`+`DB_USER`+`DB_PASSWORD`+`DB_NAME`. |
| Backend | `npm run build` lalu `npm start`. |
| Frontend | `npm run build` di folder `frontend`. |
| Satu server | Letakkan hasil build di path yang dilayani backend → akses lewat http://localhost:3001, tanpa `VITE_API_URL`. |
| Dua server | Set `VITE_API_URL` ke URL backend, build lagi, deploy `dist`. |

Dengan ini, **Frontend → Backend → Database** sudah terhubung untuk production (khusus fitur **Purchase Orders** saat ini memakai database; modul lain masih mock dan bisa diperluas dengan pola yang sama).

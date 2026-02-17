# Panduan Deploy Ulang (Setelah Ada Perubahan Kode)

Panduan ini untuk **update aplikasi CMMS di VPS** ketika ada perubahan kode (frontend/backend). Asumsi: VPS sudah pernah di-setup, database `cmms_dbv3` dan user `cmms_userv3` sudah ada, PM2 sudah menjalankan `cmms-apiv3`.

---

## Ringkasan alur

1. **Di komputer development:** build frontend + backend.
2. **Kirim kode ke VPS:** lewat Git atau upload manual.
3. **Di VPS:** install dependency (jika perlu), build backend, restart PM2.
4. **(Opsional)** Jika ada perubahan struktur database: jalankan skema/migration.
5. **Cek:** status PM2, log, dan akses lewat browser.

---

## Jika error duplicate no_registrasi (purchase_orders) masih muncul

**Penting:** Error itu hilang hanya jika (1) kode terbaru (yang pakai tabel `po_no_registrasi_seq`) sudah ada di server, dan (2) migration sudah dijalankan, lalu (3) backend di-build ulang dan PM2 di-restart.

### Opsi A – Skrip otomatis (disarankan)

Di VPS, dari **folder project** (mis. `/var/cmmsv3`):

```bash
cd /var/cmmsv3
git pull   # pastikan kode terbaru
bash backend/database/fix-duplicate-no-registrasi.sh
pm2 logs cmms-apiv3 --lines 25
```

Skrip akan: cek sumber pakai counter → jalankan migration → grant → build → cek dist pakai counter → restart PM2.

### Opsi B – Manual

```bash
cd /var/cmmsv3
git pull

sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f /var/cmmsv3/backend/database/migration-po-no-registrasi-seq.sql
sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f /var/cmmsv3/backend/database/grant-permissions-cmms_dbv3.sql

cd /var/cmmsv3/backend && npm run build
pm2 restart cmms-apiv3
```

**Verifikasi:** Setelah restart, di log tidak boleh ada peringatan `po_no_registrasi_seq`. Kalau masih error 23505, pastikan `backend/dist/routes/purchaseOrders.js` berisi string `po_no_registrasi_seq` (artinya build pakai kode baru). Kalau tidak ada, hapus `backend/dist` lalu `npm run build` lagi.

---

## 1. Di komputer development (setelah ubah kode)

### 1.1 Build frontend

```bash
cd CMMS/frontend
npm install
npm run build
```

Hasil build ada di `frontend/dist/`.

### 1.2 Build backend

```bash
cd CMMS/backend
npm install
npm run build
```

Hasil build ada di `backend/dist/`.

### 1.3 Commit (jika pakai Git)

```bash
cd CMMS
git add .
git commit -m "Update: deskripsi singkat perubahan"
git push origin main
```

Sesuaikan `main` dengan nama branch Anda.

---

## 2. Kirim kode ke VPS

### Opsi A — Git (disarankan)

Di VPS:

```bash
cd /var/cmmsv3
git pull origin main
```

Sesuaikan path (`/var/cmmsv3`) dan branch dengan setup Anda.

### Opsi B — Upload manual (tanpa Git)

- Zip folder project (minimal: `frontend/dist/`, `backend/dist/`, `backend/package.json`, `backend/package-lock.json`, `backend/ecosystem.config.cjs`, `backend/.env` jangan ikut jika rahasia — buat .env langsung di VPS).
- Upload ke VPS (SCP, SFTP, FileZilla, dll.).
- Extract di folder yang dipakai (mis. `/var/cmmsv3`), timpa file lama.

### Opsi C — Rsync (hanya file yang berubah)

Dari komputer development (ganti `user` dan `IP_VPS`):

```bash
cd CMMS
rsync -avz --exclude node_modules --exclude .env frontend/dist/ user@IP_VPS:/var/cmmsv3/frontend/dist/
rsync -avz --exclude node_modules --exclude .env backend/ user@IP_VPS:/var/cmmsv3/backend/
```

`.env` tidak ikut disinkron; pastikan sudah ada di VPS.

---

## 3. Di VPS — update & jalankan lagi

### 3.1 Masuk ke folder project

```bash
cd /var/cmmsv3
```

Sesuaikan path jika berbeda.

### 3.2 Backend: dependency & build

```bash
cd backend
npm install
npm run build
```

- `npm install` — wajib jika ada perubahan di `package.json` atau `package-lock.json`.
- `npm run build` — wajib agar perubahan kode TypeScript masuk ke `dist/`.

### 3.3 Restart aplikasi dengan PM2

```bash
pm2 restart cmms-apiv3
```

Atau jika pakai ecosystem:

```bash
pm2 restart ecosystem.config.cjs
```

### 3.4 Simpan daftar proses PM2 (opsional)

```bash
pm2 save
```

---

## 4. Jika ada perubahan database (schema/tabel)

Hanya perlu jika Anda mengubah:

- `backend/database/schema-postgres.sql`, atau  
- Menambah/mengubah tabel, kolom, atau ENUM.

### 4.1 Backup (disarankan)

```bash
sudo -u postgres pg_dump cmms_dbv3 > ~/backup_cmms_dbv3_$(date +%Y%m%d).sql
```

### 4.2 Jalankan skema atau migration

**Jika hanya tambah kolom/tabel baru** (baca isi skema dulu):

```bash
sudo -u postgres psql -d cmms_dbv3 -f /var/cmmsv3/backend/database/schema-postgres.sql
```

Perhatian: skema penuh biasanya berisi `DROP TABLE`; hanya jalankan jika memang ingin reset atau sudah ada skrip terpisah untuk ALTER saja.

**Jika ada skrip migration terpisah**, jalankan skrip itu ke `cmms_dbv3`.

Contoh: untuk perbaikan error duplicate `no_registrasi` pada Purchase Orders (tabel counter):

```bash
sudo -u postgres psql -d cmms_dbv3 -f /var/cmmsv3/backend/database/migration-po-no-registrasi-seq.sql
```

### 4.3 Grant ulang (setelah perubahan struktur)

```bash
sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f /var/cmmsv3/backend/database/grant-permissions-cmms_dbv3.sql
```

Lalu restart backend:

```bash
pm2 restart cmms-apiv3
```

---

## 5. Cek hasil deploy

### 5.1 Status proses

```bash
pm2 status
```

Pastikan `cmms-apiv3` berstatus **online**.

### 5.2 Log (error / startup)

```bash
pm2 logs cmms-apiv3 --lines 30
```

Pastikan ada:

- `Database: connected as cmms_userv3@cmms_dbv3`
- `CMMS API: http://localhost:3001`
- Tidak ada error 28P01 / 42501 di log.

### 5.3 Tes dari browser

- Buka: `http://IP_VPS:3001` (ganti `IP_VPS` dengan IP server).
- Cek halaman utama, login (jika ada), dan satu dua fitur utama (mis. Permintaan Perbaikan, Dashboard).

---

## Checklist singkat

| Langkah | Perintah / tindakan |
|--------|----------------------|
| 1. Build frontend | `cd frontend && npm run build` |
| 2. Build backend | `cd backend && npm run build` |
| 3. Kirim ke VPS | `git pull` atau upload/rsync |
| 4. Di VPS: backend | `cd backend && npm install && npm run build` |
| 5. Restart | `pm2 restart cmms-apiv3` |
| 6. Cek | `pm2 status` dan `pm2 logs cmms-apiv3` |

---

## Troubleshooting singkat

- **PM2 masih pakai kode lama:** pastikan `npm run build` di folder `backend` di VPS, lalu `pm2 restart cmms-apiv3`.
- **Error 28P01 (password):** cek `.env` di VPS (DATABASE_URL / DB_*) dan pastikan sama dengan user `cmms_userv3` di PostgreSQL.
- **Error 42501 (permission denied):** jalankan lagi `grant-permissions-cmms_dbv3.sql` ke database `cmms_dbv3`, lalu restart PM2.
- **Error duplicate no_registrasi (purchase_orders):** jalankan sekali migration `backend/database/migration-po-no-registrasi-seq.sql` ke `cmms_dbv3`, lalu grant ulang dan restart PM2.
- **Frontend tidak berubah:** pastikan `frontend/dist/` di VPS sudah di-overwrite dengan hasil build terbaru (dari git pull atau upload/rsync).

Dengan mengikuti panduan ini, setiap ada perubahan kode Anda bisa deploy ulang dengan konsisten dan mudah dicek.

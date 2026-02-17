# Cek koneksi DB di VPS (debug 42501)

## 1. Cek user/database yang dipakai backend

Setelah deploy + restart PM2, lihat log:

```bash
pm2 logs cmms-apiv2 --lines 30
```

Cari baris:
- `[db] Pool created for **user@database**`
- `Database: connected as **user@database**`

Harus muncul **cmms_userv2@cmms_dbv2**. Jika beda (mis. postgres@cmms_db), artinya backend pakai env yang salah.

## 2. Tes akses sebagai cmms_userv2 (dari server)

Jalankan di VPS (ganti PASSWORD dengan password dari .env):

```bash
PGPASSWORD='Acernitro5' psql -h localhost -p 5432 -U cmms_userv2 -d cmms_dbv2 -c "SELECT 1 FROM permintaan_perbaikan LIMIT 1;"
```

- Jika **sukses**: user dan DB benar, kemungkinan backend baca .env dari lokasi lain atau env tertimpa.
- Jika **permission denied**: ada masalah hak di DB (RLS, role, dll.).

## 3. Pastikan .env dipakai PM2

Cek working directory proses:

```bash
pm2 show cmms-apiv2
```

Lihat **exec cwd**. Harus mengarah ke folder yang berisi `backend/` atau ke `backend/` (tempat .env). Lalu cek isi .env:

```bash
cat /var/www/fid-cmmsv2/backend/.env | grep DATABASE_URL
```

Harus: `DATABASE_URL=postgresql://cmms_userv2:...@localhost:5432/cmms_dbv2`

## 4. Restart dengan env eksplisit (uji coba)

Hentikan, lalu jalankan dengan env dari file:

```bash
cd /var/www/fid-cmmsv2/backend
pm2 delete cmms-apiv2
pm2 start dist/index.js --name cmms-apiv2 --env-file .env
pm2 logs cmms-apiv2 --lines 20
```

Lihat lagi "connected as" — harus cmms_userv2@cmms_dbv2.

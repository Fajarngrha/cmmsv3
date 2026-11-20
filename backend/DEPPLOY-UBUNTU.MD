# Deploy CMMS ke Ubuntu + Domain Perusahaan

Panduan langkah demi langkah untuk go-live di server Ubuntu. Frontend React dan backend Express dijalankan **satu origin**: Nginx (HTTPS) → Node di `127.0.0.1:3001` → PostgreSQL.

Ganti placeholder berikut di seluruh dokumen:

| Placeholder | Nilai di server ini |
|-------------|---------------------|
| Domain | `cmms.perusahaan.com` (sesuai IT) |
| User Linux | `iot-svr` |
| Folder aplikasi | `~/sp/cmmsv3` (`/home/iot-svr/sp/cmmsv3`) |
| Database | `sp_db` |
| User PostgreSQL | `cmms_userv3` (kecuali Anda juga mengganti user) |
| `PASSWORD_DB` | Password PostgreSQL yang kuat |

---

## Arsitektur yang dipakai

```
Browser  →  https://cmms.perusahaan.com
                │
             Nginx :443 (SSL Let's Encrypt)
                │  reverse proxy
             Node/Express :3001 (hanya localhost)
                │  /api/*  +  file statis frontend/dist
             PostgreSQL :5432 (hanya localhost)
```

**Jangan** set `VITE_API_URL` saat build frontend. API dipanggil ke path `/api` di domain yang sama.

---

## 0. Yang harus siap sebelum mulai

Di sisi IT / DNS:

1. Domain (atau subdomain) sudah mengarah ke server:
   - **A record:** `cmms.perusahaan.com` → `IP_SERVER`
   - (Opsional) **A record:** `www.cmms.perusahaan.com` → `IP_SERVER`
2. Port **22** (SSH), **80**, dan **443** terbuka di firewall cloud / router.
3. Akses SSH: `ssh USER_SSH@IP_SERVER`
4. Kode sumber CMMS (Git, zip, atau rsync).

Cek DNS sudah benar (dari laptop):

```bash
nslookup cmms.perusahaan.com
# atau
ping cmms.perusahaan.com
```

Tunggu sampai jawaban IP sama dengan `IP_SERVER`. Sertifikat SSL gagal jika DNS belum nyambung.

---

## 1. Login SSH dan update Ubuntu

```bash
ssh USER_SSH@IP_SERVER

sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Asia/Jakarta
sudo apt install -y git curl ufw build-essential
```

Buat folder aplikasi:

```bash
sudo mkdir -p /var/www/cmmsv3
sudo chown "$USER:$USER" /var/www/cmmsv3
```

---

## 2. Firewall (UFW)

Buka hanya SSH + web. Port aplikasi **3001 tidak dibuka ke internet**.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 3. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # v20.x
npm -v
```

Process manager:

```bash
sudo npm install -g pm2
```

---

## 4. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
psql --version
```

### 4.1 Buat user dan database

```bash
sudo -u postgres psql
```

Di dalam `psql`:

```sql
CREATE USER cmms_userv3 WITH PASSWORD 'PASSWORD_DB';
CREATE DATABASE sp_db OWNER cmms_userv3;
\q
```

Kalau user sudah ada, cukup buat databasenya:

```sql
CREATE DATABASE sp_db OWNER cmms_userv3;
\q
```

### 4.2 Pastikan login password dari localhost aktif

Versi PostgreSQL di Ubuntu bisa 14, 16, atau 17. Cek folder:

```bash
ls /etc/postgresql
```

Edit `pg_hba.conf` (ganti `16` sesuai versi yang tampil di `ls`):

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Cari bagian `IPv4 local connections` / `IPv6 local connections` (biasanya di bagian bawah file).

**Jika baris ini belum ada:** tambahkan **dua baris baru** tepat di bawah komentar itu (jangan taruh di paling atas file):

```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256

# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256
```

Di nano: ketik barisnya, simpan dengan `Ctrl+O` → Enter, keluar dengan `Ctrl+X`.

**Jika baris `host ... 127.0.0.1/32` sudah ada** tapi method-nya `peer`, `ident`, `trust`, atau `md5`:

- `peer` / `ident` / `trust` → ganti method menjadi `scram-sha-256`
- `md5` → boleh dibiarkan, atau diganti `scram-sha-256` (keduanya menerima password)

Contoh salah (aplikasi gagal login dengan password):

```
host    all             all             127.0.0.1/32            peer
```

Contoh benar:

```
host    all             all             127.0.0.1/32            scram-sha-256
```

Jangan ubah baris `local ... peer` untuk user `postgres` (itu dipakai `sudo -u postgres psql`).

Restart agar perubahan berlaku:

```bash
sudo systemctl restart postgresql
```

Tes login dengan password (harus masuk, bukan error `28P01` / `no pg_hba.conf entry`):

```bash
PGPASSWORD='PASSWORD_DB' psql -h 127.0.0.1 -U cmms_userv3 -d sp_db -c 'SELECT current_user;'
```

---

## 5. Upload kode ke server

### Opsi A — Git (disarankan)

```bash
cd /var/www
rmdir cmmsv3 2>/dev/null || true
git clone URL_REPO_ANDA cmmsv3
cd /var/www/cmmsv3
```

Jika folder `cmmsv3` sudah ada dan kosong:

```bash
cd /var/www/cmmsv3
git clone URL_REPO_ANDA .
```

### Opsi B — Rsync dari Windows (PowerShell)

Dari komputer development (bukan di server):

```powershell
rsync -avz --exclude node_modules --exclude .git --exclude backend/.env --exclude frontend/dist --exclude backend/dist `
  "./" USER_SSH@IP_SERVER:/var/www/cmmsv3/
```

Atau zip project (tanpa `node_modules` dan tanpa `backend/.env`), upload, extract di `/var/www/cmmsv3`.

---

## 6. Schema, grant, seed database

Jalankan **setelah** kode sudah ada di server.

```bash
cd ~/sp/cmmsv3

sudo -u postgres psql -d sp_db -v ON_ERROR_STOP=1 -f backend/database/schema-postgres.sql
sudo -u postgres psql -d sp_db -v ON_ERROR_STOP=1 -f backend/database/grant-permissions-sp_db.sql
sudo -u postgres psql -d sp_db -v ON_ERROR_STOP=1 -f backend/database/migration-po-no-registrasi-seq.sql
sudo -u postgres psql -d sp_db -v ON_ERROR_STOP=1 -f backend/database/grant-permissions-sp_db.sql
```

Jika user PostgreSQL juga diganti (bukan `cmms_userv3`):

```bash
sudo -u postgres psql -d sp_db -v ON_ERROR_STOP=1 -v app_user=NAMA_USER \
  -f backend/database/grant-permissions-sp_db.sql
```

Data awal (opsional, untuk demo/uji):

```bash
sudo -u postgres psql -d sp_db -v ON_ERROR_STOP=1 -f backend/database/seed-postgres.sql
```

Tes koneksi:

```bash
PGPASSWORD='PASSWORD_DB' psql -h 127.0.0.1 -U cmms_userv3 -d sp_db -c '\dt'
```

Harus tampil daftar tabel (`assets`, `permintaan_perbaikan`, `purchase_orders`, dll.).

---

## 7. File `.env` backend (wajib)

```bash
cd ~/sp/cmmsv3/backend
cp .env.example .env
nano .env
```

Isi **produksi** (jangan salin `.env` dari laptop):

```env
NODE_ENV=production
PORT=3001
HOST=127.0.0.1

DB_HOST=localhost
DB_PORT=5432
DB_USER=cmms_userv3
DB_PASSWORD=PASSWORD_DB
DB_NAME=sp_db

JWT_SECRET=ganti_dengan_string_acak_minimal_32_karakter
JWT_EXPIRES_IN=12h

STATIC_DIR=/home/iot-svr/sp/cmmsv3/frontend/dist
```

Buat `JWT_SECRET` acak:

```bash
openssl rand -hex 32
```

Tempel hasilnya ke `JWT_SECRET`.

`HOST=127.0.0.1` membuat Node hanya menerima koneksi dari Nginx di server yang sama (lebih aman).

Hak akses file:

```bash
chmod 600 ~/sp/cmmsv3/backend/.env
```

---

## 8. Install dependency dan build

```bash
cd /var/www/cmmsv3
npm run install:all
npm run build
```

Hasil yang harus ada:

- `frontend/dist/index.html`
- `backend/dist/index.js`

Pastikan **tidak** ada `frontend/.env.production` berisi `VITE_API_URL`. Kalau file itu ada, hapus atau kosongkan nilainya, lalu build ulang frontend.

---

## 9. Jalankan API dengan PM2

```bash
cd /var/www/cmmsv3/backend
pm2 start dist/index.js --name cmms-apiv3
pm2 save
pm2 startup
```

Jalankan perintah yang dicetak `pm2 startup` (biasanya `sudo env PATH=... pm2 startup systemd -u USER_SSH --hp /home/USER_SSH`).

Cek:

```bash
pm2 status
pm2 logs cmms-apiv3 --lines 40
```

Log yang diharapkan:

- `Database: connected as cmms_userv3@cmms_dbv3`
- `CMMS API: http://localhost:3001`
- `Frontend static: dilayani dari /var/www/cmmsv3/frontend/dist`
- `[auth] Seed users synced: ...`

Tes lokal:

```bash
curl -s http://127.0.0.1:3001/api/health
# {"status":"ok"}
```

---

## 10. Nginx reverse proxy (domain internal / LAN)

Domain perusahaan yang hanya bisa dibuka dari jaringan kantor **tidak bisa** memakai Let's Encrypt (internet luar tidak bisa mencapai server). Pakai **HTTP di port 80**. Akses: `http://NAMA_DOMAIN`.

### 10.1 Perbaiki symlink rusak (error yang muncul di server)

Error `sites-enabled/cmms` *File exists* lalu *No such file* artinya tautan sudah ada, tetapi file aslinya di `sites-available` belum dibuat. Hapus tautan rusak dulu:

```bash
sudo rm -f /etc/nginx/sites-enabled/cmms
ls -l /etc/nginx/sites-enabled /etc/nginx/sites-available
```

### 10.2 Buat file konfigurasi

```bash
sudo apt install -y nginx
hostname -I
sudo nano /etc/nginx/sites-available/cmms
```

Isi (ganti `NAMA_DOMAIN` dengan domain internal dari IT, contoh `cmms.fid.local`):

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name NAMA_DOMAIN _;

    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

`default_server` membuat situs juga terbuka lewat IP LAN jika DNS belum siap.

Simpan: `Ctrl+O`, Enter, `Ctrl+X`.

### 10.3 Aktifkan dan nyalakan Nginx

```bash
sudo ln -sf /etc/nginx/sites-available/cmms /etc/nginx/sites-enabled/cmms
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager
```

`nginx -t` harus menulis `syntax is ok` dan `test is successful`.

### 10.4 Firewall LAN

```bash
sudo ufw allow 80/tcp
sudo ufw status
```

### 10.5 Tes dari server

Ganti domain dan IP sesuai hasil `hostname -I`:

```bash
curl -s http://127.0.0.1/api/health
curl -s -H "Host: NAMA_DOMAIN" http://127.0.0.1/api/health
```

Harus `{"status":"ok"}`. PM2 harus online (`pm2 status`).

Dari PC lain **di jaringan yang sama**, buka:

- `http://NAMA_DOMAIN`
- atau `http://IP_LAN_SERVER` (cadangan)

Jangan pakai `https://` kecuali IT sudah memasang sertifikat internal.

### 10.6 Syarat DNS internal

Minta IT: record A `NAMA_DOMAIN` mengarah ke **IP LAN server ini** (bukan IP publik). Cek dari PC kantor:

```bash
nslookup NAMA_DOMAIN
ping NAMA_DOMAIN
```

IP yang tampil harus sama dengan `hostname -I` di server.

---

## 11. HTTPS (hanya jika domain bisa diakses dari internet)

**Lewati langkah ini** untuk domain internal. `certbot` akan gagal karena Let's Encrypt tidak bisa menembus jaringan kantor.

Jika nanti IT memberi domain publik:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d cmms.perusahaan.com
```

Untuk HTTPS internal, minta sertifikat dari IT (CA perusahaan), jangan Let's Encrypt.

---

## 12. Login pertama

Saat backend start, akun seed ditulis ke tabel `app_users`:

| Username | Password awal | Role |
|----------|---------------|------|
| `adminmtn` | `Admin!#2026` | Admin |
| `spvmolding` | `Spv!#2026` | Supervisor |
| `spvdiecast` | `Spv!#2026` | Supervisor |
| `spvmtc` | `Spv!#2026` | Supervisor |
| `teknisi` | `teknisi123` | Technician |

**Penting keamanan:** fungsi seed saat ini menimpa hash password akun-akun di atas setiap kali proses Node di-restart. Setelah go-live, ubah password seed di `backend/src/auth.ts` (array `DEFAULT_AUTH_USERS`), build ulang, restart PM2 — atau matikan `ensureDefaultUsers()` jika Anda sudah mengelola user sendiri di database.

---

## 13. Checklist go-live

| # | Cek | Perintah / hasil |
|---|-----|------------------|
| 1 | DNS | `nslookup cmms.perusahaan.com` = IP server |
| 2 | Node & DB | `node -v`, `sudo systemctl status postgresql` |
| 3 | Tabel | `psql ... -c '\dt'` tidak kosong |
| 4 | `.env` | `JWT_SECRET` ≥ 16 karakter, password DB benar |
| 5 | Build | ada `frontend/dist` dan `backend/dist` |
| 6 | PM2 | `cmms-apiv3` **online** |
| 7 | Health | `curl http://127.0.0.1:3001/api/health` |
| 8 | HTTP | `http://cmms.perusahaan.com` redirect ke HTTPS |
| 9 | HTTPS | login di `https://cmms.perusahaan.com` |
| 10 | Firewall | hanya 22, 80, 443 |

---

## 14. Deploy ulang setelah ada perubahan kode

```bash
cd /var/www/cmmsv3
git pull
npm run install:all    # hanya jika package.json berubah
npm run build
pm2 restart cmms-apiv3
pm2 logs cmms-apiv3 --lines 30
```

Jika ada perubahan struktur database, backup dulu, lalu jalankan file SQL migration yang relevan, kemudian grant ulang:

```bash
sudo -u postgres pg_dump -Fc cmms_dbv3 -f /var/backups/cmms_dbv3_$(date +%Y%m%d).dump
sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f backend/database/<file-migration>.sql
sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f backend/database/grant-permissions-cmms_dbv3.sql
pm2 restart cmms-apiv3
```

---

## 15. Backup database berkala (disarankan)

```bash
sudo mkdir -p /var/backups/cmms
sudo nano /usr/local/bin/cmms-backup.sh
```

```bash
#!/bin/bash
set -euo pipefail
OUT="/var/backups/cmms/cmms_dbv3_$(date +%Y%m%d_%H%M).dump"
sudo -u postgres pg_dump -Fc cmms_dbv3 -f "$OUT"
find /var/backups/cmms -type f -mtime +14 -delete
```

```bash
sudo chmod +x /usr/local/bin/cmms-backup.sh
sudo crontab -e
```

Tambah baris (setiap hari jam 02:00):

```
0 2 * * * /usr/local/bin/cmms-backup.sh
```

---

## Troubleshooting

| Gejala | Penyebab umum | Perbaikan |
|--------|----------------|-----------|
| Certbot gagal | DNS belum ke IP server, port 80 tertutup | Cek A record, `sudo ufw status`, buka 80 di panel cloud |
| 502 Bad Gateway | PM2 mati / port salah | `pm2 status`, `curl http://127.0.0.1:3001/api/health` |
| Halaman putih | Frontend belum di-build | `ls frontend/dist`, `npm run build`, restart PM2 |
| API 401 terus | JWT / sesi | pastikan `JWT_SECRET` tidak berubah tiap restart |
| DB `28P01` | Password salah | samakan `.env` dengan `CREATE USER ... PASSWORD` |
| DB `42501` | Grant belum dijalankan | jalankan `grant-permissions-cmms_dbv3.sql` |
| Duplicate `no_registrasi` | Counter PO belum ada | jalankan `migration-po-no-registrasi-seq.sql` + grant |
| Timeout dari luar | Firewall cloud | buka 80/443 di security group VPS, bukan hanya UFW |

Log berguna:

```bash
pm2 logs cmms-apiv3
sudo tail -n 80 /var/log/nginx/error.log
sudo journalctl -u nginx -n 50
```

---

## Ringkasan urutan (cetak ini saat di server)

1. SSH → update Ubuntu → timezone Jakarta  
2. UFW: 22, 80, 443  
3. Node 20 + PM2  
4. PostgreSQL → user `cmms_userv3` + DB `cmms_dbv3`  
5. Clone/upload kode ke `/var/www/cmmsv3`  
6. Schema + grant + migration (+ seed opsional)  
7. `backend/.env` (DB, JWT, `HOST=127.0.0.1`, `STATIC_DIR`)  
8. `npm run install:all` → `npm run build`  
9. `pm2 start dist/index.js --name cmms-apiv3`  
10. Nginx proxy ke `:3001`  
11. `certbot --nginx -d cmms.perusahaan.com`  
12. Buka `https://cmms.perusahaan.com` dan login  

Setelah langkah 11 selesai, aplikasi siap dipakai di domain perusahaan.

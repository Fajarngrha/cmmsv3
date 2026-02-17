# Deploy CMMS ke VPS (Go-Live)

Panduan ini untuk menjalankan CMMS di VPS (Ubuntu/Debian): backend Node.js + PostgreSQL, frontend dilayani dari backend (satu aplikasi, satu port).

**Setelah VPS sudah jalan dan ada perubahan kode:** gunakan **[DEPLOY-ULANG.md](DEPLOY-ULANG.md)** untuk panduan update/deploy ulang.

---

## 1. Persyaratan VPS

- **OS:** Ubuntu 22.04 LTS atau Debian 11/12 (disarankan).
- **Spesifikasi minimal:** 1 vCPU, 1 GB RAM, 20 GB disk.
- **Akses:** SSH dengan user yang bisa `sudo`.
- **Domain (opsional):** Jika pakai domain (mis. `cmms.domain.com`), arahkan A record ke IP VPS.

---

## 2. Persiapan server (lewat SSH)

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 14+
sudo apt install -y postgresql postgresql-contrib

# (Opsional) Install PM2 untuk menjalankan backend agar tetap hidup & auto-restart
sudo npm install -g pm2
```

---

## 3. PostgreSQL: buat database & user

```bash
sudo -u postgres psql
```

Di dalam `psql`:

```sql
CREATE USER cmms_userv3 WITH PASSWORD 'ganti_dengan_password_kuat';
CREATE DATABASE cmms_dbv3 OWNER cmms_userv3;
\q
```

Aktifkan auth password (jika default hanya peer):

```bash
# Edit konfigurasi (biasanya sudah benar untuk localhost)
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Pastikan ada baris untuk koneksi local dengan md5 (atau scram-sha-256):

```
# TYPE  DATABASE        USER            ADDRESS         METHOD
local   all             all                                 peer
host    all             all             127.0.0.1/32    scram-sha-256
```

Lalu restart PostgreSQL:

```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

---

## 4. Upload project ke VPS

**Opsi A – Git (disarankan):**

```bash
cd /var/www   # atau folder pilihan Anda
sudo mkdir -p cmms
sudo chown $USER:$USER cmms
git clone <url-repo-anda> cmms
cd cmms/CMMS
```

**Opsi B – Upload manual (tanpa Git):**

- Zip project (folder `CMMS` berisi `frontend`, `backend`, `database`, dll.), upload ke VPS (mis. lewat SCP/SFTP).
- Extract di VPS, mis. di `/var/www/cmms/CMMS`.

---

## 5. Database: jalankan schema & seed

```bash
cd /var/www/cmms/CMMS   # sesuaikan path

# Skema (wajib)
sudo -u postgres psql -d cmms_dbv3 -f backend/database/schema-postgres.sql

# Grant hak akses ke user aplikasi (wajib agar tidak error 42501)
sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f backend/database/grant-permissions-cmms_dbv3.sql

# Seed data awal (opsional)
sudo -u postgres psql -d cmms_dbv3 -f backend/database/seed-postgres.sql
```

---

## 6. Konfigurasi Backend (.env)

```bash
cd /var/www/cmms/CMMS/backend
cp .env.example .env
nano .env
```

Isi `.env` (sesuaikan password dan path jika perlu):

```env
PORT=3001
HOST=0.0.0.0

# Gunakan user & database yang tadi dibuat
DATABASE_URL=postgresql://cmms_userv3:ganti_dengan_password_kuat@localhost:5432/cmms_dbv3

# Opsional: jika frontend sudah di-build dan ada di folder ini
# STATIC_DIR=/var/www/cmms/CMMS/frontend/dist
```

Simpan (Ctrl+O, Enter, Ctrl+X).

---

## 7. Build Frontend (tanpa VITE_API_URL = satu origin)

Agar frontend dan backend satu origin (frontend dilayani dari Express), **jangan** set `VITE_API_URL` saat build. Build dari mesin Anda atau dari VPS:

**Build di VPS:**

```bash
cd /var/www/cmms/CMMS/frontend
npm install
npm run build
```

Hasil build ada di `frontend/dist`. Backend akan otomatis melayani folder ini jika path-nya sesuai (lihat langkah 8).

---

## 8. Jalankan Backend (production)

Pastikan `STATIC_DIR` mengarah ke folder build frontend, atau biarkan default (relative ke `backend/dist`). Default di kode backend:

```text
STATIC_DIR = path.join(__dirname, '../../frontend/dist')
```

Artinya dari `backend/dist` naik dua tingkat lalu `frontend/dist`. Jika struktur di VPS seperti ini:

```text
/var/www/cmms/CMMS/
  backend/
  frontend/
    dist/   <- hasil npm run build
```

maka saat jalankan dari `CMMS/backend`, path default sudah benar.

**Jalankan dengan PM2 (disarankan):**

```bash
cd /var/www/cmms/CMMS/backend
npm install --production
npm run build
pm2 start dist/index.js --name cmms-apiv2
pm2 save
pm2 startup   # ikuti perintah yang muncul agar PM2 jalan lagi setelah reboot
```

Cek status:

```bash
pm2 status
pm2 logs cmms-api
```

Aplikasi (frontend + API) akan bisa diakses di: **http://IP_VPS:3001**

---

## 9. Firewall

Buka port 3001 (atau port yang dipakai) dan SSH (22):

```bash
sudo ufw allow 22
sudo ufw allow 3001
sudo ufw enable
sudo ufw status
```

Jika nanti pakai Nginx + SSL, buka 80 dan 443, dan bisa tutup 3001 dari internet (hanya localhost).

---

## 10. (Opsional) Nginx + SSL dengan domain

Jika Anda punya domain (mis. `cmms.domain.com`) dan ingin HTTPS:

**10.1 Install Nginx & Certbot**

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

**10.2 Arahkan domain ke IP VPS**

- Di pengelola DNS: buat **A record** `cmms.domain.com` → IP VPS.

**10.3 Buat konfigurasi Nginx**

```bash
sudo nano /etc/nginx/sites-available/cmms
```

Isi (ganti `cmms.domain.com`):

```nginx
server {
    listen 80;
    server_name cmms.domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan dan tes:

```bash
sudo ln -s /etc/nginx/sites-available/cmms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**10.4 Pasang SSL (HTTPS)**

```bash
sudo certbot --nginx -d cmms.domain.com
```

Ikuti petunjuk (email, setuju terms). Setelah selesai, akses aplikasi lewat **https://cmms.domain.com**.

**10.5 Firewall untuk Nginx**

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
# Opsional: tutup 3001 dari luar jika hanya lewat Nginx
# sudo ufw deny 3001
sudo ufw enable
```

---

## 11. Checklist singkat

| Langkah | Cek |
|--------|-----|
| Node.js & PostgreSQL terpasang | `node -v`, `psql --version` |
| Database `cmms_dbv3` & user `cmms_userv3` dibuat | `psql -d cmms_dbv3 -c '\dt'` |
| Schema & (opsional) seed dijalankan | Tabel tampil di `\dt` |
| Backend `.env` (DATABASE_URL / DB_*) | Benar, password sesuai |
| Frontend di-build tanpa VITE_API_URL | Ada folder `frontend/dist` |
| Backend jalan (PM2) | `pm2 status`, `pm2 logs cmms-api` |
| Firewall (3001 atau 80/443) | Bisa akses dari browser |
| (Opsional) Nginx + SSL | HTTPS dan redirect HTTP→HTTPS |

---

## 12. Troubleshooting singkat

- **502 Bad Gateway (Nginx):** Pastikan backend jalan: `pm2 status`, `pm2 restart cmms-api`.
- **Database connection failed:** Cek `DATABASE_URL` / `DB_*`, pastikan PostgreSQL jalan: `sudo systemctl status postgresql`, dan user/password benar.
- **Halaman kosong / 404 saat buka route React:** Pastikan Nginx (atau backend) mengarahkan semua path ke `index.html` (backend sudah handle `app.get('*', ...)` ke `index.html`).
- **API 404:** Pastikan request ke `/api/...` (bukan ke port frontend); kalau pakai Nginx, proxy ke `http://127.0.0.1:3001`.

Dengan mengikuti langkah di atas, CMMS Anda bisa go-live di VPS dengan backend + PostgreSQL, frontend dilayani dari backend (satu origin), dan opsional Nginx + SSL untuk domain.

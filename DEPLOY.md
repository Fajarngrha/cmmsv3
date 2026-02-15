# Tahapan Deploy CMMS ke VPS

Panduan deploy aplikasi CMMS (frontend React + backend Express + PostgreSQL) ke server/VPS.

---

## Ringkasan arsitektur

- **Frontend**: React (Vite), build menjadi file statis (HTML, JS, CSS).
- **Backend**: Node.js + Express, melayani API `/api/*` dan (opsional) file statis frontend.
- **Database**: PostgreSQL.
- **Produksi**: Satu port (mis. 3001); backend melayani API + static, atau Nginx reverse proxy.

---

## 1. Persyaratan VPS

- OS: Ubuntu 22.04 LTS (atau Debian/CentOS setara).
- Node.js 18+ (untuk menjalankan backend).
- PostgreSQL 14+ (untuk database).
- (Opsional) Nginx (untuk reverse proxy + HTTPS).

---

## 2. Persiapan server

### 2.1 Update sistem dan install Node.js

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # harus v18+
```

### 2.2 Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start pos

sudo systemctl enable postgresql
```

### 2.3 Buat database dan user

```bash
sudo -u postgres psql
```

Di `psql`:

```sql
CREATE USER cmms_user WITH PASSWORD 'ganti_password_kuat';
CREATE DATABASE cmms_db OWNER cmms_user;
\q
```

### 2.4 Jalankan skema dan seed

Di server, dari folder project (setelah kode di-upload):

```bash
cd /path/ke/CMMS
psql -U cmms_user -d cmms_db -h localhost -f backend/database/schema-postgres.sql
psql -U cmms_user -d cmms_db -h localhost -f backend/database/seed-postgres.sql
```

(Ganti `/path/ke/CMMS` dengan path sebenarnya, mis. `/var/www/cmms`.)

---

## 3. Upload kode ke VPS

Pilih salah satu:

- **Git**: `git clone <repo-url>` di server, atau push dari laptop lalu pull di server.
- **SCP/SFTP**: Upload folder project (tanpa `node_modules`) lalu jalankan `npm run install:all` di server.
- **CI/CD**: Build di runner, upload artifact (backend/dist + frontend/dist + package.json) ke server.

Contoh dengan Git:

```bash
cd /var/www
sudo git clone https://github.com/your-org/cmms.git
cd cmms
```

---

## 4. Build dan env

### 4.1 Install dependency

```bash
cd /var/www/cmms
npm run install:all
```

### 4.2 Build production

```bash
npm run build
```

Ini akan menghasilkan:

- `frontend/dist/` — file statis frontend.
- `backend/dist/` — JavaScript backend.

### 4.3 Variabel lingkungan (backend)

Buat file `.env` di folder **backend**:

```bash
cd /var/www/cmms/backend
nano .env
```

Isi contoh:

```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=cmms_user
DB_PASSWORD=ganti_password_kuat
DB_NAME=cmms_db
```

Atau satu URL:

```env
DATABASE_URL=postgresql://cmms_user:ganti_password_kuat@localhost:5432/cmms_db
```

**Penting:** Backend saat ini masih memakai data mock. Setelah Anda mengintegrasikan `pg`, pastikan backend membaca env di atas dan connect ke PostgreSQL. Sampai itu dilakukan, deploy tetap jalan dengan data in-memory.

### 4.4 Path static frontend (untuk satu port)

Agar backend melayani frontend build dari satu port (tanpa Nginx):

```env
STATIC_DIR=/var/www/cmms/frontend/dist
```

Jika **tidak** di-set: backend akan mencoba path default `backend/dist/../../frontend/dist` (berlaku bila Anda menjalankan dari folder project dan sudah `npm run build`). Di VPS sebaiknya pakai **path absolut** seperti di atas.

---

## 5. Menjalankan aplikasi

### 5.1 Langsung (uji coba)

```bash
cd /var/www/cmms/backend
node dist/index.js
```

Buka di browser: `http://IP_VPS:3001` (jika static di-set) atau hanya API di `http://IP_VPS:3001/api/health`.

### 5.2 Dengan PM2 (disarankan)

```bash
sudo npm install -g pm2
cd /var/www/cmms/backend
pm2 start dist/index.js --name cmms-api
pm2 save
pm2 startup
```

Cek: `pm2 status` dan `pm2 logs cmms-api`.

---

## 6. Nginx sebagai reverse proxy (opsional)

Berguna untuk: satu domain/port 80, dan nanti HTTPS (SSL).

### 6.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 6.2 Konfigurasi site

```bash
sudo nano /etc/nginx/sites-available/cmms
```

Isi (ganti `your-domain.com` dan path jika perlu):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/cmms/frontend/dist;
    index index.html;
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Aktifkan dan reload:

```bash
sudo ln -s /etc/nginx/sites-available/cmms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Akses: `http://your-domain.com` (frontend + API lewat `/api`).

### 6.3 HTTPS dengan Let's Encrypt (opsional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Ikuti petunjuk; Nginx akan dikonfigurasi otomatis untuk HTTPS.

---

## 7. Checklist ringkas

| Langkah | Perintah / tindakan |
|--------|----------------------|
| 1 | VPS siap (Node 18+, PostgreSQL 14+) |
| 2 | Buat DB + user, jalankan `schema-postgres.sql` dan `seed-postgres.sql` |
| 3 | Upload kode (git clone atau SCP) |
| 4 | `npm run install:all` lalu `npm run build` |
| 5 | Buat `backend/.env` (PORT, DB_* atau DATABASE_URL, optional STATIC_DIR) |
| 6 | Jalankan backend: `node backend/dist/index.js` atau PM2 |
| 7 | (Opsional) Nginx reverse proxy + SSL |

---

## 8. Setelah integrasi database (pg)

Saat backend sudah pakai `pg` dan membaca env:

1. Pastikan `.env` berisi `DB_*` atau `DATABASE_URL` yang benar.
2. Restart proses backend: `pm2 restart cmms-api`.
3. Cek log: `pm2 logs cmms-api` untuk memastikan koneksi DB sukses.

---

## 9. Troubleshooting singkat

- **502 Bad Gateway**: Backend tidak jalan atau port salah. Cek `pm2 status` dan `curl http://127.0.0.1:3001/api/health`.
- **Blank page / 404**: Pastikan `root` di Nginx mengarah ke `frontend/dist` dan `try_files` ada.
- **DB connection error**: Cek `.env`, user/password, serta `pg_hba.conf` (host `127.0.0.1` dengan method `md5` atau `scram-sha-256`).

Jika Anda mau, tahapan di atas bisa disesuaikan lagi (mis. pakai Docker atau path deploy yang spesifik).

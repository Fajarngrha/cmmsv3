# Panduan Migrasi CMMS dari VPS ke Raspberry Pi

Panduan ini menjelaskan langkah lengkap memindahkan aplikasi **FID Maintenance System (CMMS)** dari VPS ke server sendiri yang berjalan di **Raspberry Pi**, termasuk backup database, instalasi di Pi, dan konfigurasi jaringan.

---

## Ringkasan alur

| Tahap | Lokasi | Tindakan |
|-------|--------|----------|
| 1 | VPS | Backup database PostgreSQL + (opsional) backup file project |
| 2 | Raspberry Pi | Install OS, Node.js, PostgreSQL, PM2 |
| 3 | Raspberry Pi | Buat database & user, restore backup |
| 4 | Raspberry Pi | Clone/upload project, install dependency, build, konfigurasi .env |
| 5 | Raspberry Pi | Jalankan app dengan PM2, set auto-start |
| 6 | Jaringan | Port forwarding / akses LAN (dan opsional reverse proxy + SSL) |

---

## Persyaratan Raspberry Pi

- **Model:** Raspberry Pi 4 (2GB RAM minimal, 4GB/8GB lebih nyaman) atau Pi 5.
- **Storage:** Kartu microSD 32GB+ (Class 10/A2) atau SSD via USB untuk performa lebih baik.
- **OS:** Raspberry Pi OS (64-bit) disarankan.
- **Jaringan:** Koneksi internet untuk `git`/`npm`, dan akses dari komputer/laptop (Wi‑Fi atau ethernet).

---

## Bagian 1: Backup di VPS

### ⚠️ PENTING: Dimana menjalankan perintah backup?

**Perintah backup HARUS dijalankan di server (VPS atau Raspberry Pi) via SSH, BUKAN di PowerShell Windows!**

**Kenapa?**
- `sudo` adalah perintah Linux, tidak tersedia di Windows PowerShell
- `$(date +%Y%m%d)` adalah syntax bash/Linux, tidak bekerja di PowerShell
- PostgreSQL database ada di server, bukan di komputer lokal

**Langkah yang benar:**
1. **Masuk ke VPS/Raspberry Pi via SSH** (dari PowerShell Windows):
   ```powershell
   ssh user_vps@IP_VPS
   # atau
   ssh pi@raspberrypi.local
   ```

2. **Setelah masuk ke server**, baru jalankan perintah backup (lihat di bawah)

3. **Setelah backup selesai**, download file backup ke komputer lokal (lihat bagian 1.2)

---

### 1.1 Backup database PostgreSQL

**PENTING:** Jalankan perintah ini di **server (VPS/Raspberry Pi)** setelah masuk via SSH, bukan di PowerShell Windows!

Masuk ke VPS via SSH, lalu jalankan backup database. Anda bisa membuat backup dalam **2 format**: custom format (`.dump`) dan SQL plain (`.sql`).

#### Opsi 1: Backup format Custom (.dump) - Disarankan

Format ini lebih kecil ukurannya dan lebih cepat untuk restore, tapi tidak bisa dibaca langsung sebagai text.

```bash
# Gunakan ~postgres/ untuk home directory postgres user (bukan ~ yang mengarah ke /root)
sudo -u postgres pg_dump -Fc -U cmms_userv3 -d cmms_dbv3 -f ~postgres/cmms_dbv3_backup_$(date +%Y%m%d).dump
```

File backup akan ada di: `/var/lib/postgresql/cmms_dbv3_backup_YYYYMMDD.dump`

#### Opsi 2: Backup format SQL (.sql) - Plain Text

Format ini bisa dibaca langsung dengan text editor, lebih besar ukurannya, dan lebih universal (bisa digunakan di berbagai versi PostgreSQL).

```bash
# Backup format SQL plain
sudo -u postgres pg_dump -U cmms_userv3 -d cmms_dbv3 -f ~postgres/cmms_dbv3_backup_$(date +%Y%m%d).sql

# Atau dengan redirect (sama saja):
sudo -u postgres pg_dump -U cmms_userv3 cmms_dbv3 > ~postgres/cmms_dbv3_backup_$(date +%Y%m%d).sql
```

File backup akan ada di: `/var/lib/postgresql/cmms_dbv3_backup_YYYYMMDD.sql`

#### Opsi 3: Backup kedua format sekaligus (disarankan)

Untuk keamanan maksimal, buat backup dalam kedua format:

```bash
# Backup format custom (.dump)
sudo -u postgres pg_dump -Fc -U cmms_userv3 -d cmms_dbv3 -f ~postgres/cmms_dbv3_backup_$(date +%Y%m%d).dump

# Backup format SQL (.sql)
sudo -u postgres pg_dump -U cmms_userv3 -d cmms_dbv3 -f ~postgres/cmms_dbv3_backup_$(date +%Y%m%d).sql

# Verifikasi kedua file sudah dibuat
sudo -u postgres ls -lh ~postgres/cmms_dbv3_backup_$(date +%Y%m%d).*
```

#### Opsi 4: Backup dengan kompresi (untuk SQL)

Jika ingin menghemat space untuk format SQL:

```bash
# Backup SQL dengan kompresi gzip
sudo -u postgres pg_dump -U cmms_userv3 -d cmms_dbv3 | gzip > ~postgres/cmms_dbv3_backup_$(date +%Y%m%d).sql.gz

# Atau dengan bzip2 (lebih kecil, lebih lambat):
sudo -u postgres pg_dump -U cmms_userv3 -d cmms_dbv3 | bzip2 > ~postgres/cmms_dbv3_backup_$(date +%Y%m%d).sql.bz2
```

#### Opsi 5: Simpan di /tmp (untuk sementara, lalu pindahkan)

Jika ada masalah permission dengan home directory postgres:

```bash
# Backup format custom
sudo -u postgres pg_dump -Fc -U cmms_userv3 -d cmms_dbv3 -f /tmp/cmms_dbv3_backup_$(date +%Y%m%d).dump

# Backup format SQL
sudo -u postgres pg_dump -U cmms_userv3 -d cmms_dbv3 -f /tmp/cmms_dbv3_backup_$(date +%Y%m%d).sql

# Setelah backup selesai, pindahkan ke lokasi aman:
sudo mv /tmp/cmms_dbv3_backup_*.dump ~/
sudo mv /tmp/cmms_dbv3_backup_*.sql ~/
```

#### Perbandingan format backup

| Format | Ekstensi | Ukuran | Kecepatan | Bisa dibaca text? | Restore |
|--------|----------|--------|-----------|-------------------|---------|
| Custom | `.dump` | Lebih kecil | Lebih cepat | ❌ Tidak | `pg_restore` |
| SQL | `.sql` | Lebih besar | Lebih lambat | ✅ Ya | `psql` |
| SQL gzip | `.sql.gz` | Sedang | Sedang | ✅ Ya (setelah extract) | `gunzip \| psql` |

**Rekomendasi:** Buat backup dalam **kedua format** untuk keamanan maksimal.

### 1.2 Download backup ke komputer Anda

Dari **komputer Windows** (PowerShell) atau laptop:

**Download dari VPS:**

**Format perintah `scp`:**
```
scp [user]@[server]:[path_file_di_server] [lokasi_di_komputer_lokal]
```

**Contoh download:**

```powershell
# Download format SQL ke folder saat ini (titik = folder saat ini)
scp root@72.60.77.174:/var/lib/postgresql/cmms_dbv3_backup_20260308.sql .

# Download format custom (.dump) ke folder saat ini
scp root@72.60.77.174:/var/lib/postgresql/cmms_dbv3_backup_20260308.dump .

# Download ke folder tertentu (misalnya D:\Backups\)
scp root@72.60.77.174:/var/lib/postgresql/cmms_dbv3_backup_20260308.sql D:\Backups\

# Download ke folder dengan nama file baru
scp root@72.60.77.174:/var/lib/postgresql/cmms_dbv3_backup_20260308.sql .\backup_cmms.sql

# Download kedua format sekaligus (wildcard)
scp root@72.60.77.174:/var/lib/postgresql/cmms_dbv3_backup_20260308.* .
```

**Penjelasan:**
- `root@72.60.77.174` = user dan IP VPS Anda
- `:/var/lib/postgresql/cmms_dbv3_backup_20260308.sql` = path file di server
- `.` = download ke folder saat ini (folder yang terbuka di PowerShell)
- Atau bisa ganti `.` dengan path folder tertentu, misalnya `D:\Backups\`

**Jika file ada di home user (setelah dipindahkan dari postgres):**
```powershell
scp root@72.60.77.174:~/cmms_dbv3_backup_20260308.sql .
```

**Download dari Raspberry Pi:**

```powershell
# Download format custom (.dump)
scp pi@raspberrypi.local:~/cmms_dbv3_backup_20260308.dump .

# Download format SQL (.sql)
scp pi@raspberrypi.local:~/cmms_dbv3_backup_20260308.sql .

# Atau jika file ada di /tmp:
scp pi@raspberrypi.local:/tmp/cmms_dbv3_backup_20260308.dump .
scp pi@raspberrypi.local:/tmp/cmms_dbv3_backup_20260308.sql .
```

**Download kedua format sekaligus:**

```powershell
# Download semua file backup
scp user_vps@IP_VPS:/var/lib/postgresql/cmms_dbv3_backup_20260308.* .
```

Ganti `user_vps`, `IP_VPS`, dan tanggal (`20260308`) sesuai dengan file backup Anda.

### 1.2.1 Melihat dan memverifikasi file backup di komputer lokal

Setelah file backup didownload ke komputer lokal, Anda bisa melihat dan memverifikasinya:

**1. Melihat file di Windows Explorer:**

File backup biasanya tersimpan di folder tempat Anda menjalankan perintah `scp`. Biasanya di:
- `C:\Users\NAMA_USER\` (folder home)
- Atau folder yang Anda buka di PowerShell sebelum menjalankan `scp`

**Cara melihat:**
- Buka **File Explorer** (Windows + E)
- Navigasi ke folder tempat file backup
- Cari file dengan ekstensi `.dump` atau `.sql`
- Contoh: `cmms_dbv3_backup_20260308.dump`

**2. Verifikasi file backup (PowerShell):**

```powershell
# Lihat informasi file (ukuran, tanggal modifikasi)
Get-Item cmms_dbv3_backup_*.dump | Format-List Name, Length, LastWriteTime

# Atau lebih detail:
Get-ChildItem *.dump | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}, LastWriteTime
```

**3. Verifikasi isi backup (jika PostgreSQL terinstall di Windows):**

Jika Anda sudah install PostgreSQL di Windows, bisa melihat isi backup:

```powershell
# Lihat daftar tabel/objek dalam backup (format custom .dump)
pg_restore --list cmms_dbv3_backup_20260308.dump | Select-Object -First 50

# Lihat semua objek:
pg_restore --list cmms_dbv3_backup_20260308.dump > backup_contents.txt
notepad backup_contents.txt
```

**Untuk format SQL (.sql), bisa langsung buka dengan text editor:**
```powershell
# Buka dengan Notepad
notepad cmms_dbv3_backup_20260308.sql

# Atau dengan VS Code (jika terinstall)
code cmms_dbv3_backup_20260308.sql
```

**4. Cek integritas file backup:**

```powershell
# Cek apakah file tidak corrupt (untuk format custom .dump)
# File harus bisa dibaca oleh pg_restore --list
pg_restore --list cmms_dbv3_backup_20260308.dump 2>&1 | Select-Object -First 10

# Jika tidak ada error, file backup valid
```

**5. Menyimpan backup di lokasi aman:**

Setelah verifikasi, simpan backup di lokasi aman:

```powershell
# Buat folder untuk backup
New-Item -ItemType Directory -Path "D:\Backups\CMMS" -Force

# Copy file backup ke lokasi aman
Copy-Item cmms_dbv3_backup_*.dump -Destination "D:\Backups\CMMS\"

# Atau zip untuk menghemat space
Compress-Archive -Path cmms_dbv3_backup_*.dump -DestinationPath "D:\Backups\CMMS\cmms_backup_$(Get-Date -Format 'yyyyMMdd').zip"
```

**6. Catatan penting:**

- File backup format `.dump` (custom format) lebih kecil dan efisien, tapi tidak bisa dibaca langsung sebagai text
- File backup format `.sql` bisa dibaca dengan text editor, tapi lebih besar ukurannya
- Simpan backup di minimal 2 lokasi berbeda (hard drive lokal, cloud storage, dll.)
- Jangan hapus backup sampai yakin aplikasi di Raspberry Pi berjalan stabil

### 1.3 (Opsional) Backup kode dari VPS

Jika project di VPS tidak pakai Git, bisa zip dulu lalu download:

```bash
# Di VPS
cd /var/cmmsv3
zip -r ~/cmms_backup.zip . -x "node_modules/*" ".git/*"
```

Lalu dari PC: `scp user_vps@IP_VPS:~/cmms_backup.zip .`

---

## Bagian 2: Persiapan Raspberry Pi

### 2.1 Install Raspberry Pi OS

1. Flash **Raspberry Pi OS (64-bit)** ke microSD dengan [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
2. Saat konfigurasi (gear icon): set hostname, aktifkan SSH, set user/password, konfigurasi Wi‑Fi jika perlu.
3. Boot Pi, lalu sambung via SSH:

   ```bash
   ssh pi@raspberrypi.local
   ```

   (Ganti `pi` dan `raspberrypi` jika Anda ubah hostname.)

### 2.2 Update sistem

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 Install Node.js (LTS)

```bash
# Install Node.js 20.x LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x.x
npm -v
```

### 2.4 Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### 2.5 Buat user dan database di Pi

```bash
sudo -u postgres psql -c "CREATE USER cmms_userv3 WITH PASSWORD 'GANTI_PASSWORD_AMAN';"
sudo -u postgres psql -c "CREATE DATABASE cmms_dbv3 OWNER cmms_userv3;"
sudo -u postgres psql -c "GRANT CONNECT ON DATABASE cmms_dbv3 TO cmms_userv3;"
```

Ganti `GANTI_PASSWORD_AMAN` dengan password yang sama nanti Anda pakai di `.env` backend.

### 2.6 Restore backup database ke Pi

Upload file `.dump` dari komputer ke Pi (dari PC):

```powershell
scp cmms_dbv3_backup_20260221.dump pi@raspberrypi.local:~/ 
```

Di Raspberry Pi:

**PENTING:** Setelah upload, file backup ada di home directory user (mis. `/home/pi/` atau `/home/fajar/`). Saat menggunakan `sudo -u postgres`, jangan gunakan `~` karena akan mengarah ke home user yang menjalankan sudo, bukan postgres.

**Opsi 1 - Gunakan path absolut (disarankan):**
```bash
# Ganti /home/pi/ dengan path sesuai user Anda (bisa cek dengan: echo $HOME)
sudo -u postgres pg_restore -d cmms_dbv3 -U postgres --no-owner /home/pi/cmms_dbv3_backup_20260221.dump
```

**Opsi 2 - Pindahkan file ke lokasi yang bisa diakses postgres:**
```bash
# Pindahkan ke /tmp atau home postgres
sudo mv ~/cmms_dbv3_backup_20260221.dump /tmp/
sudo chmod 644 /tmp/cmms_dbv3_backup_20260221.dump
sudo -u postgres pg_restore -d cmms_dbv3 -U postgres --no-owner /tmp/cmms_dbv3_backup_20260221.dump
```

**Opsi 3 - Ubah permission file agar postgres bisa membaca:**
```bash
# Beri permission read untuk semua user
chmod 644 ~/cmms_dbv3_backup_20260221.dump
# Gunakan path absolut (bukan ~)
sudo -u postgres pg_restore -d cmms_dbv3 -U postgres --no-owner /home/pi/cmms_dbv3_backup_20260221.dump
```

Jika ada error "role cmms_userv3 does not exist", pastikan user sudah dibuat (langkah 2.5). Jika restore pakai `-U postgres`, setelah itu beri hak ke `cmms_userv3`:

```bash
sudo -u postgres psql -d cmms_dbv3 -f /path/ke/grant-permissions-cmms_dbv3.sql
```

**Jika backup Anda format .sql (plain):**
```bash
# Gunakan path absolut, bukan ~
sudo -u postgres psql -d cmms_dbv3 -f /home/pi/cmms_dbv3_backup_20260221.sql
```

Lalu jalankan grant permissions (setelah project di-clone):

```bash
cd /home/pi/cmmsv3
sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f backend/database/grant-permissions-cmms_dbv3.sql
```

### 2.7 Install PM2 (process manager)

```bash
sudo npm install -g pm2
pm2 startup
# Jalankan perintah yang dicetak PM2 (sudo ...) agar app jalan lagi setelah reboot
```

---

## Bagian 3: Deploy aplikasi di Raspberry Pi

### 3.1 Clone project (jika pakai Git)

```bash
cd /home/pi
git clone https://github.com/USERNAME/REPO.git cmmsv3
cd cmmsv3
```

Ganti `USERNAME/REPO` dengan URL repo Anda. Jika pakai branch tertentu:

```bash
git checkout master
```

### 3.2 Atau upload project (tanpa Git)

- Dari komputer, zip folder project (tanpa `node_modules`), lalu upload ke Pi lewat SCP/SFTP ke misalnya `/home/pi/cmmsv3`.
- Di Pi: `cd /home/pi/cmmsv3` lalu `unzip cmms_backup.zip` (atau extract manual).

### 3.3 Konfigurasi environment

```bash
cd /home/pi/cmmsv3/backend
cp .env.example .env
nano .env
```

Isi `.env` minimal:

```env
PORT=3001
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_USER=cmms_userv3
DB_PASSWORD=GANTI_PASSWORD_AMAN
DB_NAME=cmms_dbv3
```

Atau satu baris:

```env
DATABASE_URL=postgresql://cmms_userv3:GANTI_PASSWORD_AMAN@localhost:5432/cmms_dbv3
```

Simpan (Ctrl+O, Enter, Ctrl+X).

### 3.4 Build frontend & backend

**PENTING:** Pastikan file logo ada di `frontend/public/logo.png` sebelum build!

```bash
cd /home/pi/cmmsv3/frontend

# Pastikan logo ada di folder public
ls -la public/logo.png

# Install dependencies
npm install

# Build frontend
npm run build

# Verifikasi logo ter-copy ke dist setelah build
ls -la dist/logo.png

cd /home/pi/cmmsv3/backend
npm install
npm run build
```

**Jika logo hilang setelah build:**

1. **Cek apakah logo ada di `frontend/public/`:**
   ```bash
   ls -la /home/pi/cmmsv3/frontend/public/logo.png
   ```

2. **Jika tidak ada, copy dari source:**
   ```bash
   # Pastikan logo ada di source
   ls -la /home/pi/cmmsv3/frontend/src/logo.png
   
   # Copy ke public (jika ada di src)
   cp /home/pi/cmmsv3/frontend/src/logo.png /home/pi/cmmsv3/frontend/public/logo.png
   
   # Atau download dari repo/backup jika tidak ada
   ```

3. **Build ulang frontend:**
   ```bash
   cd /home/pi/cmmsv3/frontend
   rm -rf dist  # Hapus build lama
   npm run build
   
   # Verifikasi logo ada di dist
   ls -la dist/logo.png
   ```

4. **Restart aplikasi:**
   ```bash
   pm2 restart cmms-apiv3
   ```

### 3.5 Jalankan dengan PM2

```bash
cd /home/pi/cmmsv3/backend
pm2 start dist/index.js --name cmms-apiv3 --cwd /home/pi/cmmsv3/backend
pm2 save
pm2 status
pm2 logs cmms-apiv3 --lines 30
```

Pastikan log menampilkan: `Database: connected as cmms_userv3@cmms_dbv3` dan `CMMS API: http://localhost:3001`.

### 3.6 Cek dari Pi

```bash
curl -i http://127.0.0.1:3001/api/health
```

Harus mengembalikan HTTP 200 dan `{"status":"ok"}`.

---

## Bagian 4: Akses dari jaringan

### 4.1 Akses di LAN (Wi‑Fi / ethernet)

- Di komputer/laptop yang satu jaringan dengan Pi, buka browser:  
  `http://IP_RASPBERRY_PI:3001`  
  Contoh: `http://192.168.1.100:3001`
- Cari IP Pi: di Pi jalankan `hostname -I`.

### 4.2 Port forwarding (akses dari internet)

Jika ingin akses dari luar rumah/kantor:

1. Masuk ke panel **router** (admin router).
2. Buat aturan **Port Forwarding**: port eksternal **3001** → IP Raspberry Pi (mis. 192.168.1.100), port **3001** (TCP).
3. Set **IP tetap (DHCP reservation)** untuk Pi agar IP tidak berubah.
4. Dari luar, akses: `http://IP_PUBLIK_ANDA:3001`.

**Keamanan:** Expose port 3001 langsung ke internet punya risiko. Lebih aman pakai reverse proxy (Nginx) + HTTPS (mis. Let's Encrypt) atau VPN.

### 4.3 (Opsional) Nginx reverse proxy + HTTPS

Setup Nginx sebagai reverse proxy untuk mengakses aplikasi melalui port 80/443 dengan HTTPS (SSL).

#### 4.3.1 Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### 4.3.2 Konfigurasi Nginx untuk HTTP (reverse proxy)

Buat file konfigurasi:

```bash
sudo nano /etc/nginx/sites-available/cmms
```

**Jika Anda punya domain (mis. `cmms.example.com`):**
```nginx
server {
    listen 80;
    server_name cmms.example.com;

    # Logging
    access_log /var/log/nginx/cmms_access.log;
    error_log /var/log/nginx/cmms_error.log;

    # Proxy ke backend Node.js
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        
        # Headers untuk WebSocket (jika diperlukan)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass untuk WebSocket
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Jika tidak punya domain (pakai IP atau localhost):**
```nginx
server {
    listen 80;
    server_name _;  # Menerima semua hostname

    access_log /var/log/nginx/cmms_access.log;
    error_log /var/log/nginx/cmms_error.log;

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

Aktifkan konfigurasi:

```bash
# Buat symlink ke sites-enabled
sudo ln -s /etc/nginx/sites-available/cmms /etc/nginx/sites-enabled/

# Hapus default site (opsional)
sudo rm /etc/nginx/sites-enabled/default

# Test konfigurasi
sudo nginx -t

# Jika test berhasil, reload Nginx
sudo systemctl reload nginx
```

**Verifikasi:** Akses `http://IP_RASPBERRY_PI` atau `http://cmms.example.com` (jika sudah set DNS).

#### 4.3.3 Setup HTTPS dengan Let's Encrypt (SSL)

**Prasyarat:** Anda harus punya domain yang sudah mengarah ke IP Raspberry Pi (A record di DNS).

**1. Install Certbot:**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

**2. Arahkan domain ke IP Raspberry Pi:**

- Di pengelola DNS (mis. Cloudflare, Namecheap, dll.), buat **A record**:
  - Name: `cmms` (atau `@` untuk root domain)
  - Value: IP publik Raspberry Pi Anda
  - TTL: Auto atau 300

**3. Dapatkan sertifikat SSL:**

```bash
# Ganti cmms.example.com dengan domain Anda
sudo certbot --nginx -d cmms.example.com
```

Certbot akan:
- Meminta email untuk notifikasi
- Meminta persetujuan terms of service
- Otomatis mengkonfigurasi Nginx untuk HTTPS
- Setup auto-renewal

**4. Verifikasi HTTPS:**

Akses `https://cmms.example.com` - harus menampilkan gembok hijau (SSL valid).

**5. Auto-renewal SSL (sudah otomatis):**

Certbot sudah setup auto-renewal. Test dengan:

```bash
sudo certbot renew --dry-run
```

#### 4.3.4 Konfigurasi Firewall

Buka port 80 (HTTP) dan 443 (HTTPS):

```bash
# Jika pakai ufw
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
sudo ufw status

# Atau jika pakai iptables langsung
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

**Opsional:** Tutup port 3001 dari internet (hanya akses via localhost):

```bash
# Di ufw, port 3001 hanya untuk localhost (tidak perlu allow dari luar)
# Atau di router, jangan forward port 3001
```

#### 4.3.5 Port Forwarding di Router (jika pakai domain)

Jika Raspberry Pi di belakang router dan pakai domain:

1. Masuk ke panel router
2. Setup **Port Forwarding**:
   - Port eksternal **80** → IP Raspberry Pi, port **80** (TCP)
   - Port eksternal **443** → IP Raspberry Pi, port **443** (TCP)
3. Set **IP tetap (DHCP reservation)** untuk Raspberry Pi

#### 4.3.6 Troubleshooting Nginx

**Cek status Nginx:**
```bash
sudo systemctl status nginx
sudo nginx -t
```

**Cek log error:**
```bash
sudo tail -f /var/log/nginx/cmms_error.log
sudo tail -f /var/log/nginx/error.log
```

**Restart Nginx:**
```bash
sudo systemctl restart nginx
```

**Cek apakah backend berjalan:**
```bash
pm2 status
curl http://127.0.0.1:3001/api/health
```

**Error umum:**
- **502 Bad Gateway:** Backend tidak berjalan atau port 3001 tidak accessible. Pastikan `pm2 status` menunjukkan aplikasi online.
- **SSL certificate error:** Pastikan domain sudah mengarah ke IP yang benar, dan sertifikat sudah di-renew: `sudo certbot renew`
- **Connection refused:** Cek firewall dan pastikan port 80/443 terbuka.

---

## Bagian 5: Checklist & troubleshooting

### Checklist singkat

- [ ] Backup database dari VPS dan download ke PC
- [ ] Raspberry Pi OS terpasang, update, SSH aktif
- [ ] Node.js 20.x, PostgreSQL, PM2 terinstall
- [ ] User `cmms_userv3` dan database `cmms_dbv3` ada di Pi
- [ ] Restore backup ke `cmms_dbv3`, jalankan grant permissions
- [ ] Project ada di Pi (`/home/pi/cmmsv3` atau path pilihan)
- [ ] `backend/.env` berisi kredensial database yang benar
- [ ] Frontend & backend sudah `npm run build`
- [ ] PM2 menjalankan `dist/index.js`, `pm2 save` dan `pm2 startup` sudah dijalankan
- [ ] `curl http://127.0.0.1:3001/api/health` mengembalikan 200
- [ ] Dari browser (LAN): `http://IP_PI:3001` bisa buka aplikasi

### Troubleshooting

| Masalah | Kemungkinan penyebab | Solusi |
|--------|----------------------|--------|
| `Connection refused` port 3001 | App belum jalan atau crash | `pm2 status`, `pm2 logs cmms-apiv3`, perbaiki .env/DB lalu `pm2 restart cmms-apiv3` |
| Database connection failed | Password/user/database salah | Cek `backend/.env`, tes: `psql -h localhost -U cmms_userv3 -d cmms_dbv3 -c "SELECT 1"` |
| 42501 permission denied | Grant belum dijalankan | `sudo -u postgres psql -d cmms_dbv3 -f backend/database/grant-permissions-cmms_dbv3.sql` |
| Frontend 404 / blank | Path static salah | Pastikan `frontend/dist` ada dan PM2 `cwd` = folder yang berisi `backend` dan `frontend` |
| **Logo hilang** | File logo tidak ter-copy saat build | Pastikan `frontend/public/logo.png` ada, lalu `cd frontend && rm -rf dist && npm run build && ls -la dist/logo.png`, lalu `pm2 restart cmms-apiv3` |
| Pi lambat | RAM kecil / SD card lambat | Kurangi beban; pertimbangkan Pi 4 4GB+ dan jalankan dari SSD |

### Perintah berguna

```bash
# Restart aplikasi
pm2 restart cmms-apiv3

# Lihat log
pm2 logs cmms-apiv3

# Cek penggunaan resource
pm2 monit

# Cek port 3001
ss -tulpn | grep 3001
```

---

## Bagian 6: Menghentikan aplikasi di VPS (setelah migrasi berhasil)

Setelah memastikan aplikasi di Raspberry Pi berjalan dengan baik dan semua data sudah ter-migrasi, Anda bisa menghentikan aplikasi di VPS untuk menghemat resource atau sebelum menghentikan layanan VPS.

### 6.1 Backup terakhir (disarankan)

Sebelum menghentikan, lakukan backup terakhir sebagai cadangan:

```bash
# Backup database
sudo -u postgres pg_dump -Fc -U cmms_userv3 -d cmms_dbv3 -f ~postgres/cmms_dbv3_final_backup_$(date +%Y%m%d).dump

# Backup kode (opsional)
cd /var/cmmsv3  # atau path project Anda
tar -czf ~/cmmsv3_final_backup_$(date +%Y%m%d).tar.gz --exclude='node_modules' --exclude='.git' .
```

### 6.2 Menghentikan aplikasi PM2

**Stop aplikasi (tetap tersimpan di PM2):**
```bash
pm2 stop cmms-apiv3
pm2 status  # Verifikasi status menjadi "stopped"
```

**Atau hapus dari PM2 (jika tidak akan digunakan lagi):**
```bash
pm2 delete cmms-apiv3
pm2 save  # Update konfigurasi PM2
```

**Hapus PM2 dari auto-start (jika sudah setup sebelumnya):**
```bash
# Cek apakah PM2 sudah di-setup untuk auto-start
pm2 startup

# Jika sudah, hapus dengan:
pm2 unstartup
```

### 6.3 Menghentikan Nginx (jika digunakan)

**Stop Nginx:**
```bash
sudo systemctl stop nginx
sudo systemctl status nginx  # Verifikasi status
```

**Disable Nginx dari auto-start (jika tidak akan digunakan lagi):**
```bash
sudo systemctl disable nginx
```

**Hapus konfigurasi Nginx (opsional):**
```bash
# Hapus symlink
sudo rm /etc/nginx/sites-enabled/cmms

# Hapus file konfigurasi (opsional)
sudo rm /etc/nginx/sites-available/cmms

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 6.4 Menutup port di firewall (opsional)

Jika tidak akan menggunakan aplikasi lagi di VPS:

```bash
# Tutup port 3001 (jika tidak digunakan lagi)
sudo ufw delete allow 3001

# Tutup port 80 dan 443 (jika Nginx tidak digunakan)
sudo ufw delete allow 80/tcp
sudo ufw delete allow 443/tcp

# Cek status firewall
sudo ufw status
```

### 6.5 Verifikasi aplikasi sudah berhenti

```bash
# Cek PM2 - tidak ada aplikasi cmms-apiv3
pm2 list

# Cek port 3001 - tidak ada yang listening
sudo ss -tulpn | grep 3001

# Cek Nginx - tidak berjalan
sudo systemctl status nginx
```

### 6.6 Opsi: Hapus aplikasi sepenuhnya (jika yakin tidak akan digunakan lagi)

**Hapus folder project:**
```bash
# Backup dulu jika belum!
sudo rm -rf /var/cmmsv3  # atau path project Anda
```

**Hapus database (HATI-HATI! Pastikan backup sudah aman):**
```bash
# Backup dulu!
sudo -u postgres psql -c "DROP DATABASE cmms_dbv3;"
sudo -u postgres psql -c "DROP USER cmms_userv3;"
```

**Hapus PM2 (jika tidak digunakan untuk aplikasi lain):**
```bash
sudo npm uninstall -g pm2
```

### 6.7 Checklist sebelum menghentikan VPS

- [ ] Backup database terakhir sudah dibuat dan didownload
- [ ] Backup kode sudah dibuat (jika perlu)
- [ ] Aplikasi di Raspberry Pi sudah berjalan dengan baik
- [ ] Semua fitur sudah ditest di Raspberry Pi
- [ ] PM2 sudah di-stop atau di-delete
- [ ] Nginx sudah di-stop (jika digunakan)
- [ ] Port firewall sudah ditutup (jika perlu)
- [ ] Backup sudah disimpan di tempat aman (minimal 2 lokasi berbeda)

### 6.8 Catatan penting

- **Jangan hapus backup** sampai yakin aplikasi di Raspberry Pi berjalan stabil minimal 1-2 minggu
- **Simpan backup** di minimal 2 lokasi berbeda (cloud storage, hard drive eksternal, dll.)
- Jika masih dalam masa trial di Raspberry Pi, **biarkan VPS tetap berjalan** sebagai backup sementara
- Setelah yakin semua berjalan baik, baru hentikan atau hapus layanan VPS

---

## Ringkasan perbedaan VPS vs Raspberry Pi

| Aspek | VPS | Raspberry Pi |
|-------|-----|----------------|
| IP | IP publik tetap | IP lokal (LAN); perlu port forward untuk akses luar |
| Performa | Biasanya lebih tinggi | Terbatas (pilih Pi 4 4GB+ dan SSD) |
| Biaya | Bulanan/tahunan | Sekali beli + listrik kecil |
| Kontrol | Shared/dedicated | Full control di lokasi Anda |
| Backup | Di sisi provider | Anda wajib backup sendiri (database + kode) |

Setelah migrasi berhasil, Anda bisa hentikan layanan CMMS di VPS (setelah yakin data dan fitur di Pi sudah berjalan baik). Simpan backup database dan kode minimal satu salinan di tempat aman.

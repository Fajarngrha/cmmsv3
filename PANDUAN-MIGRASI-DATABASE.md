# Panduan Migrasi Database CMMS

Dokumen ini menjelaskan cara menjalankan dan menambah **migrasi database** untuk CMMS (PostgreSQL). Gunakan migrasi ketika **database sudah berjalan** dan Anda ingin menambah tabel/kolom tanpa menghapus data yang ada.

---

## 1. Kapan pakai migrasi?

| Situasi | Yang dipakai |
|--------|----------------|
| **Database baru** (instalasi pertama) | `schema-postgres.sql` + grant + (opsional) seed |
| **Database sudah ada**, tambah fitur (tabel/kolom baru) | File di `backend/database/migrations/` |
| **Ubah grant** setelah tambah tabel | `grant-permissions-cmms_dbv3.sql` (versi terbaru) |

**Jangan** jalankan ulang `schema-postgres.sql` pada database production yang sudah berisi data: skema itu memakai `DROP TABLE` dan akan menghapus semua data.

---

## 2. Lokasi file

```
backend/database/
├── schema-postgres.sql          # Skema lengkap (untuk DB baru)
├── seed-postgres.sql            # Data awal (opsional)
├── grant-permissions-cmms_dbv3.sql   # Grant ke user cmms_userv3
└── migrations/                  # (kosong di v1; migrasi tambahan untuk v2 dst.)
```

Migrasi diberi nama berurut: `001_...`, `002_...`, dan seterusnya. Jalankan **sesuai urutan nomor** jika ada ketergantungan.

---

## 3. Menjalankan migrasi

### Prasyarat

- PostgreSQL 14+ sudah terpasang.
- Database target (mis. `cmms_dbv3`) dan user (mis. `cmms_userv3`) sudah ada.
- Anda punya akses ke `psql` (biasanya sebagai user `postgres` atau user pemilik database).

### Langkah umum

1. **Backup** (disarankan untuk production):
   ```bash
   pg_dump -d cmms_dbv3 -F c -f backup_cmms_$(date +%Y%m%d).dump
   ```

2. **Jalankan file migrasi** (satu per satu, sesuai urutan):
   ```bash
   cd /path/ke/proyek/CMMS
   psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f backend/database/migrations/NNN_nama_fitur.sql
   ```
   - `-v ON_ERROR_STOP=1` membuat psql berhenti jika ada error.
   - Ganti `cmms_dbv3` dan nama file migrasi sesuai kebutuhan.

3. **Update grant** agar user aplikasi punya akses ke tabel/sequence baru:
   ```bash
   sudo -u postgres psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f backend/database/grant-permissions-cmms_dbv3.sql
   ```

4. **Restart aplikasi** (mis. PM2):
   ```bash
   pm2 restart cmms-apiv2
   ```

Di Windows tanpa `sudo`, jalankan `psql` dan `grant-permissions-cmms_dbv3.sql` dengan user yang punya hak owner/SUPERUSER ke database tersebut.

---

## 4. Daftar migrasi yang ada

Di **v1** belum ada file migrasi di `migrations/`. Semua tabel ada di `schema-postgres.sql`. Untuk v2 dan seterusnya, tambahkan file `001_...`, `002_...` sesuai fitur baru.

---

## 5. Memastikan migrasi sukses

Setelah menjalankan migrasi, cek bahwa tabel/kolom baru ada dan user punya akses:

```sql
-- Masuk: psql -d cmms_dbv3
\dt
```

Jika backend mengeluarkan error **42501 (permission denied)**, jalankan lagi `grant-permissions-cmms_dbv3.sql` dan pastikan di dalamnya ada baris untuk tabel/sequence baru.

---

## 6. Menambah migrasi baru

Saat ada fitur baru yang mengubah struktur database:

1. **Buat file baru** di `backend/database/migrations/` dengan nama berurut:
   - `002_nama_fitur.sql`
   - Gunakan `CREATE TABLE IF NOT EXISTS` atau `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` agar aman dijalankan ulang.

2. **Isi file** dengan DDL (CREATE/ALTER) saja. Contoh pola:
   ```sql
   -- ============================================================
   -- Migrasi: 002_nama_fitur
   -- Deskripsi singkat.
   -- Jalankan: psql -d cmms_dbv3 -v ON_ERROR_STOP=1 -f backend/database/migrations/002_nama_fitur.sql
   -- ============================================================

   CREATE TABLE IF NOT EXISTS nama_tabel (
     id SERIAL PRIMARY KEY,
     ...
   );

   CREATE INDEX IF NOT EXISTS idx_nama_tabel_... ON nama_tabel (...);
   ```

3. **Update grant**: tambahkan di `grant-permissions-cmms_dbv3.sql`:
   - `ALTER TABLE nama_tabel OWNER TO cmms_userv3;`
   - `ALTER SEQUENCE nama_tabel_id_seq OWNER TO cmms_userv3;`
   (dan tabel/sequence lain yang Anda buat.)

4. **Tulis di panduan ini**: tambah baris di **§4. Daftar migrasi** dengan nomor file dan isi migrasi.

---

## 7. Ringkasan singkat

| Tujuan | Perintah / file |
|--------|------------------|
| Database baru dari nol | `schema-postgres.sql` → grant → (opsional) seed |
| Tambah fitur (tabel baru) | Buat `migrations/NNN_nama.sql` → jalankan → grant |
| Setelah tambah tabel apa pun | Jalankan ulang `grant-permissions-cmms_dbv3.sql` |
| Cek koneksi & tabel | `psql -d cmms_dbv3 -c "\dt"` |

Untuk panduan instalasi database pertama kali dan koneksi dari aplikasi, lihat **backend/database/README.md**.

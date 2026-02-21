# Panduan Keseluruhan Sistem — FID Maintenance System (CMMS)

Dokumen ini menjelaskan framework, backend, frontend, database, serta arsitektur dan alur sistem web **FID Maintenance System** (CMMS).

---

## 1. Ringkasan Sistem

**FID Maintenance System** adalah aplikasi web untuk mengelola maintenance (perbaikan mesin, aset, spare part, purchase order, dan preventive maintenance). Sistem terdiri atas:

- **Frontend:** aplikasi single-page (SPA) yang diakses lewat browser.
- **Backend:** API REST yang melayani data dan logika bisnis.
- **Database:** penyimpanan data utama (PostgreSQL).

**Mode deploy:** Frontend dapat dilayani dari backend (satu origin, satu port) atau dipisah (frontend dan backend di domain/port berbeda).

---

## 2. Tech Stack

| Lapisan    | Teknologi | Versi / Keterangan |
|-----------|-----------|---------------------|
| **Frontend** | React | 18.x |
| | React Router | 6.x (routing SPA) |
| | Vite | 5.x (build tool & dev server) |
| | TypeScript | 5.x |
| | Recharts | 2.x (grafik Dashboard) |
| **Backend** | Node.js | 20 LTS (disarankan) |
| | Express | 4.x (HTTP server & API) |
| | TypeScript | 5.x (dikompilasi ke JavaScript) |
| | pg (node-postgres) | 8.x (driver PostgreSQL) |
| | dotenv | 17.x (variabel lingkungan) |
| | cors | 2.x (CORS) |
| **Database** | PostgreSQL | 14+ |
| **Runtime / Process** | PM2 | (opsional, production) |

---

## 3. Arsitektur Sistem

### 3.1 Gambar arsitektur (high-level)

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                     BROWSER (User)                        │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                        HTTP (HTML/JS/CSS + API /api/*)
                                                │
                    ┌───────────────────────────▼─────────────────────────────┐
                    │              BACKEND (Node.js + Express)                   │
                    │  ┌─────────────────────────────────────────────────────┐ │
                    │  │  Port: 3001 (default)                               │ │
                    │  │  • Express app                                      │ │
                    │  │  • /api/*  → REST API (JSON)                         │ │
                    │  │  • /*      → static frontend (frontend/dist)         │ │
                    │  └─────────────────────────────────────────────────────┘ │
                    │                           │                               │
                    │  ┌────────────────────────▼─────────────────────────────┐ │
                    │  │  db/index.ts  (connection pool, query)                │ │
                    │  └────────────────────────┬─────────────────────────────┘ │
                    └──────────────────────────│───────────────────────────────┘
                                               │
                                    SQL (pg driver)
                                               │
                    ┌──────────────────────────▼─────────────────────────────┐
                    │              PostgreSQL (cmms_dbv3)                     │
                    │  • assets, permintaan_perbaikan, spare_parts,           │
                    │    spare_part_history, purchase_orders, upcoming_pm      │
                    └────────────────────────────────────────────────────────┘
```

### 3.2 Alur request (ringkas)

1. **User** membuka URL (mis. `http://server:3001/dashboard`).
2. **Backend** mengirim `index.html` + aset frontend (JS/CSS) dari `frontend/dist` (jika mode satu origin).
3. **Browser** menjalankan React; React Router menampilkan halaman sesuai path.
4. **Frontend** memanggil API lewat `fetch(apiUrl('/api/...'))` (GET/POST/PATCH/DELETE).
5. **Backend** menerima request di route Express (`/api/permintaan-perbaikan`, `/api/assets`, dll.), memanggil `query()` ke PostgreSQL, mengembalikan JSON.
6. **Frontend** memperbarui state dan tampilan sesuai response.

### 3.3 Development vs production

| Aspek | Development | Production (contoh) |
|-------|-------------|----------------------|
| Frontend | Vite dev server (port 5173), proxy `/api` → 3001 | Build `npm run build` → `frontend/dist` dilayani oleh Express |
| Backend | `npm run dev` (tsx watch) di port 3001 | `node dist/index.js` (biasanya dengan PM2) |
| API base URL | Kosong (proxy) atau `http://localhost:3001` | Kosong (satu origin) atau `VITE_API_URL` jika frontend/backend dipisah |
| Database | PostgreSQL lokal / dev | PostgreSQL di server (mis. cmms_dbv3, user cmms_userv3) |

---

## 4. Struktur Folder & Modul

### 4.1 Root project

```
CMMS/
├── frontend/          # Aplikasi React (SPA)
├── backend/           # API Express + koneksi DB
├── backend/database/  # Skema & skrip SQL (schema, seed, grant)
├── PANDUAN-SISTEM.md  # Dokumen ini
├── DEPLOY-VPS.md      # Panduan deploy ke VPS
├── DEPLOY-ULANG.md    # Panduan deploy ulang setelah ubah kode
└── POSTMAN-API-TEST.md # Panduan test API dengan Postman
```

### 4.2 Frontend (`frontend/`)

| Path | Fungsi |
|------|--------|
| `src/main.tsx` | Entry point; render `<App />` dengan `BrowserRouter` |
| `src/App.tsx` | Definisi `Routes` (/, /dashboard, /permintaan-perbaikan, /assets, /inventory, /tracking-po, /preventive-maintenance) |
| `src/api.ts` | Helper `apiUrl()` untuk base URL API (menggunakan `VITE_API_URL` jika ada) |
| `src/components/` | Layout, sidebar, header, modal (create/view permintaan, asset, PO, PM, spare part, issue) |
| `src/pages/` | Halaman: Dashboard, PermintaanPerbaikan, Assets, Inventory, TrackingPO, PreventiveMaintenance |
| `src/utils/` | exportToCsv, poStatus, assetAge, dll. |
| `src/index.css` | Gaya global |
| `vite.config.ts` | Konfigurasi Vite (plugin React, proxy /api ke backend) |

### 4.3 Backend (`backend/`)

| Path | Fungsi |
|------|--------|
| `src/index.ts` | Load .env, buat Express app, mount route `/api`, layani static `frontend/dist`, cek koneksi DB lalu listen |
| `src/db/index.ts` | Pool PostgreSQL, `query()`, `getPool()`, `getConnectionInfo()` |
| `src/db/mappers.ts` | Mapping baris DB (snake_case) → respons API (camelCase): work order, asset, spare part, PO, upcoming PM |
| `src/routes/` | Route handler: permintaanPerbaikan, assets, inventory, purchaseOrders, dashboard |
| `src/data/mock.ts` | Hanya re-export tipe (tidak pakai data mock lagi) |
| `dist/` | Hasil build TypeScript (dijalankan di production) |
| `.env` | Konfigurasi (DATABASE_URL atau DB_*, PORT, HOST) |
| `database/` | schema-postgres.sql, seed-postgres.sql, grant-permissions-*.sql, fix-permissions.sh |

### 4.4 Database (`backend/database/`)

| File | Fungsi |
|------|--------|
| `schema-postgres.sql` | DDL: ENUM, tabel assets, permintaan_perbaikan, spare_parts, spare_part_history, purchase_orders, upcoming_pm, trigger, indeks |
| `seed-postgres.sql` | Data awal (opsional) |
| `grant-permissions-cmms_dbv3.sql` | Grant hak akses untuk user cmms_userv3 (agar tidak error 42501) |
| `fix-permissions.sh` | Script baca user/database dari .env dan jalankan grant (Linux) |

---

## 5. Arsitektur Flow (Detail)

### 5.1 Alur buat Permintaan Perbaikan (contoh)

1. User buka **Permintaan Perbaikan** → frontend fetch `GET /api/permintaan-perbaikan` → backend `query('SELECT * FROM permintaan_perbaikan ...')` → JSON ke client.
2. User klik **Tambah** → modal form → submit **POST /api/permintaan-perbaikan** dengan body (machineName, section, damageDescription, dll.).
3. Backend hitung `wo_id` (ReqXXXX), insert ke `permintaan_perbaikan`, return 201 + data.
4. Frontend refresh list atau tambah ke state.

### 5.2 Alur Dashboard (filter & KPI)

1. User buka **Dashboard** (dengan query `?period=2026-02&section=Die Casting`).
2. Frontend fetch paralel: `/api/dashboard/kpis`, `/api/dashboard/upcoming-pm`, `/api/permintaan-perbaikan`, `/api/purchase-orders`, `/api/assets`.
3. Frontend filter di memori: WO menurut period + section, PO menurut period, PM menurut section; hitung total WO, downtime, maintenance cost dari data yang sudah difilter.
4. Tampilkan kartu KPI, grafik trend/pie, tabel upcoming PM.

### 5.3 Alur Purchase Order (no_registrasi unik)

1. User buat PO baru → **POST /api/purchase-orders**.
2. Backend: ambil client dari pool → **BEGIN** → **LOCK TABLE purchase_orders IN EXCLUSIVE MODE** → SELECT no_registrasi dengan prefix bulan/tahun → hitung max+1 → **INSERT** dengan no_registrasi baru → **COMMIT** → release client.
3. Dengan lock, dua request bersamaan tidak akan dapat nomor yang sama; duplicate key 23505 dihindari.

---

## 6. Database (PostgreSQL)

### 6.1 Ringkasan tabel

| Tabel | Keterangan singkat |
|-------|---------------------|
| **assets** | Mesin/aset (asset_id, name, section, health, last/next PM, uptime, installed_at) |
| **permintaan_perbaikan** | Work order perbaikan (wo_id, mesin, section, status, type, created_at, dll.) |
| **spare_parts** | Spare part (part_code, name, category, stock, min_stock, unit, spec, for_machine) |
| **spare_part_history** | Riwayat in/out spare part (part_id, type, qty, reason, pic) |
| **purchase_orders** | PO (no_registrasi unik, tanggal, item, harga, qty, status tahap 1–7) |
| **upcoming_pm** | Jadwal preventive maintenance (pm_id, asset_name, activity, scheduled_date, assigned_to) |

### 6.2 ENUM types

- `asset_health`: Running, Warning, Breakdown  
- `wo_status`: PM, Open, Pending, In Progress, Completed  
- `wo_type`: Corrective, PM, Inspection  
- `po_kategori`: Preventive, Sparepart, Breakdown/Repair  
- `po_status`: Tahap 1 … Tahap 7  

### 6.3 Koneksi dari backend

- Konfigurasi: **DATABASE_URL** (contoh: `postgresql://cmms_userv3:password@localhost:5432/cmms_dbv3`) atau **DB_HOST**, **DB_PORT**, **DB_USER**, **DB_PASSWORD**, **DB_NAME**.
- Backend memakai **connection pool** (pg.Pool); setiap route memanggil `query()` yang memakai pool tersebut.

---

## 7. API (REST) — Ringkasan

Semua endpoint di bawah prefix **/api**, method GET/POST/PATCH/DELETE, body JSON bila ada.

| Modul | Endpoint utama | Keterangan |
|-------|----------------|------------|
| Health | GET /api/health | Cek API hidup |
| Permintaan Perbaikan | GET/POST /api/permintaan-perbaikan, GET/PATCH/DELETE /api/permintaan-perbaikan/:id | CRUD work order |
| Assets | GET/POST /api/assets, POST /api/assets/import, DELETE /api/assets/:id | CRUD + import asset |
| Inventory | GET/POST /api/inventory/spare-parts, POST import, GET history, PATCH issue/receive | Spare part + stok in/out |
| Purchase Orders | GET/POST /api/purchase-orders, GET/PATCH/DELETE /api/purchase-orders/:id | CRUD PO |
| Dashboard | GET /api/dashboard/kpis, trend, pareto, upcoming-pm, wo-status, asset-health; PATCH/DELETE upcoming-pm; POST pm-schedule | KPI & jadwal PM |

Detail lengkap dan contoh body ada di **POSTMAN-API-TEST.md** dan file koleksi Postman.

---

## 8. Deployment (ringkas)

- **Server:** Node.js + PostgreSQL terpasang; backend jalan dengan PM2 (`ecosystem.config.cjs`), load `.env` dari folder backend.
- **Database:** Buat user (cmms_userv3) dan database (cmms_dbv3), jalankan schema-postgres.sql, lalu grant-permissions-cmms_dbv3.sql.
- **Build:** Frontend `npm run build` → `frontend/dist`; backend `npm run build` → `backend/dist`.
- **Layanan:** Satu proses Node (Express) melayani `/api` dan static file dari `frontend/dist`; satu port (mis. 3001). Opsional: Nginx di depan untuk reverse proxy dan SSL.

Panduan langkah demi langkah: **DEPLOY-VPS.md**. Deploy ulang setelah ubah kode: **DEPLOY-ULANG.md**.

---

## 9. Diagram flow (Mermaid) — opsional

```mermaid
flowchart LR
  subgraph Client
    A[Browser]
  end
  subgraph Server
    B[Express]
    C[Routes /api]
    D[db/query]
  end
  subgraph DB
    E[(PostgreSQL)]
  end
  A -->|HTTP| B
  B --> C
  C --> D
  D -->|SQL| E
  E --> D
  D --> C
  C --> B
  B -->|JSON/HTML| A
```

```mermaid
flowchart TB
  subgraph Frontend
    F[React SPA]
    G[Pages]
    H[Components]
    I[apiUrl + fetch]
  end
  subgraph Backend
    J[Express]
    K[/api/*]
    L[db pool]
  end
  subgraph Database
    M[(PostgreSQL)]
  end
  F --> G
  G --> H
  H --> I
  I -->|REST| K
  K --> J
  J --> L
  L --> M
```

---

## 10. Update Selanjutnya / Next Version (Roadmap)

Bagian ini berisi usulan fitur dan perbaikan yang dapat dikembangkan pada versi berikutnya.

### 10.1 Keamanan & Pengguna

| Prioritas | Fitur | Keterangan |
|-----------|--------|-------------|
| Tinggi | **Login & autentikasi** | Login dengan username/password; session atau JWT; logout. |
| Tinggi | **Role & wewenang** | Role (Admin, Maintenance, Viewer, dll.); batasi akses API dan menu berdasarkan role. |
| Sedang | **Manajemen user** | CRUD user (nama, email, role); ganti password; nonaktifkan user. |
| Sedang | **Audit log** | Catat siapa mengubah apa dan kapan (permintaan perbaikan, PO, asset) untuk keperluan audit. |

### 10.2 Fitur Operasional

| Prioritas | Fitur | Keterangan |
|-----------|--------|-------------|
| Tinggi | **Notifikasi & reminder** | Notif PO tahap berikutnya, PM mendatang, WO overdue; bisa email atau in-app. (Rencana: v2.) |
| Sedang | **Lampiran/upload file** | Upload foto atau dokumen pada permintaan perbaikan atau PO (simpan path/file di DB + storage). |
| Sedang | **Approval workflow** | Alur persetujuan PO atau WO (submit → approve/reject) dengan status dan history. |
| Sedang | **Filter & pencarian lanjutan** | Filter tanggal range, multi-section, full-text search pada WO/PO/asset. |
| Rendah | **Dashboard konfigurasi** | Pilihan KPI yang ditampilkan; simpan preferensi filter per user. |

### 10.3 Laporan & Analitik

| Prioritas | Fitur | Keterangan |
|-----------|--------|-------------|
| Tinggi | **Laporan PDF/Excel** | Export laporan WO, PO, maintenance cost, atau KPI ke PDF/Excel dengan template. |
| Sedang | **Laporan terjadwal** | Jadwal kirim laporan (mis. mingguan) ke email tertentu. |
| Sedang | **Grafik & trend lanjutan** | Grafik per section, per mesin, MTTR/MTBF jika data mendukung. |

### 10.4 Teknis & Kualitas

| Prioritas | Fitur | Keterangan |
|-----------|--------|-------------|
| Tinggi | **Testing** | Unit test (backend: route/db); integration test API; e2e test frontend (Playwright/Cypress). |
| Sedang | **Validasi & error handling** | Validasi input di backend (mis. dengan Zod/Joi); pesan error yang konsisten dan aman. |
| Sedang | **Logging terstruktur** | Log request/response atau error ke file/ layanan (mis. Winston) untuk debugging dan monitoring. |
| Rendah | **API versioning** | Prefix `/api/v1/` agar ke depan bisa ada v2 tanpa breaking change. |

### 10.5 Pengalaman Pengguna & Ketersediaan

| Prioritas | Fitur | Keterangan |
|-----------|--------|-------------|
| Sedang | **Responsive & aksesibilitas** | Pastikan layout dan form nyaman di tablet/HP; dasar a11y (label, fokus, kontras). |
| Sedang | **Loading & feedback** | Skeleton/loading state saat fetch; toast/snackbar untuk sukses/gagal aksi. |
| Rendah | **PWA / offline dasar** | Service worker agar halaman utama atau daftar bisa di-cache untuk akses offline terbatas. |

### 10.6 Sumber daya yang dibutuhkan

- **Backend:** library auth (mis. JWT + bcrypt), upload file (multer), scheduler (node-cron atau job queue), validasi (Zod/Joi).
- **Frontend:** state management jika makin kompleks (Context API atau Zustand), komponen form (React Hook Form), chart/export (tambah library sesuai laporan).
- **Database:** tabel `users`, `roles`, `audit_log`, kolom lampiran di tabel yang relevan; migrasi (mis. node-pg-migrate atau skrip SQL berurut).
- **Infra:** cron atau worker untuk job terjadwal; penyimpanan file (local atau S3-compatible) jika ada upload.

---

Dokumen ini memuat panduan keseluruhan sistem: framework (React, Express, Vite, TypeScript), backend (Node.js + Express + pg), frontend (React + Vite + React Router), database (PostgreSQL), serta arsitektur dan alur sistem. Untuk langkah deploy dan test API, gunakan **DEPLOY-VPS.md**, **DEPLOY-ULANG.md**, dan **POSTMAN-API-TEST.md**.

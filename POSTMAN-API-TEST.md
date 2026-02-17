# Panduan Test API CMMS dengan Postman

Semua endpoint memakai **base URL**: `http://localhost:3001/api` (development) atau `http://IP_VPS:3001/api` (production).

**Header:** `Content-Type: application/json` (untuk request yang punya body).

---

## 1. Health Check

| Method | URL | Body | Keterangan |
|--------|-----|------|-------------|
| GET | `{{baseUrl}}/health` | - | Cek API hidup. Response: `{ "status": "ok" }` |

**Contoh:** `GET http://localhost:3001/api/health`

---

## 2. Permintaan Perbaikan (Work Orders)

### 2.1 Daftar semua permintaan perbaikan
- **GET** `{{baseUrl}}/permintaan-perbaikan`
- Body: tidak ada
- Response: array objek permintaan perbaikan

### 2.2 Ambil satu permintaan per ID
- **GET** `{{baseUrl}}/permintaan-perbaikan/:id`
- Ganti `:id` dengan ID numerik (mis. `1`)
- Response: satu objek atau 404

### 2.3 Buat permintaan perbaikan baru
- **POST** `{{baseUrl}}/permintaan-perbaikan`
- Body (JSON):
```json
{
  "machineName": "Mesin CNC 01",
  "machineBrand": "Fanuc",
  "section": "Die Casting",
  "machineStatus": "Running",
  "damageDescription": "Sensor error",
  "reportedBy": "Tim Produksi"
}
```
- Wajib: `machineName`, `section`, `damageDescription`
- Response: 201 + objek yang baru dibuat

### 2.4 Update status / data permintaan perbaikan
- **PATCH** `{{baseUrl}}/permintaan-perbaikan/:id`
- Body (JSON) — pilih sesuai transisi status:
  - **Reset ke Open:** `{ "status": "Open" }`
  - **Mulai kerjakan:** `{ "status": "In Progress" }`
  - **Jadwalkan PM:** `{ "status": "PM", "pmScheduledDate": "2026-03-01" }`
  - **Pending:** `{ "status": "Pending", "pendingReason": "Menunggu spare part" }`
  - **Selesai:** `{ "status": "Completed", "causeOfDamage": "...", "repairsPerformed": "...", "actionType": "...", "replacedSpareParts": "...", "replacedPartsSpec": "...", "replacedPartsQty": 2, "technician": "Budi" }`
- Response: objek yang di-update atau 400/404

### 2.5 Hapus permintaan perbaikan
- **DELETE** `{{baseUrl}}/permintaan-perbaikan/:id`
- Body: tidak ada
- Response: 204 No Content atau 404

---

## 3. Assets

### 3.1 Daftar semua assets
- **GET** `{{baseUrl}}/assets`
- Body: tidak ada
- Response: array objek asset

### 3.2 Tambah asset
- **POST** `{{baseUrl}}/assets`
- Body (JSON):
```json
{
  "assetId": "AST-001",
  "name": "Mesin Injection 01",
  "section": "Line 1",
  "health": "Running",
  "lastPmDate": "2026-01-15",
  "nextPmDate": "2026-02-15",
  "uptimePercent": 98.5,
  "installedAt": "2024-06-01"
}
```
- Wajib: `name`, `section`. Opsional: `health` (Running | Warning | Breakdown), `assetId`, tanggal, dll.
- Response: 201 + objek asset

### 3.3 Import banyak assets
- **POST** `{{baseUrl}}/assets/import`
- Body (JSON):
```json
{
  "assets": [
    { "name": "Asset A", "section": "Line 1" },
    { "name": "Asset B", "section": "Line 2", "health": "Warning" }
  ]
}
```
- Response: 201 + `{ "imported": 2, "assets": [...] }`

### 3.4 Hapus asset
- **DELETE** `{{baseUrl}}/assets/:id`
- Body: tidak ada
- Response: 204 atau 404

---

## 4. Inventory (Spare Parts)

### 4.1 Daftar spare parts
- **GET** `{{baseUrl}}/inventory/spare-parts`
- Body: tidak ada
- Response: array spare part

### 4.2 Tambah spare part
- **POST** `{{baseUrl}}/inventory/spare-parts`
- Body (JSON):
```json
{
  "partCode": "PRT-001",
  "name": "Bearing 6205",
  "category": "Bearing",
  "stock": 10,
  "minStock": 2,
  "unit": "pcs",
  "location": "Gudang A",
  "spec": "6205-2RS",
  "forMachine": "Mesin CNC 01",
  "pic": "Admin"
}
```
- Wajib: `name`, `category`. Opsional: `partCode`, `stock`, `minStock`, `unit`, dll.
- Response: 201 + objek spare part

### 4.3 Import spare parts
- **POST** `{{baseUrl}}/inventory/spare-parts/import`
- Body (JSON):
```json
{
  "parts": [
    { "name": "Bearing A", "category": "Bearing", "stock": 5 },
    { "name": "Seal B", "category": "Seal" }
  ]
}
```
- Response: 201 + `{ "imported", "skipped", "parts" }`

### 4.4 History spare part (in/out)
- **GET** `{{baseUrl}}/inventory/spare-parts/history`
- Query (opsional): `?type=in` atau `?type=out`
- Response: array history movement

### 4.5 Keluar (issue) spare part
- **PATCH** `{{baseUrl}}/inventory/spare-parts/:id/issue`
- Body (JSON):
```json
{
  "qty": 2,
  "reason": "Perbaikan mesin CNC 01",
  "pic": "Budi"
}
```
- Wajib: `qty` (bilangan bulat positif), `pic`
- Response: objek spare part setelah dikurangi stok

### 4.6 Masuk (receive) spare part
- **PATCH** `{{baseUrl}}/inventory/spare-parts/:id/receive`
- Body (JSON):
```json
{
  "qty": 5,
  "reason": "Restock dari supplier",
  "pic": "Admin"
}
```
- Wajib: `qty` (bilangan bulat positif)
- Response: objek spare part setelah ditambah stok

---

## 5. Purchase Orders (PO)

### 5.1 Daftar PO
- **GET** `{{baseUrl}}/purchase-orders`
- Body: tidak ada
- Response: array PO

### 5.2 Ambil satu PO
- **GET** `{{baseUrl}}/purchase-orders/:id`
- Response: satu objek PO atau 404

### 5.3 Tambah PO
- **POST** `{{baseUrl}}/purchase-orders`
- Body (JSON):
```json
{
  "tanggal": "2026-02-17",
  "itemDeskripsi": "Bearing 6205",
  "model": "6205-2RS",
  "hargaPerUnit": 50000,
  "qty": 4,
  "noPO": "PO/2026/001",
  "mesin": "Mesin CNC 01",
  "noQuotation": "QUO-001",
  "supplier": "PT Sumber Bearing",
  "kategori": "Sparepart",
  "status": "Tahap 1"
}
```
- Wajib: `tanggal`, `itemDeskripsi`. Opsional: `kategori` (Preventive | Sparepart | Breakdown/Repair), `status` (Tahap 1 … Tahap 7).
- Response: 201 + objek PO (no_registrasi auto)

### 5.4 Update PO
- **PATCH** `{{baseUrl}}/purchase-orders/:id`
- Body (JSON) — kirim field yang mau diubah:
```json
{
  "noPO": "PO/2026/002",
  "noQuotation": "QUO-002",
  "status": "Tahap 2"
}
```
- Status: Tahap 1 … Tahap 7
- Response: objek PO terupdate atau 404

### 5.5 Hapus PO
- **DELETE** `{{baseUrl}}/purchase-orders/:id`
- Response: 204 atau 404

---

## 6. Dashboard

### 6.1 KPIs
- **GET** `{{baseUrl}}/dashboard/kpis`
- Response: objek berisi pmCompliance, maintenanceCostIdr, openWorkOrders, assetsInMaintenance, dll.

### 6.2 Trend (bulanan)
- **GET** `{{baseUrl}}/dashboard/trend`
- Response: array per bulan (reactiveWOs, preventiveWOs)

### 6.3 Pareto (downtime by cause)
- **GET** `{{baseUrl}}/dashboard/pareto`
- Response: array cause + hours + cumulativePercent

### 6.4 Jadwal PM (upcoming)
- **GET** `{{baseUrl}}/dashboard/upcoming-pm`
- Response: array jadwal PM

### 6.5 Update jadwal PM
- **PATCH** `{{baseUrl}}/dashboard/upcoming-pm/:id`
- Body (JSON):
```json
{
  "keteranganStatus": "PM OK",
  "keteranganNotes": "Sudah selesai dicek"
}
```
- `keteranganStatus`: PM OK | Belum Selesai | Pending
- Response: objek jadwal PM terupdate

### 6.6 Hapus jadwal PM
- **DELETE** `{{baseUrl}}/dashboard/upcoming-pm/:id`
- Response: 204 atau 404

### 6.7 Buat jadwal PM baru
- **POST** `{{baseUrl}}/dashboard/pm-schedule`
- Body (JSON) — minimal:
```json
{
  "assetName": "Mesin CNC 01",
  "activity": "Ganti oli dan filter",
  "scheduledDate": "2026-03-01",
  "assignedTo": "Budi"
}
```
- Wajib: `assetName`, `activity`, `scheduledDate`, `assignedTo`
- Response: 201 + objek jadwal PM

### 6.8 Quick stats
- **GET** `{{baseUrl}}/dashboard/quick-stats`
- Response: completedWOs, avgResponseTimeHours, dll.

### 6.9 Distribusi status WO
- **GET** `{{baseUrl}}/dashboard/wo-status`
- Response: open, inProgress, pending, completed

### 6.10 Asset health
- **GET** `{{baseUrl}}/dashboard/asset-health`
- Response: running, warning, breakdown

---

## Setup di Postman

1. Buat **Environment** (opsional):
   - Variable: `baseUrl` = `http://localhost:3001/api` (atau `http://IP_VPS:3001/api`).
   - Di request URL pakai: `{{baseUrl}}/health`, `{{baseUrl}}/permintaan-perbaikan`, dll.

2. Untuk request yang punya body (POST/PATCH):
   - Tab **Body** → pilih **raw** → **JSON**.
   - Paste contoh body dari panduan di atas.

3. **Import collection:**  
   - Buka Postman → **Import** → pilih file **`CMMS-Postman-Collection.json`** (di folder project).  
   - Semua request akan masuk ke collection **CMMS API** dengan variable `baseUrl` = `http://localhost:3001/api`.  
   - Untuk test ke VPS: edit variable collection, ubah `baseUrl` jadi `http://IP_VPS:3001/api`.  
   - Variable `permintaanId`, `assetId`, `sparePartId`, `poId`, `upcomingPmId` bisa diisi ID nyata setelah Anda dapat dari response GET/Create.

---

## Kode response umum

| Kode | Arti |
|------|------|
| 200 | OK — request berhasil (GET/PATCH) |
| 201 | Created — resource baru berhasil dibuat (POST) |
| 204 | No Content — berhasil, tanpa body (DELETE) |
| 400 | Bad Request — validasi gagal (field wajib, format salah) |
| 404 | Not Found — resource tidak ditemukan |
| 500 | Server Error — error di backend/DB |

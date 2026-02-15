# Analisis Gap Fitur CMMS vs 5 KPI Maintenance

Dokumen ini merangkum **fitur yang sudah ada**, **yang masih kurang**, dan **rekomendasi penambahan** agar web CMMS bisa mendukung kelima KPI maintenance secara penuh.

---

## Ringkasan per KPI

| KPI | Fitur yang sudah ada | Yang masih kurang | Prioritas |
|-----|----------------------|-------------------|-----------|
| 1. Biaya Spare Part | Inventory, history in/out, PO (harga di PO) | Harga di master part, link PO–part, laporan spend/usage | Tinggi |
| 2. Biaya Repair | WO, PO, dashboard | Biaya per WO, tag Internal vs Subcont, laporan biaya repair | Tinggi |
| 3. Downtime | WO downtime & cause, Pareto, PM, assets | Flag “recurring”, modul improvement/modifikasi, trend downtime by cause | Sedang |
| 4. Biaya system + kertas | Sistem digital, form online | Export/PDF untuk audit, approval digital (opsional) | Rendah |
| 5. Biaya Supplies | Inventory + history (bisa dipakai supplies) | Kategori Supplies vs Spare Part, laporan pemakaian per periode | Sedang |

---

## KPI 1: Penurunan Biaya Pembelian Spare Part

### Sudah ada
- Master spare part (part code, nama, kategori, stok, min stock, untuk mesin).
- History masuk/keluar + PIC (audit pemakaian).
- Tracking PO (item, harga per unit, qty, supplier, total).
- WO mencatat spare part yang diganti (replacedSpareParts).

### Yang kurang
1. **Harga/standard cost di master Spare Part**  
   Saat ini harga hanya ada di PO, tidak di master part. Untuk analisis “ganti merk / harga lebih murah” butuh referensi harga per part (mis. last price atau standard cost).

2. **Link PO ↔ Spare Part**  
   PO punya item (nama/deskripsi) dan harga, tapi tidak ada field “partId” atau “partCode” yang link ke master inventory. Akibatnya analisis “belanja per part / per supplier” harus manual.

3. **Laporan / dashboard analisis spare part**  
   Belum ada halaman atau report khusus:
   - Top part by usage (dari history keluar).
   - Top part by spend (butuh harga + usage atau link PO–part).
   - Daftar part prioritas untuk lokalisasi (mis. high usage + high cost).

### Rekomendasi penambahan
- [ ] Field **harga standar / last price** (opsional) di master Spare Part.
- [ ] Di form PO: pilihan **link ke Spare Part** (part code) per line item.
- [ ] **Laporan / tab “Spare Part Spend”**: per part code (dari PO atau dari usage × harga), bisa filter periode; untuk bahan presentasi KPI 1.

---

## KPI 2: Penurunan Biaya Repair

### Sudah ada
- Work Order lengkap (teknisi, spare part diganti, downtime, cause, dll).
- Tracking PO (bisa untuk repair/subcont).
- Dashboard (total downtime, jumlah WO, maintenance cost dari PO).

### Yang kurang
1. **Biaya per WO**  
   WO tidak punya field “biaya repair” (internal: estimasi tenaga + material, atau subcont: nilai dari PO). Tanpa ini sulit hitung “total biaya repair” dan banding internal vs subcont.

2. **Tag Internal vs Subcont**  
   Belum ada field di WO atau PO yang menandai apakah repair dikerjakan **internal** atau **subcont**. Padahal KPI 2 butuh perbandingan “repair internal vs subcont dengan harga lebih murah”.

3. **Link WO ↔ PO**  
   Jika repair pakai subcont, WO tidak punya link ke PO (no PO / id PO). Jadi tidak otomatis terhitung “biaya repair via subcont” per WO.

4. **Laporan biaya repair**  
   Belum ada report: biaya repair per mesin, per periode, Internal vs Subcont (butuh field di atas dulu).

### Rekomendasi penambahan
- [ ] Field di WO: **Tipe perbaikan** (Internal / Subcont) dan **No. PO** (jika subcont).
- [ ] Field di WO: **Estimasi biaya / Biaya actual** (opsional; bisa diisi manual atau dari PO jika link).
- [ ] Di Dashboard atau halaman baru: **Ringkasan biaya repair** (internal vs subcont, per bulan/kuartal) untuk KPI 2.

---

## KPI 3: Penurunan Downtime Mesin

### Sudah ada
- WO: totalDowntimeHours, causeOfDamage, mesin, jenis (Corrective/PM).
- Dashboard: Pareto downtime by cause, trend reactive vs preventive.
- Preventive Maintenance: jadwal, compliance, asset.
- Assets: health, last/next PM, uptime %.

### Yang kurang
1. **Flag “kerusakan berulang” / recurring**  
   Tidak ada penanda di WO atau di asset bahwa kerusakan ini “sama dengan sebelumnya” atau “recurring”. Padahal untuk prioritas modifikasi mesin/jig, data “mesin X sering rusak karena cause Y” sangat berguna.

2. **Modul improvement / aksi modifikasi**  
   Belum ada fitur untuk mencatat **aksi perbaikan permanen** (modifikasi mesin, modifikasi jig, dll.) dan mengaitkannya ke mesin/cause. Jadi sulit melaporkan “berapa aksi modifikasi yang sudah dilakukan” dan dampaknya ke downtime.

3. **Trend downtime per cause / per mesin**  
   Pareto ada, tapi belum ada grafik trend (bulan ke bulan) downtime per cause atau per mesin. Untuk justifikasi “setelah modifikasi, downtime cause X turun” butuh trend.

### Rekomendasi penambahan
- [ ] Field di WO: **Recurring?** (Ya/Tidak) atau **Link ke WO sebelumnya** (untuk kerusakan berulang).
- [ ] Halaman atau modul sederhana **“Improvement / Modifikasi”**: tanggal, mesin/asset, deskripsi (modifikasi mesin/jig), cause yang ditarget, status; opsional: downtime sebelum/sesudah.
- [ ] Di Dashboard atau report: **Trend downtime by cause** atau **by asset** (per bulan).

---

## KPI 4: Menghilangkan Biaya System + Pengurangan Kertas

### Sudah ada
- Seluruh proses (WO, Asset, Inventory, PO, PM) lewat form digital.
- History dan dashboard sebagai “audit trail” dasar.

### Yang kurang
1. **Export laporan (PDF/Excel)**  
   Belum ada tombol “Export” atau “Cetak” untuk laporan (WO, inventory, history, dashboard). Untuk audit atau arsip resmi, kadang tetap butuh dokumen PDF/Excel; tanpa ini orang bisa kembali print manual.

2. **Approval workflow digital (opsional)**  
   Jika saat ini approval masih pakai tanda tangan kertas/WA, maka “pengurangan kertas” belum 100%. Approval di dalam CMMS (mis. approve WO, approve PO) akan melengkapi KPI 4.

### Rekomendasi penambahan
- [ ] **Export PDF/Excel** untuk: daftar WO (filter periode), history spare part, ringkasan dashboard (optional).
- [ ] (Opsional) **Approval di sistem**: status WO/PO “Menunggu Approval” → “Disetujui” oleh role tertentu.

---

## KPI 5: Penurunan Biaya Pembelian Supplies

### Sudah ada
- Inventory dipakai untuk spare part; **kategori** bisa dipakai untuk Supplies (mis. kategori “Supplies” atau “ATK”).
- History masuk/keluar + PIC berlaku untuk semua item inventory, jadi supplies yang dicatat sebagai item akan punya audit trail pemakaian.

### Yang kurang
1. **Pemisahan tampilan / filter “Supplies” vs “Spare Part”**  
   Secara data bisa pakai kategori, tapi belum ada tab atau view khusus “Supplies” (sarung tangan, kertas, ATK, silicon, dll.) sehingga pemakaian dan pembelian supplies tidak terlihat terpisah dari spare part mesin.

2. **Laporan pemakaian supplies per periode**  
   History ada per transaksi, tapi belum ada agregasi: “pemakaian per kategori per bulan” atau “top 10 supplies by usage”. Untuk KPI 5 butuh “kita pakai berapa banyak supplies bulan ini” dan “target penurunan X%”.

### Rekomendasi penambahan
- [ ] **Kategori tetap dipakai**; tambah filter/tab di halaman Inventory: **“Spare Part”** vs **“Supplies”** (berdasarkan kategori).
- [ ] **Laporan pemakaian per kategori/periode**: total qty keluar per kategori (atau per item) per bulan; bisa jadi satu halaman “Laporan Pemakaian” atau section di Dashboard.

---

## Prioritas implementasi (saran)

| Prioritas | Fitur | KPI yang didukung |
|-----------|--------|---------------------|
| **Tinggi** | Harga/last price di Spare Part + link PO–Part + laporan spend/usage | KPI 1 |
| **Tinggi** | WO: Tipe (Internal/Subcont), link PO, biaya; laporan biaya repair | KPI 2 |
| **Sedang** | WO: flag Recurring; modul Improvement/Modifikasi; trend downtime by cause | KPI 3 |
| **Sedang** | Filter/tab Supplies vs Spare Part; laporan pemakaian per kategori/periode | KPI 5 |
| **Rendah** | Export PDF/Excel; approval digital (opsional) | KPI 4 |

---

## Kesimpulan

- **KPI 4** (system + kertas) sudah paling terpenuhi: sistem digital dan form sudah menggantikan kertas; yang bisa ditambah hanya export dan approval.
- **KPI 1 dan 2** butuh **data biaya dan klasifikasi** (harga part, link PO–part, biaya repair, Internal vs Subcont) plus **laporan** agar angka KPI bisa dihitung dan dipresentasikan ke GM.
- **KPI 3** butuh **flag recurring** dan **modul improvement** plus **trend downtime** agar dampak modifikasi mesin/jig bisa terlihat.
- **KPI 5** butuh **pemisahan supplies** di tampilan dan **laporan pemakaian per periode** agar target penurunan biaya supplies bisa diukur.

Dengan menambah fitur di atas (secara bertahap sesuai prioritas), web CMMS akan bisa mendukung kelima KPI maintenance secara lengkap dan siap untuk audit serta review ke GM.

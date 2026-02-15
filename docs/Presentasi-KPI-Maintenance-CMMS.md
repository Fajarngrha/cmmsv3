# Presentasi KPI Maintenance — Dampak CMMS

**Tujuan:** Menunjukkan dampak pembangunan website CMMS terhadap KPI Maintenance kepada GM.

---

## Slide 1: Judul & Tujuan Presentasi

**Judul:** Dampak CMMS terhadap KPI Maintenance

**Tujuan:**
- Memperlihatkan bagaimana sistem CMMS mendukung pencapaian KPI Maintenance.
- Menghubungkan fitur sistem dengan pengurangan biaya dan peningkatan efisiensi.

---

## Slide 2: Ringkasan 5 KPI & Dampak CMMS

| No | KPI Maintenance | Dampak CMMS (Ringkas) |
|----|-----------------|------------------------|
| 1 | Penurunan Biaya Pembelian Spare Part | Data inventory & history → keputusan lokalisasi/merk/harga |
| 2 | Penurunan Biaya Repair | Tracking WO & PO → repair internal vs subcont, pilih yang lebih murah |
| 3 | Penurunan Downtime Mesin | Jadwal PM, asset health, WO → modifikasi mesin/jig terarah |
| 4 | Menghilangkan Biaya Pembuatan System + Pengurangan Kertas | Satu sistem siap pakai; form & laporan digital |
| 5 | Penurunan Biaya Pembelian Supplies | Visibility pemakaian & stok → beli sesuai kebutuhan |

---

## Slide 3: KPI 1 — Penurunan Biaya Pembelian Spare Part

**Target:** Lokalisasi / ganti merk / harga lebih murah, dll.

**Bagaimana CMMS mendukung:**

| Fitur CMMS | Manfaat untuk KPI |
|------------|-------------------|
| **Inventory Spare Part** | Satu sumber data: part code, nama, stok, min stock, lokasi, untuk mesin mana. Memudahkan identifikasi part yang bisa diganti merk atau dilokalisasi. |
| **History Masuk/Keluar** | Rekapan pemakaian per part → tahu part mana yang sering dipakai (prioritas nego harga/lokalisasi). Data audit untuk justifikasi pengadaan. |
| **Tracking PO** | Riwayat pembelian spare part (supplier, harga, qty) → bahan analisis banding harga dan pilihan vendor/merk. |
| **Work Order (spare part diganti)** | Kaitan WO dengan spare part yang dipakai → analisis biaya per mesin/per jenis perbaikan. |

**Impact yang bisa disampaikan ke GM:**
- Data terpusat → tim bisa **analisis part mana yang mahal & sering dipakai** → fokus lokalisasi/ganti merk.
- History & PO → **nego harga** atau cari alternatif dengan dasar data, bukan perkiraan.
- **Contoh metrik:** “Dengan data CMMS, kita bisa target penurunan X% biaya spare part melalui program lokalisasi 5 part prioritas.”

---

## Slide 4: KPI 2 — Penurunan Biaya Repair

**Target:** Repair dilakukan internal / subcont dengan harga lebih murah.

**Bagaimana CMMS mendukung:**

| Fitur CMMS | Manfaat untuk KPI |
|------------|-------------------|
| **Work Orders** | Semua repair tercatat: jenis (Corrective/PM/Inspection), teknisi, durasi, spare part, downtime. Bisa bandingkan biaya internal vs subcont per jenis perbaikan. |
| **Tracking PO** | PO untuk repair/breakdown → biaya subcont dan material tercatat. Bisa filter kategori (Breakdown/Repair, Preventive, Sparepart). |
| **Dashboard & Laporan** | Total downtime, jumlah WO, biaya maintenance → dasar keputusan: perbaikan mana yang di-insource, mana yang di-subcont dengan tender harga lebih murah. |

**Impact yang bisa disampaikan ke GM:**
- **Visibility biaya repair:** Internal (tenaga + spare part) vs subcont (dari PO) → pilih opsi yang lebih murah.
- **Data untuk tender/renego:** Riwayat repair & PO → bahan nego dengan vendor atau putusan “repair ini sebaiknya internal”.
- **Contoh metrik:** “CMMS memungkinkan tracking biaya repair per mesin/line; target penurunan Y% melalui mix internal vs subcont yang optimal.”

---

## Slide 5: KPI 3 — Penurunan Downtime Mesin

**Target:** Modifikasi mesin / modifikasi jig, dll.

**Bagaimana CMMS mendukung:**

| Fitur CMMS | Manfaat untuk KPI |
|------------|-------------------|
| **Assets & Health** | Status mesin (Running/Warning/Breakdown), uptime %, last/next PM. Identifikasi mesin bermasalah untuk prioritas modifikasi. |
| **Preventive Maintenance** | Jadwal PM terencana, compliance rate → mesin yang sering skip PM atau sering breakdown jadi kandidat modifikasi/jig. |
| **Work Orders** | Downtime hours, cause of damage, repairs performed → pola kerusakan berulang = dasar justifikasi modifikasi mesin/jig. |
| **Dashboard (Pareto, Trend)** | Pareto downtime per cause, trend reactive vs preventive → fokus modifikasi pada penyebab downtime terbesar. |

**Impact yang bisa disampaikan ke GM:**
- **Data penyebab downtime:** Bukan hanya “mesin rusak”, tapi “rusak karena apa, berapa jam, berapa kali” → prioritas modifikasi/jig.
- **Link ke PM:** Mesin dengan PM compliance rendah atau breakdown sering → kandidat improvement (modifikasi/jig/preventive design).
- **Contoh metrik:** “Dengan CMMS kita bisa target penurunan Z jam downtime per tahun melalui program modifikasi mesin/jig untuk 3 penyebab utama (berdasarkan data Pareto).”

---

## Slide 6: KPI 4 — Menghilangkan Biaya Pembuatan System & Pengurangan Kertas

**Target:** Estimasi biaya pembuatan system maintenance + pengurangan biaya kertas.

**Bagaimana CMMS mendukung:**

| Aspek | Dampak |
|-------|--------|
| **Sistem siap pakai** | Satu platform: WO, Asset, Inventory, PO, PM. Tidak perlu develop dari nol → **menghindari biaya development & maintenance system** yang besar. |
| **Form & approval digital** | WO, PO, schedule PM, issue spare part, keterangan PM → semua isian di web. **Mengurangi form kertas**, print, arsip fisik. |
| **Laporan & audit trail** | Dashboard, history spare part, riwayat WO/PO → laporan untuk manajemen dan audit **tanpa mengandalkan kertas**. |
| **Estimasi yang bisa disampaikan** | Bandingkan: (1) Biaya develop + maintain system sendiri vs (2) Biaya berlangganan/operasional CMMS yang sudah ada. Plus (3) Pengurangan biaya kertas, cetak, penyimpanan, dan waktu cari dokumen. |

**Impact yang bisa disampaikan ke GM:**
- **Menghilangkan/ mengurangi biaya pembuatan system:** “Tanpa CMMS, estimasi biaya development + maintenance system sejenis Rp X. Dengan CMMS yang sudah dibangun, biaya tersebut dapat dihindari/dikurangi.”
- **Pengurangan kertas:** “Form WO, PO, inventory, PM, dan laporan beralih ke digital → estimasi pengurangan pemakaian kertas dan biaya ATK sebesar Rp Y per tahun.”

---

## Slide 7: KPI 5 — Penurunan Biaya Pembelian Supplies

**Target:** Sarung tangan, kertas, ATK, silicon, dll.

**Bagaimana CMMS mendukung:**

| Fitur CMMS | Manfaat untuk KPI |
|------------|-------------------|
| **Inventory & Kategori** | Supplies bisa dicatat sebagai item inventory (kategori mis. “Supplies” atau “ATK”) dengan stok, min stock, unit. |
| **History Masuk/Keluar + PIC** | Setiap pengambilan tercatat (qty, PIC, tanggal, keterangan) → **visibility pemakaian** per periode. Dasar forecast dan pembelian sesuai kebutuhan. |
| **Dashboard & Laporan** | Rekapan pemakaian supplies → hindari overstock dan beli hanya yang perlu → **penurunan biaya pembelian** dan ruang penyimpanan. |

**Impact yang bisa disampaikan ke GM:**
- **Kontrol pemakaian:** Siapa ambil, berapa, untuk apa (keterangan) → budaya pakai sesuai kebutuhan.
- **Data untuk pembelian:** Trend pemakaian → beli dalam jumlah yang tepat (tidak menumpuk), nego harga dengan vendor karena pembelian terencana.
- **Contoh metrik:** “Dengan catatan pemakaian di CMMS, target penurunan pembelian supplies sebesar W% melalui pembelian terencana dan pengendalian pemakaian.”

---

## Slide 8: Ringkasan — Peta Fitur CMMS ke KPI

```
KPI 1 (Spare Part)     → Inventory, History Masuk/Keluar, PO, WO
KPI 2 (Repair)         → Work Orders, Tracking PO, Dashboard
KPI 3 (Downtime)       → Assets, PM, WO (downtime/cause), Pareto/Trend
KPI 4 (System + Kertas)→ Sistem siap pakai, form & laporan digital
KPI 5 (Supplies)       → Inventory, History + PIC, laporan pemakaian
```

**Pesan utama:** Satu sistem CMMS menjadi **sumber data dan alat kontrol** untuk kelima KPI maintenance sekaligus.

---

## Slide 9: Langkah Lanjut (Rekomendasi)

1. **Isi angka estimasi** untuk setiap KPI (target % penurunan, estimasi Rp) setelah data CMMS berjalan 3–6 bulan.
2. **Tetapkan pemilik KPI** per item (Spare Part, Repair, Downtime, System/Kertas, Supplies) agar ada yang accountable.
3. **Jadwalkan review berkala** (bulanan/kuartalan) dengan GM menggunakan dashboard dan laporan dari CMMS.
4. **Ekspansi penggunaan** (mis. supplies masuk inventory & history, PO repair konsisten di-tag) agar dampak KPI makin terukur.

---

## Catatan untuk Presenter

- **Angka:** Jika belum ada angka riil, gunakan “Target penurunan X%” atau “Estimasi penghematan Rp Y setelah data 6 bulan” dan janji update di review berikutnya.
- **Demo singkat:** Siapkan demo singkat (2–3 menit) tampilkan: Dashboard, Inventory + History, satu WO, satu PO, halaman PM Compliance — untuk memperkuat bahwa data KPI bisa diambil dari sistem.
- **GM focus:** Tekankan **pengurangan biaya** dan **kontrol/visibility**; detail teknis cukup sekadar menghubungkan fitur dengan KPI.

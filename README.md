# CMMS Dashboard Website

Web-based CMMS (Computerized Maintenance Management System) dashboard for real-time monitoring and management of Permintaan perbaikan, asset maintenance, spare parts inventory, PM compliance, maintenance costs, downtime, and asset health.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router, Recharts
- **Backend:** Node.js, Express, TypeScript
- **Data:** In-memory mock data; **Purchase Orders** dapat menggunakan PostgreSQL untuk production (lihat [PRODUCTION.md](PRODUCTION.md))

## Features (MVP)

- **Dashboard:** KPIs (PM Compliance, Total Downtime, Maintenance Cost, Breakdown Count), Open WOs / Due Today / Assets in Maintenance / PM Rate, Trend Maintenance line chart, Pareto Downtime chart, Status Permintaan perbaikan & Asset Health summary, Upcoming PM Schedule, Quick Stats
- **Permintaan perbaikan:** List with filters, status badges (PM, Open, Pending, In Progress, Completed), Buat Permintaan perbaikan modal (Tim Produksi) with Nama Mesin, Section, Jenis Kerusakan, Deskripsi
- **Layout:** Header (title, period/area/machine/maintenance filters, Refresh, user profile), Sidebar (Dashboard, Permintaan perbaikan, Assets, Inventory, Preventive Maintenance), Collapse

## Getting Started

### Prerequisites

- Node.js 18+

### Install and run

```bash
# Install all dependencies (root + frontend + backend)
npm run install:all

# Run frontend (Vite) and backend (Express) together
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:3001  

The frontend proxies `/api` to the backend, so the app works without CORS when using the dev server.

### Akses dari jaringan (WiFi yang sama) / share ke perangkat lain

Agar laptop/HP lain di WiFi yang sama bisa membuka aplikasi:

1. **Jalankan seperti biasa** dari folder project:
   ```bash
   npm run dev
   ```

2. **Cek IP komputer Anda** (yang menjalankan `npm run dev`):
   - **Windows:** buka CMD/PowerShell → `ipconfig` → cari **IPv4 Address** (mis. `192.168.1.100`)
   - **Mac/Linux:** terminal → `ifconfig` atau `ip addr` → cari alamat `192.168.x.x` atau `10.0.x.x`

3. **Buka dari perangkat lain** (HP/laptop lain yang satu WiFi):
   - Di browser ketik: **`http://<IP-ANDA>:5173`**  
   - Contoh: `http://192.168.1.100:5173`
   - Semua request API tetap lewat proxy ke backend di komputer Anda, jadi tidak perlu buka port 3001.

4. **Firewall:** jika tidak bisa dibuka dari HP/laptop lain, izinkan aplikasi Node/Vite di **Windows Firewall** atau matikan sementara firewall untuk uji.

### Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run frontend and backend in development |
| `npm run dev:frontend` | Run only frontend (Vite) |
| `npm run dev:backend` | Run only backend (Express) |
| `npm run build` | Build frontend and backend |
| `npm run install:all` | Install root, frontend, and backend dependencies |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/kpis` | Dashboard KPIs |
| GET | `/api/dashboard/trend` | Maintenance trend (reactive vs preventive WOs per month) |
| GET | `/api/dashboard/pareto` | Pareto downtime by cause |
| GET | `/api/dashboard/upcoming-pm` | Upcoming PM schedule |
| GET | `/api/dashboard/quick-stats` | Quick stats (response time, completed WOs, etc.) |
| GET | `/api/dashboard/wo-status` | Permintaan perbaikan status distribution |
| GET | `/api/dashboard/asset-health` | Asset health counts (Running, Warning, Breakdown) |
| GET | `/api/permintaan-perbaikan` | List permintaan perbaikan |
| POST | `/api/permintaan-perbaikan` | Create permintaan perbaikan (body: machineName, section, damageType, description?, reportedBy?) |

## Production (Frontend → Backend → Database)

- **Backend:** Set env `DATABASE_URL` atau `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`, lalu jalankan schema PostgreSQL (`backend/database/schema-postgres.sql`). Fitur **Purchase Orders** akan memakai database.
- **Frontend:** Jika frontend dan backend di host terpisah, set `VITE_API_URL` ke URL backend (lihat `frontend/.env.example`).
- Panduan lengkap: **[PRODUCTION.md](PRODUCTION.md)**.

## Next Steps (Beta / Full Release)

- **Assets:** Asset list and health map
- **Inventory:** Spare parts bar chart and stock levels
- **Preventive Maintenance:** PM calendar and compliance detail
- **Auth:** Login and role-based access (technician, manager, admin)
- **Database:** Extend other modules (assets, permintaan perbaikan, inventory) to use PostgreSQL like purchase orders
- **Real-time:** WebSocket or polling for live updates

## License

Private / Internal use.

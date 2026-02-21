import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env dari folder backend (bukan cwd) agar jalan benar saat dijalankan PM2
dotenv.config({ path: path.join(__dirname, '..', '.env') });
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { dashboardRouter } from './routes/dashboard.js';
import { permintaanPerbaikanRouter } from './routes/permintaanPerbaikan.js';
import { assetsRouter } from './routes/assets.js';
import { inventoryRouter } from './routes/inventory.js';
import { purchaseOrdersRouter } from './routes/purchaseOrders.js';
import { query, getConnectionInfo } from './db/index.js';
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', dashboardRouter);
app.use('/api', permintaanPerbaikanRouter);
app.use('/api', assetsRouter);
app.use('/api', inventoryRouter);
app.use('/api', purchaseOrdersRouter);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
const staticDir = process.env.STATIC_DIR ||
    path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get('*', (_, res) => res.sendFile(path.join(staticDir, 'index.html')));
}
async function start() {
    try {
        await query('SELECT 1');
        console.log('Database: connected as', getConnectionInfo());
        const tbl = await query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'po_no_registrasi_seq'`);
        if (tbl.rows.length === 0) {
            console.warn('[CMMS] Peringatan: Tabel po_no_registrasi_seq tidak ada. Buat PO bisa error duplicate no_registrasi. Jalankan: sudo -u postgres psql -d cmms_dbv3 -f backend/database/migration-po-no-registrasi-seq.sql');
        }
    }
    catch (e) {
        console.error('Database connection failed. Set DATABASE_URL or DB_* env vars and ensure PostgreSQL is running.');
        console.error(e);
        process.exit(1);
    }
    app.listen(PORT, HOST, () => {
        console.log(`CMMS API: http://localhost:${PORT}`);
        if (fs.existsSync(staticDir)) {
            console.log('  Frontend static: dilayani dari', staticDir);
        }
        if (HOST === '0.0.0.0') {
            console.log('  Dapat diakses dari jaringan (WiFi) yang sama via IP komputer ini.');
        }
    });
}
start();

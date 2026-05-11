/**
 * Buat pengguna CMMS di tabel cmms_app_users (multi-user).
 * Contoh: npm run user:create -- maintainer Rahasia123 "Maintenance Team"
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
import { query } from '../db/index.js';
import { hashPassword } from '../auth/password.js';
import { loadAuthSettings } from '../auth/mode.js';
function normalizeUsername(raw) {
    return raw.trim().toLowerCase();
}
async function main() {
    const [, , u, p, ...rest] = process.argv;
    if (!u || !p) {
        console.error('Usage: npm run user:create -- <username> <password> [display name...]');
        process.exit(1);
    }
    const username = normalizeUsername(u);
    if (username.length < 2 || username.length > 100) {
        console.error('Username 2–100 karakter.');
        process.exit(1);
    }
    if (!/^[a-z0-9._-]+$/.test(username)) {
        console.error('Username hanya huruf kecil, angka, . _ -');
        process.exit(1);
    }
    if (p.length < 6) {
        console.error('Password minimal 6 karakter.');
        process.exit(1);
    }
    const displayName = rest.join(' ').trim() || null;
    const ex = await query(`SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'cmms_app_users'
    ) AS exists`);
    if (!ex.rows[0]?.exists) {
        console.error('Tabel cmms_app_users belum ada. Jalankan migration-cmms-app-users.sql terlebih dahulu.');
        process.exit(1);
    }
    const ph = await hashPassword(p);
    try {
        await query(`INSERT INTO cmms_app_users (username, password_hash, display_name)
       VALUES ($1, $2, $3)`, [username, ph, displayName]);
    }
    catch (e) {
        const err = e;
        if (err?.code === '23505') {
            console.error('Username sudah ada.');
            process.exit(1);
        }
        throw e;
    }
    await loadAuthSettings();
    console.log(`Pengguna "${username}" berhasil dibuat.`);
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});

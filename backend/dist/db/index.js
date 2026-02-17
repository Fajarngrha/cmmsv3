import pg from 'pg';
const { Pool } = pg;
function getConfig() {
    if (process.env.DATABASE_URL) {
        return { connectionString: process.env.DATABASE_URL };
    }
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT) || 5432;
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'cmms_dbv3';
    return { host, port, user, password, database };
}
export function isDbConfigured() {
    if (process.env.DATABASE_URL)
        return true;
    return Boolean(process.env.DB_HOST || process.env.DB_USER || process.env.DB_NAME);
}
let pool = null;
/** Untuk debug: user dan database yang dipakai (tanpa password) */
export function getConnectionInfo() {
    const url = process.env.DATABASE_URL;
    if (url) {
        try {
            const u = new URL(url);
            const user = u.username || '?';
            const db = u.pathname ? u.pathname.replace(/^\//, '').replace(/\?.*/, '') : '?';
            return `${user}@${db}`;
        }
        catch {
            return 'DATABASE_URL (parse error)';
        }
    }
    const user = process.env.DB_USER || 'postgres';
    const db = process.env.DB_NAME || 'cmms_dbv3';
    return `${user}@${db}`;
}
export function getPool() {
    if (!pool) {
        if (!isDbConfigured()) {
            throw new Error('Database not configured. Set DATABASE_URL or DB_* env vars.');
        }
        pool = new Pool(getConfig());
        console.log('[db] Pool created for', getConnectionInfo());
    }
    return pool;
}
export async function query(text, params) {
    return getPool().query(text, params);
}
export async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

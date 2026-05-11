import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db/index.js';
const DEFAULT_AUTH_USERS = [
    { username: 'admin', password: 'admin123', displayName: 'Administrator', role: 'Admin' },
    { username: 'supervisor', password: 'supervisor123', displayName: 'Maintenance Supervisor', role: 'Supervisor' },
    { username: 'teknisi', password: 'teknisi123', displayName: 'Teknisi Maintenance', role: 'Technician' },
];
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '12h');
const SALT_ROUNDS = 10;
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim().length < 16) {
        throw new Error('JWT_SECRET wajib diisi (minimal 16 karakter) untuk keamanan login.');
    }
    return secret;
}
function toAuthUser(row) {
    return {
        id: Number(row.id),
        username: row.username,
        displayName: row.display_name,
        role: row.role,
    };
}
export async function ensureAuthSchema() {
    await query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name VARCHAR(120) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'User',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
export async function ensureDefaultUsers() {
    const total = await query('SELECT COUNT(*)::int AS total FROM app_users');
    if ((total.rows[0]?.total ?? 0) > 0)
        return;
    for (const user of DEFAULT_AUTH_USERS) {
        const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
        await query(`INSERT INTO app_users (username, password_hash, display_name, role, is_active)
       VALUES ($1, $2, $3, $4, TRUE)`, [user.username, hash, user.displayName, user.role]);
    }
    console.log('[auth] Default users seeded:', DEFAULT_AUTH_USERS.map((u) => u.username).join(', '));
}
export async function verifyLogin(username, password) {
    const normalized = username.trim().toLowerCase();
    if (!normalized || !password)
        return null;
    const result = await query(`SELECT id, username, password_hash, display_name, role, is_active
     FROM app_users
     WHERE LOWER(username) = $1
     LIMIT 1`, [normalized]);
    if (result.rows.length === 0)
        return null;
    const row = result.rows[0];
    if (!row.is_active)
        return null;
    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid)
        return null;
    return toAuthUser(row);
}
export function signAccessToken(user) {
    return jwt.sign({ sub: String(user.id), username: user.username, displayName: user.displayName, role: user.role }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}
export function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        return {
            id: Number(decoded.sub),
            username: decoded.username,
            displayName: decoded.displayName,
            role: decoded.role,
        };
    }
    catch {
        return null;
    }
}

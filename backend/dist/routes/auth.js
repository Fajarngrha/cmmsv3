import { Router } from 'express';
import { signToken, verifyToken } from '../auth/token.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { allowBootstrapRegister, getAuthState, isLoginConfigured, loadAuthSettings, useDbAuth, } from '../auth/mode.js';
import { query } from '../db/index.js';
export { isLoginConfigured, loadAuthSettings } from '../auth/mode.js';
export const authRouter = Router();
const AUTH_USER = (process.env.CMMS_AUTH_USERNAME ?? '').trim();
const AUTH_PASS = (process.env.CMMS_AUTH_PASSWORD ?? '').trim();
const AUTH_SECRET = (process.env.CMMS_AUTH_SECRET ?? 'cmms-change-me-in-production').trim();
function normalizeUsername(raw) {
    return raw.trim().toLowerCase();
}
authRouter.get('/status', (_, res) => {
    const s = getAuthState();
    res.json({
        loginRequired: s.loginRequired,
        authMode: s.authMode,
        bootstrapAllowed: s.bootstrapAllowed,
    });
});
authRouter.post('/register', async (req, res) => {
    if (!allowBootstrapRegister()) {
        res.status(403).json({
            error: 'Pendaftaran akun pertama tidak tersedia. Sudah ada pengguna, atau tabel cmms_app_users belum dibuat.',
        });
        return;
    }
    const usernameRaw = typeof req.body?.username === 'string' ? req.body.username : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() || null : null;
    const username = normalizeUsername(usernameRaw);
    if (username.length < 2 || username.length > 100) {
        res.status(400).json({ error: 'Username 2–100 karakter (huruf/angka/underscore).' });
        return;
    }
    if (!/^[a-z0-9._-]+$/.test(username)) {
        res.status(400).json({ error: 'Username hanya huruf kecil, angka, . _ -' });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ error: 'Password minimal 6 karakter.' });
        return;
    }
    try {
        const ph = await hashPassword(password);
        await query(`INSERT INTO cmms_app_users (username, password_hash, display_name)
       VALUES ($1, $2, $3)`, [username, ph, displayName]);
    }
    catch (e) {
        const err = e;
        if (err?.code === '23505') {
            res.status(409).json({ error: 'Username sudah dipakai.' });
            return;
        }
        console.error(e);
        res.status(500).json({ error: 'Gagal membuat akun.' });
        return;
    }
    await loadAuthSettings();
    const token = signToken(username, AUTH_SECRET, displayName);
    res.status(201).json({
        token,
        user: { username, displayName: displayName ?? undefined },
    });
});
authRouter.post('/login', async (req, res) => {
    const usernameRaw = typeof req.body?.username === 'string' ? req.body.username : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const username = normalizeUsername(usernameRaw);
    if (!username || !password) {
        res.status(400).json({ error: 'Username dan password wajib diisi' });
        return;
    }
    if (useDbAuth()) {
        try {
            const r = await query(`SELECT username, password_hash, display_name FROM cmms_app_users
         WHERE lower(username) = $1 AND is_active = true`, [username]);
            const row = r.rows[0];
            if (!row || !(await verifyPassword(password, row.password_hash))) {
                res.status(401).json({ error: 'Username atau password salah' });
                return;
            }
            const token = signToken(row.username, AUTH_SECRET, row.display_name);
            res.json({
                token,
                user: {
                    username: row.username,
                    displayName: row.display_name ?? undefined,
                },
            });
        }
        catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Gagal login' });
        }
        return;
    }
    if (AUTH_USER.length > 0 && AUTH_PASS.length > 0) {
        const userOk = username === normalizeUsername(AUTH_USER) && password === AUTH_PASS;
        if (!userOk) {
            res.status(401).json({ error: 'Username atau password salah' });
            return;
        }
        const token = signToken(username, AUTH_SECRET);
        res.json({ token, user: { username } });
        return;
    }
    res.status(503).json({
        error: 'Login belum dikonfigurasi. Buat tabel cmms_app_users + pengguna (migrasi & npm run user:create), atau set CMMS_AUTH_USERNAME / CMMS_AUTH_PASSWORD di .env',
    });
});
authRouter.get('/me', (req, res) => {
    if (!isLoginConfigured()) {
        res.json({ user: null, loginRequired: false });
        return;
    }
    const header = req.get('authorization');
    const raw = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!raw) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const v = verifyToken(raw, AUTH_SECRET);
    if (!v.ok) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    res.json({
        user: {
            username: v.username,
            displayName: v.displayName,
        },
        loginRequired: true,
    });
});
export function verifyRequestAuth(authorization) {
    if (!isLoginConfigured())
        return true;
    const raw = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!raw)
        return false;
    return verifyToken(raw, AUTH_SECRET).ok;
}

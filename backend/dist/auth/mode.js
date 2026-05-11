import { query } from '../db/index.js';
const cache = {
    loaded: false,
    loginRequired: false,
    useDbAuth: false,
    bootstrapAllowed: false,
    authMode: 'none',
};
function hasEnvCredentials() {
    const u = (process.env.CMMS_AUTH_USERNAME ?? '').trim();
    const p = (process.env.CMMS_AUTH_PASSWORD ?? '').trim();
    return u.length > 0 && p.length > 0;
}
/** Panggil saat startup (dan setelah user pertama didaftarkan). */
export async function loadAuthSettings() {
    let tableExists = false;
    let userCount = 0;
    try {
        const ex = await query(`SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'cmms_app_users'
      ) AS exists`);
        tableExists = !!ex.rows[0]?.exists;
        if (tableExists) {
            const c = await query("SELECT COUNT(*)::text AS n FROM cmms_app_users WHERE is_active = true");
            userCount = parseInt(c.rows[0]?.n ?? '0', 10);
        }
    }
    catch {
        tableExists = false;
        userCount = 0;
    }
    const hasDbUsers = tableExists && userCount > 0;
    const envOn = hasEnvCredentials();
    cache.useDbAuth = hasDbUsers;
    cache.bootstrapAllowed = tableExists && userCount === 0;
    cache.loginRequired = envOn || hasDbUsers;
    if (hasDbUsers)
        cache.authMode = 'db';
    else if (envOn)
        cache.authMode = 'env';
    else
        cache.authMode = 'none';
    cache.loaded = true;
}
export function getAuthState() {
    return cache;
}
export function isLoginConfigured() {
    return cache.loginRequired;
}
export function useDbAuth() {
    return cache.useDbAuth;
}
export function allowBootstrapRegister() {
    return cache.bootstrapAllowed;
}

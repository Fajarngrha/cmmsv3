import crypto from 'crypto';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
export function signToken(username, secret, displayName) {
    const payload = {
        sub: username,
        iat: Date.now(),
        exp: Date.now() + TTL_MS,
    };
    const dn = displayName?.trim();
    if (dn)
        payload.name = dn;
    const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${sig}`;
}
export function verifyToken(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 2)
        return { ok: false };
    const [data, sig] = parts;
    if (!data || !sig)
        return { ok: false };
    const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    const sigBuf = Buffer.from(sig, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length)
        return { ok: false };
    if (!crypto.timingSafeEqual(sigBuf, expBuf))
        return { ok: false };
    try {
        const json = Buffer.from(data, 'base64url').toString('utf8');
        const payload = JSON.parse(json);
        if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number')
            return { ok: false };
        if (Date.now() > payload.exp)
            return { ok: false };
        const displayName = typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : undefined;
        return { ok: true, username: payload.sub, displayName };
    }
    catch {
        return { ok: false };
    }
}

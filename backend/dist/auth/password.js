import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
const scryptAsync = promisify(scrypt);
/** Format disimpan: saltHex:keyHex (scrypt 64 byte) */
export async function hashPassword(plain) {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scryptAsync(plain, salt, 64));
    return `${salt}:${derived.toString('hex')}`;
}
export async function verifyPassword(plain, stored) {
    const parts = stored.split(':');
    if (parts.length !== 2)
        return false;
    const [salt, keyHex] = parts;
    if (!salt || !keyHex || keyHex.length % 2 !== 0)
        return false;
    try {
        const expected = (await scryptAsync(plain, salt, 64));
        const actual = Buffer.from(keyHex, 'hex');
        if (actual.length !== expected.length)
            return false;
        return timingSafeEqual(actual, expected);
    }
    catch {
        return false;
    }
}

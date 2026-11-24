import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from './db/index.js'

interface DbUserRow {
  id: number
  username: string
  password_hash: string
  display_name: string
  role: string
  is_active: boolean
}

interface SeedUser {
  username: string
  password: string
  displayName: string
  role: string
}

export interface AuthUser {
  id: number
  username: string
  displayName: string
  role: string
}

const DEFAULT_AUTH_USERS: SeedUser[] = [
  { username: 'adminmtn', password: 'Admin!#2026', displayName: 'Administrator', role: 'Admin' },
  { username: 'warehouse-2w', password: 'Warehouse!#2026', displayName: 'Warehouse 2W', role: 'Admin' },
  { username: 'Erwin Sutarno', password: 'Mngmtn!#2026', displayName: 'Erwin Sutarno', role: 'Manager' },
]

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h'
const SALT_ROUNDS = 10

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.trim().length < 16) {
    throw new Error('JWT_SECRET wajib diisi (minimal 16 karakter) untuk keamanan login.')
  }
  return secret
}

function toAuthUser(row: DbUserRow): AuthUser {
  return {
    id: Number(row.id),
    username: row.username,
    displayName: row.display_name,
    role: row.role,
  }
}

export async function ensureAuthSchema(): Promise<void> {
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
  `)
}

/** Menyelaraskan baris untuk setiap akun seed dengan DEFAULT_AUTH_USERS (username, hash kata sandi, profil). */
export async function ensureDefaultUsers(): Promise<void> {
  for (const user of DEFAULT_AUTH_USERS) {
    const hash = await bcrypt.hash(user.password, SALT_ROUNDS)
    await query(
      `INSERT INTO app_users (username, password_hash, display_name, role, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (username) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         role = EXCLUDED.role,
         is_active = TRUE,
         updated_at = CURRENT_TIMESTAMP`,
      [user.username, hash, user.displayName, user.role]
    )
  }
  console.log('[auth] Seed users synced:', DEFAULT_AUTH_USERS.map((u) => u.username).join(', '))
}

export async function ensureSparePartHistoryValidation(): Promise<void> {
  await query(`
    ALTER TABLE spare_part_history
    ADD COLUMN IF NOT EXISTS validated_by VARCHAR(120)
  `)
  await query(`ALTER TABLE spare_part_history DROP CONSTRAINT IF EXISTS spare_part_history_type_check`)
  await query(`
    ALTER TABLE spare_part_history
    ADD CONSTRAINT spare_part_history_type_check
    CHECK (type IN ('in', 'out', 'edit'))
  `)
  await query(`ALTER TABLE spare_part_history ADD COLUMN IF NOT EXISTS section VARCHAR(100)`)
  await query(`
    UPDATE spare_part_history h
    SET section = COALESCE(NULLIF(TRIM(p.section), ''), 'Umum')
    FROM spare_parts p
    WHERE h.part_id = p.id
      AND (h.section IS NULL OR TRIM(h.section) = '')
  `)
  await query(`UPDATE spare_part_history SET section = 'Umum' WHERE section IS NULL OR TRIM(section) = ''`)
  await query(`CREATE INDEX IF NOT EXISTS idx_spare_part_history_section ON spare_part_history (section)`)
}

export async function ensureSparePartsSection(): Promise<void> {
  await query(`ALTER TABLE spare_parts ADD COLUMN IF NOT EXISTS section VARCHAR(100)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_spare_parts_section ON spare_parts (section)`)
  await query(`UPDATE spare_parts SET section = 'Umum' WHERE section IS NULL OR TRIM(section) = ''`)
}

const MANAGER_ROLES = new Set(['admin', 'manager', 'supervisor'])

/** Nama + password akun Manager/Admin untuk mengesahkan perubahan stok. */
export async function verifyManagerApproval(
  name: string,
  password: string
): Promise<{ user?: AuthUser; error?: string }> {
  const normalized = name.trim().toLowerCase()
  if (!normalized || !password) {
    return { error: 'Manager dan password wajib diisi.' }
  }

  const result = await query<DbUserRow>(
    `SELECT id, username, password_hash, display_name, role, is_active
     FROM app_users
     WHERE LOWER(username) = $1 OR LOWER(display_name) = $1`,
    [normalized]
  )
  if (result.rows.length === 0) {
    return { error: 'Nama atau password manager tidak valid.' }
  }

  for (const row of result.rows) {
    if (!row.is_active) continue
    const valid = await bcrypt.compare(password, row.password_hash)
    if (!valid) continue
    if (!MANAGER_ROLES.has(row.role.trim().toLowerCase())) {
      return { error: 'Akun ini tidak berhak menyetujui update stok.' }
    }
    return { user: toAuthUser(row) }
  }

  return { error: 'Nama atau password manager tidak valid.' }
}

export async function verifyLogin(username: string, password: string): Promise<AuthUser | null> {
  const normalized = username.trim().toLowerCase()
  if (!normalized || !password) return null

  const result = await query<DbUserRow>(
    `SELECT id, username, password_hash, display_name, role, is_active
     FROM app_users
     WHERE LOWER(username) = $1
     LIMIT 1`,
    [normalized]
  )
  if (result.rows.length === 0) return null

  const row = result.rows[0]
  if (!row.is_active) return null

  const valid = await bcrypt.compare(password, row.password_hash)
  if (!valid) return null
  return toAuthUser(row)
}

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    { sub: String(user.id), username: user.username, displayName: user.displayName, role: user.role },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],}
  )
}

export function verifyAccessToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      sub: string
      username: string
      displayName: string
      role: string
    }
    return {
      id: Number(decoded.sub),
      username: decoded.username,
      displayName: decoded.displayName,
      role: decoded.role,
    }
  } catch {
    return null
  }
}

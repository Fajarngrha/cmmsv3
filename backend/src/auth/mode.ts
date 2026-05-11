import { query } from '../db/index.js'

export type AuthMode = 'none' | 'env' | 'db'

type Cache = {
  loaded: boolean
  loginRequired: boolean
  useDbAuth: boolean
  bootstrapAllowed: boolean
  authMode: AuthMode
}

const cache: Cache = {
  loaded: false,
  loginRequired: false,
  useDbAuth: false,
  bootstrapAllowed: false,
  authMode: 'none',
}

function hasEnvCredentials(): boolean {
  const u = (process.env.CMMS_AUTH_USERNAME ?? '').trim()
  const p = (process.env.CMMS_AUTH_PASSWORD ?? '').trim()
  return u.length > 0 && p.length > 0
}

/** Panggil saat startup (dan setelah user pertama didaftarkan). */
export async function loadAuthSettings(): Promise<void> {
  let tableExists = false
  let userCount = 0
  try {
    const ex = await query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'cmms_app_users'
      ) AS exists`
    )
    tableExists = !!ex.rows[0]?.exists
    if (tableExists) {
      const c = await query<{ n: string }>(
        "SELECT COUNT(*)::text AS n FROM cmms_app_users WHERE is_active = true"
      )
      userCount = parseInt(c.rows[0]?.n ?? '0', 10)
    }
  } catch {
    tableExists = false
    userCount = 0
  }

  const hasDbUsers = tableExists && userCount > 0
  const envOn = hasEnvCredentials()

  cache.useDbAuth = hasDbUsers
  cache.bootstrapAllowed = tableExists && userCount === 0
  cache.loginRequired = envOn || hasDbUsers
  if (hasDbUsers) cache.authMode = 'db'
  else if (envOn) cache.authMode = 'env'
  else cache.authMode = 'none'
  cache.loaded = true
}

export function getAuthState(): Readonly<Cache> {
  return cache
}

export function isLoginConfigured(): boolean {
  return cache.loginRequired
}

export function useDbAuth(): boolean {
  return cache.useDbAuth
}

export function allowBootstrapRegister(): boolean {
  return cache.bootstrapAllowed
}

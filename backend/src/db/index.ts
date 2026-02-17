import pg from 'pg'

const { Pool } = pg

function getConfig(): pg.PoolConfig {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL }
  }
  const host = process.env.DB_HOST || 'localhost'
  const port = Number(process.env.DB_PORT) || 5432
  const user = process.env.DB_USER || 'postgres'
  const password = process.env.DB_PASSWORD || ''
  const database = process.env.DB_NAME || 'cmms_db'
  return { host, port, user, password, database }
}

export function isDbConfigured(): boolean {
  if (process.env.DATABASE_URL) return true
  return Boolean(process.env.DB_HOST || process.env.DB_USER || process.env.DB_NAME)
}

let pool: pg.Pool | null = null

/** Untuk debug: user dan database yang dipakai (tanpa password) */
export function getConnectionInfo(): string {
  const url = process.env.DATABASE_URL
  if (url) {
    try {
      const u = new URL(url)
      const user = u.username || '?'
      const db = u.pathname ? u.pathname.replace(/^\//, '').replace(/\?.*/, '') : '?'
      return `${user}@${db}`
    } catch {
      return 'DATABASE_URL (parse error)'
    }
  }
  const user = process.env.DB_USER || 'postgres'
  const db = process.env.DB_NAME || 'cmms_db'
  return `${user}@${db}`
}

export function getPool(): pg.Pool {
  if (!pool) {
    if (!isDbConfigured()) {
      throw new Error('Database not configured. Set DATABASE_URL or DB_* env vars.')
    }
    pool = new Pool(getConfig())
    console.log('[db] Pool created for', getConnectionInfo())
  }
  return pool
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params)
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

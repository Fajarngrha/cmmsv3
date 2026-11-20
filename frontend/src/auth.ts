export interface SessionUser {
  username: string
  displayName: string
  role: string
}

interface StoredAuthSession {
  token: string
  user: SessionUser
}

const SESSION_STORAGE_KEY = 'cmms-session-user'

/** Sesi baru: bearer token JWT + snapshot user untuk UI. */
export function setAuthSession(payload: StoredAuthSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
}

export function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAuthSession | SessionUser | null
    if (!parsed || typeof parsed !== 'object') return null
    if (!('token' in parsed)) {
      clearSessionUser()
      return null
    }
    const token = (parsed as StoredAuthSession).token
    return typeof token === 'string' ? token : null
  } catch {
    return null
  }
}

export function getSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAuthSession | SessionUser | null
    if (!parsed || typeof parsed !== 'object') return null
    const withToken = parsed as StoredAuthSession
    if (typeof withToken.token !== 'string' || !withToken.user?.username) {
      clearSessionUser()
      return null
    }
    return withToken.user
  } catch {
    return null
  }
}

export function clearSessionUser(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

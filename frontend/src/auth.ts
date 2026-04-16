export interface UserAccount {
  username: string
  password: string
  displayName: string
  role: string
}

export interface SessionUser {
  username: string
  displayName: string
  role: string
}

const USERS_STORAGE_KEY = 'cmms-users'
const SESSION_STORAGE_KEY = 'cmms-session-user'

const DEFAULT_USERS: UserAccount[] = [
  { username: 'admin', password: 'Admin_!#2026', displayName: 'Administrator', role: 'Admin' },
  { username: 'supervisor', password: 'supervisor123', displayName: 'Maintenance Supervisor', role: 'Supervisor' },
  { username: 'teknisi', password: 'teknisi123', displayName: 'Teknisi Maintenance', role: 'Technician' },
]

function readUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    }

    const parsed = JSON.parse(raw) as UserAccount[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    }

    return parsed
  } catch {
    return DEFAULT_USERS
  }
}

export function authenticateUser(username: string, password: string): SessionUser | null {
  const normalizedUsername = username.trim().toLowerCase()
  const users = readUsers()
  const matched = users.find(
    (user) => user.username.toLowerCase() === normalizedUsername && user.password === password
  )

  if (!matched) return null

  return {
    username: matched.username,
    displayName: matched.displayName,
    role: matched.role,
  }
}

export function getSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionUser
    if (!parsed?.username) return null
    return parsed
  } catch {
    return null
  }
}

export function setSessionUser(user: SessionUser): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
}

export function clearSessionUser(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

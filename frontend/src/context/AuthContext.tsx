import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiUrl, AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_DISPLAY_KEY } from '../api'

type AuthMode = 'none' | 'env' | 'db'

type AuthContextValue = {
  ready: boolean
  loginRequired: boolean
  authMode: AuthMode
  bootstrapAllowed: boolean
  token: string | null
  username: string | null
  displayName: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  registerBootstrap: (username: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

type SessionUser = { username: string; displayName?: string }

function persistSession(token: string, user: SessionUser) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem(AUTH_USER_KEY, user.username)
    if (user.displayName) localStorage.setItem(AUTH_DISPLAY_KEY, user.displayName)
    else localStorage.removeItem(AUTH_DISPLAY_KEY)
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [loginRequired, setLoginRequired] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('none')
  const [bootstrapAllowed, setBootstrapAllowed] = useState(false)
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY)
    } catch {
      return null
    }
  })
  const [username, setUsername] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_USER_KEY)
    } catch {
      return null
    }
  })
  const [displayName, setDisplayName] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_DISPLAY_KEY)
    } catch {
      return null
    }
  })

  useEffect(() => {
    let cancelled = false
    fetch(apiUrl('/api/auth/status'))
      .then((r) => r.json())
      .then((d: { loginRequired?: boolean; authMode?: AuthMode; bootstrapAllowed?: boolean }) => {
        if (cancelled) return
        setLoginRequired(!!d.loginRequired)
        setAuthMode(d.authMode ?? 'none')
        setBootstrapAllowed(!!d.bootstrapAllowed)
      })
      .catch(() => {
        if (!cancelled) {
          setLoginRequired(false)
          setAuthMode('none')
          setBootstrapAllowed(false)
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const applyAuthResponse = useCallback((data: { token?: string; user?: SessionUser }) => {
    const t = data.token
    if (!t) throw new Error('Respons server tidak valid')
    const u = data.user?.username
    if (!u) throw new Error('Respons server tidak valid')
    const dn = data.user?.displayName?.trim() || undefined
    persistSession(t, { username: u, displayName: dn })
    setToken(t)
    setUsername(u)
    setDisplayName(dn ?? null)
  }, [])

  const login = useCallback(
    async (user: string, password: string) => {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.trim(), password }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        token?: string
        user?: SessionUser
      }
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Login gagal')
      }
      applyAuthResponse(data)
    },
    [applyAuthResponse]
  )

  const registerBootstrap = useCallback(
    async (user: string, password: string, dn?: string) => {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.trim(),
          password,
          displayName: dn?.trim() || undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        token?: string
        user?: SessionUser
      }
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Pendaftaran gagal')
      }
      applyAuthResponse(data)
      setBootstrapAllowed(false)
      setLoginRequired(true)
      setAuthMode('db')
    },
    [applyAuthResponse]
  )

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
      localStorage.removeItem(AUTH_DISPLAY_KEY)
    } catch {
      /* ignore */
    }
    setToken(null)
    setUsername(null)
    setDisplayName(null)
  }, [])

  const isAuthenticated = !loginRequired || !!token

  const value = useMemo(
    () => ({
      ready,
      loginRequired,
      authMode,
      bootstrapAllowed,
      token,
      username,
      displayName,
      isAuthenticated,
      login,
      registerBootstrap,
      logout,
    }),
    [
      ready,
      loginRequired,
      authMode,
      bootstrapAllowed,
      token,
      username,
      displayName,
      isAuthenticated,
      login,
      registerBootstrap,
      logout,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus di dalam AuthProvider')
  return ctx
}

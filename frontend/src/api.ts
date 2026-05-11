/**
 * Base URL untuk API. Kosongkan jika frontend dan backend di origin yang sama.
 * Untuk production (frontend & backend terpisah), set VITE_API_URL di .env
 * contoh: VITE_API_URL=https://api.domain.com
 */
export const apiBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export const AUTH_TOKEN_KEY = 'cmms_auth_token'
export const AUTH_USER_KEY = 'cmms_auth_username'
export const AUTH_DISPLAY_KEY = 'cmms_auth_display_name'

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiBase}${p}`
}

/** fetch ke API dengan Bearer token jika sudah login; 401 → arahkan ke /login */
export function apiFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? undefined)
  try {
    const t = localStorage.getItem(AUTH_TOKEN_KEY)
    if (t) headers.set('Authorization', `Bearer ${t}`)
  } catch {
    /* ignore */
  }
  return fetch(input, { ...init, headers }).then((res) => {
    if (res.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname
      if (path !== '/login') {
        try {
          localStorage.removeItem(AUTH_TOKEN_KEY)
          localStorage.removeItem(AUTH_USER_KEY)
          localStorage.removeItem(AUTH_DISPLAY_KEY)
        } catch {
          /* ignore */
        }
        window.location.href = '/login'
      }
    }
    return res
  })
}

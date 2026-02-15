/**
 * Base URL untuk API. Kosongkan jika frontend dan backend di origin yang sama.
 * Untuk production (frontend & backend terpisah), set VITE_API_URL di .env
 * contoh: VITE_API_URL=https://api.domain.com
 */
export const apiBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiBase}${p}`
}

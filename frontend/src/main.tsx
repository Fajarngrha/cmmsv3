import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import { apiBase } from './api'
import { AUTH_DISPLAY_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY } from './api'
import './index.css'

const nativeFetch = window.fetch.bind(window)

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  let token: string | null = null
  try {
    token = localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    token = null
  }
  const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  const shouldAttachToken =
    Boolean(token) &&
    (requestUrl.startsWith('/api/') || requestUrl.startsWith(`${apiBase}/api/`) || requestUrl.startsWith(`${window.location.origin}/api/`))

  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
  if (shouldAttachToken && token) headers.set('Authorization', `Bearer ${token}`)

  return nativeFetch(input, { ...init, headers }).then((response) => {
    if (response.status === 401) {
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
        localStorage.removeItem(AUTH_DISPLAY_KEY)
      } catch {
        // ignore storage errors
      }
      if (!window.location.pathname.startsWith('/asset-history/')) {
        window.location.href = '/login'
      }
    }
    return response
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

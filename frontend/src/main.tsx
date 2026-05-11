import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import { apiBase } from './api'
import { clearSessionUser, getAccessToken } from './auth'
import './index.css'

const nativeFetch = window.fetch.bind(window)

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const token = getAccessToken()
  const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  const shouldAttachToken =
    Boolean(token) &&
    (requestUrl.startsWith('/api/') || requestUrl.startsWith(`${apiBase}/api/`) || requestUrl.startsWith(`${window.location.origin}/api/`))

  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
  if (shouldAttachToken && token) headers.set('Authorization', `Bearer ${token}`)

  return nativeFetch(input, { ...init, headers }).then((response) => {
    if (response.status === 401) {
      clearSessionUser()
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

import { FormEvent, useState } from 'react'
import { apiUrl } from '../api'
import { setAuthSession } from '../auth'

interface LoginProps {
  onLoginSuccess: () => void
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string
          token?: string
          user?: { username: string; displayName: string; role: string }
        }

        if (!response.ok || !payload.token || !payload.user) {
          throw new Error(payload.error || 'Username atau password tidak valid.')
        }

        setAuthSession({ token: payload.token, user: payload.user })
        onLoginSuccess()
      })
      .catch((err: Error) => {
        setError(err.message || 'Gagal login.')
        setIsSubmitting(false)
      })
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src="/logo.png" alt="FID Maintenance System" className="login-logo" />
          <p className="login-eyebrow">CMMS Platform</p>
          <h1>Maintenance System</h1>
          <p className="login-subtitle">Masuk untuk mengakses dashboard monitoring maintenance.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn-primary login-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <p className="login-helper">
          Multi user aktif. Untuk menambah akun, cukup isi data user baru di backend (tabel <code>app_users</code>).
        </p>
      </div>
    </div>
  )
}

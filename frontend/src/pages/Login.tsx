<<<<<<< HEAD
import { useState, FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Panel = 'login' | 'register'

export function Login() {
  const { ready, isAuthenticated, login, bootstrapAllowed, registerBootstrap, authMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const rawFrom = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  const from =
    rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/dashboard'

  const [panel, setPanel] = useState<Panel>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regDisplay, setRegDisplay] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  if (ready && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Isi username dan password.')
      return
    }
    setSubmitting(true)
    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!regUsername.trim() || !regPassword) {
      setError('Isi username dan password.')
      return
    }
    setSubmitting(true)
    try {
      await registerBootstrap(regUsername, regPassword, regDisplay)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pendaftaran gagal')
    } finally {
      setSubmitting(false)
    }
  }

  const subtitle =
    authMode === 'db'
      ? 'Masuk dengan akun pengguna Anda.'
      : 'Gunakan akun dari server (database atau env).'

  return (
    <div className="login-page">
      <div className="login-panel login-panel-brand">
        <div className="login-brand-inner">
          <img src="/logo.png" alt="" className="login-logo" />
          <h1 className="login-brand-title">FID Maintenance System</h1>
          <p className="login-brand-tagline">
            CMMS terpusat untuk permintaan perbaikan, aset, inventory, dan preventive maintenance.
          </p>
          <ul className="login-brand-bullets" aria-hidden="true">
            <li>Monitoring KPI & downtime</li>
            <li>Tracking work order & PO</li>
            <li>Jadwal PM yang terstruktur</li>
          </ul>
          {authMode === 'db' ? (
            <p className="login-brand-concurrent" role="note">
              Beberapa perangkat boleh login bersamaan dengan akun yang sama; setiap sesi memakai token
              sendiri.
            </p>
          ) : null}
        </div>
        <div className="login-brand-glow" aria-hidden="true" />
      </div>

      <div className="login-panel login-panel-form">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2 className="login-form-title">{panel === 'login' ? 'Masuk' : 'Akun pertama'}</h2>
            <p className="login-form-subtitle">
              {panel === 'login' ? subtitle : 'Buat administrator pertama. Hanya tersedia jika belum ada pengguna di database.'}
            </p>
          </div>

          {bootstrapAllowed ? (
            <div className="login-tabs" role="tablist" aria-label="Mode akses">
              <button
                type="button"
                role="tab"
                aria-selected={panel === 'login'}
                className={`login-tab ${panel === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setPanel('login')
                  setError('')
                }}
              >
                Masuk
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={panel === 'register'}
                className={`login-tab ${panel === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setPanel('register')
                  setError('')
                }}
              >
                Daftar pertama
              </button>
            </div>
          ) : null}

          {!ready ? (
            <div className="login-status">Memeriksa konfigurasi server…</div>
          ) : panel === 'login' ? (
            <form className="login-form" onSubmit={handleLogin} noValidate>
              {error ? (
                <div className="login-alert" role="alert">
                  {error}
                </div>
              ) : null}

              <div className="form-group login-field">
                <label className="label" htmlFor="login-username">
                  Username
                </label>
                <input
                  id="login-username"
                  className="input login-input"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="contoh: admin"
                  disabled={submitting}
                />
              </div>

              <div className="form-group login-field">
                <label className="label" htmlFor="login-password">
                  Password
                </label>
                <div className="login-password-wrap">
                  <input
                    id="login-password"
                    className="input login-input"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
                {submitting ? 'Memproses…' : 'Masuk'}
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleRegister} noValidate>
              {error ? (
                <div className="login-alert" role="alert">
                  {error}
                </div>
              ) : null}

              <div className="form-group login-field">
                <label className="label" htmlFor="reg-username">
                  Username
                </label>
                <input
                  id="reg-username"
                  className="input login-input"
                  name="username"
                  autoComplete="username"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="huruf kecil, angka, . _ -"
                  disabled={submitting}
                />
              </div>

              <div className="form-group login-field">
                <label className="label" htmlFor="reg-display">
                  Nama tampilan (opsional)
                </label>
                <input
                  id="reg-display"
                  className="input login-input"
                  name="displayName"
                  autoComplete="name"
                  value={regDisplay}
                  onChange={(e) => setRegDisplay(e.target.value)}
                  placeholder="contoh: Maintenance Admin"
                  disabled={submitting}
                />
              </div>

              <div className="form-group login-field">
                <label className="label" htmlFor="reg-password">
                  Password
                </label>
                <div className="login-password-wrap">
                  <input
                    id="reg-password"
                    className="input login-input"
                    name="password"
                    type={showRegPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="minimal 6 karakter"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    aria-label={showRegPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setShowRegPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showRegPassword ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
                {submitting ? 'Memproses…' : 'Buat akun & masuk'}
              </button>
            </form>
          )}

          <p className="login-footer-note">Hak akses sesuai maintenance.</p>
        </div>
=======
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
>>>>>>> e9013e01e2e0e24f3f5ee2b7694d2a62b75c3017
      </div>
    </div>
  )
}

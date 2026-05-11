import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { ready, loginRequired, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="auth-loading" role="status" aria-label="Memuat">
        <div className="auth-loading-spinner" />
        <span>Memuat…</span>
      </div>
    )
  }

  if (loginRequired && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

import { ReactNode, useState } from 'react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'

const SIDEBAR_COLLAPSED_KEY = 'cmms-sidebar-collapsed'

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  const toggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      } catch {}
      return next
    })
  }

  return (
    <div className="app">
      <div className="sidebar-backdrop" data-open={sidebarOpen} aria-hidden="true" onClick={() => setSidebarOpen(false)} />
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapseToggle={toggleCollapse}
      />
      <div className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </div>
    </div>
  )
}

export function Sidebar({
  mobileOpen,
  onClose,
  collapsed = false,
  onCollapseToggle,
}: {
  mobileOpen?: boolean
  onClose?: () => void
  collapsed?: boolean
  onCollapseToggle?: () => void
}) {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '▦' },
    { to: '/permintaan-perbaikan', label: 'Permintaan perbaikan', icon: '📋' },
    { to: '/assets', label: 'Assets', icon: '🔧' },
    { to: '/inventory', label: 'Inventory', icon: '📦' },
    { to: '/tracking-po', label: 'Tracking PO', icon: '📄' },
    { to: '/preventive-maintenance', label: 'Preventive Maintenance', icon: '📅' },
  ]
  return (
    <aside className="sidebar" data-mobile-open={mobileOpen} data-collapsed={collapsed}>
      <div className="sidebar-brand">
        <button type="button" className="sidebar-close-mobile" aria-label="Tutup menu" onClick={onClose}>
          ×
        </button>
        <img src="/logo.png" alt="FID Maintenance System" className="sidebar-logo" />
        <span className="sidebar-title">FID</span>
        <span className="sidebar-subtitle">Maintenance System</span>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
            title={label}
          >
            <span className="sidebar-link-icon">{icon}</span>
            <span className="sidebar-link-text">{label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        className="sidebar-collapse"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onCollapseToggle}
      >
        <span className="sidebar-collapse-icon">{collapsed ? '>' : '<'}</span>
        <span className="sidebar-collapse-text">{collapsed ? 'Expand' : 'Collapse'}</span>
      </button>
    </aside>
  )
}

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '2026-01', label: 'Januari 2026' },
  { value: '2026-02', label: 'Februari 2026' },
  { value: '2026-03', label: 'Maret 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'Mei 2026' },
  { value: '2026-06', label: 'Juni 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-10', label: 'Oktober 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'Desember 2026' },
]

const SECTION_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Molding', label: 'Molding' },
  { value: 'PM Finishing', label: 'PM Finishing' },
  { value: 'PM Cam Boss', label: 'PM Cam Boss' },
  { value: 'Heat Treatment', label: 'Heat Treatment' },
  { value: 'Machine 1', label: 'Machine 1' },
  { value: 'Machine 2', label: 'Machine 2' },
  { value: 'Pulley Assy', label: 'Pulley Assy' },
  { value: 'Die Casting', label: 'Die Casting' },
  { value: 'Press', label: 'Press' },
  { value: 'Line 1', label: 'Line 1' },
  { value: 'Line 2', label: 'Line 2' },
  { value: 'Line 3', label: 'Line 3' },
]

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const titles: Record<string, string> = {
    '/dashboard': 'DASHBOARD - MAINTENANCE',
    '/permintaan-perbaikan': 'PERMINTAAN PERBAIKAN',
    '/assets': 'Assets',
    '/inventory': 'Inventory',
    '/tracking-po': 'Tracking PO',
    '/preventive-maintenance': 'Preventive Maintenance',
  }
  const title = titles[location.pathname] ?? 'CMMS - Maintenance'

  const isDashboard = location.pathname === '/dashboard'
  const period = searchParams.get('period') ?? 'all'
  const section = searchParams.get('section') ?? 'all'

  const setPeriod = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('period', value)
      return next
    })
  }
  const setSection = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('section', value)
      return next
    })
  }

  return (
    <header className="header">
      <button
        type="button"
        className="header-menu-btn"
        aria-label="Buka menu navigasi"
        onClick={onMenuClick}
      >
        <span aria-hidden="true">☰</span>
      </button>
      {isDashboard && (
        <div className="header-filters">
          <select
            className="header-select"
            aria-label="Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            className="header-select"
            aria-label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            {SECTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          ↻ Refresh
        </button>
        <div className="header-user" role="button" tabIndex={0} aria-label="User menu">
          <span className="header-avatar">👤</span>
          <span>▼</span>
        </div>
      </div>
    </header>
  )
}

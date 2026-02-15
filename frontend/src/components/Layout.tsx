import { ReactNode } from 'react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Header />
        {children}
      </div>
    </div>
  )
}

export function Sidebar() {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '▦' },
    { to: '/work-orders', label: 'Work Orders', icon: '📋' },
    { to: '/assets', label: 'Assets', icon: '🔧' },
    { to: '/inventory', label: 'Inventory', icon: '📦' },
    { to: '/tracking-po', label: 'Tracking PO', icon: '📄' },
    { to: '/preventive-maintenance', label: 'Preventive Maintenance', icon: '📅' },
  ]
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">⚙️</span>
        <span className="sidebar-title">FCC</span>
        <span className="sidebar-subtitle">Maintenance System</span>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <button type="button" className="sidebar-collapse" aria-label="Collapse sidebar">
        &lt; Collapse
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

export function Header() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const titles: Record<string, string> = {
    '/dashboard': 'DASHBOARD - MAINTENANCE',
    '/work-orders': 'WORK ORDERS MANAGEMENT',
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

import { useEffect, useState } from 'react'
import { apiUrl } from '../api'
import { CreatePermintaanPerbaikanModal } from '../components/CreatePermintaanPerbaikanModal'
import { ViewPermintaanPerbaikanModal } from '../components/ViewPermintaanPerbaikanModal'
import { exportToCsv, type CsvColumn } from '../utils/exportToCsv'

interface PermintaanPerbaikanItem {
  id: string
  woId: string
  machineName: string
  machineBrand?: string
  section: string
  machineStatus?: string
  damageType: string
  status: string
  dueDate: string
  reportedBy: string
  technician?: string
  assigned?: string
  createdAt: string
  type?: string
}

const statusClass: Record<string, string> = {
  PM: 'badge-pm',
  Open: 'badge-open',
  Pending: 'badge-pending',
  'In Progress': 'badge-in-progress',
  Completed: 'badge-completed',
}

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All status' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'PM', label: 'PM' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
]

const ROWS_PER_PAGE = 50

export function PermintaanPerbaikan() {
  const [list, setList] = useState<PermintaanPerbaikanItem[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewWoId, setViewWoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (!actionMenuOpenId) return
    const close = () => setActionMenuOpenId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [actionMenuOpenId])

  const load = () => {
    fetch(apiUrl('/api/permintaan-perbaikan'))
      .then((r) => r.json())
      .then((data) => {
        setList(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = list
    .filter(
      (wo) =>
        wo.woId.toLowerCase().includes(search.toLowerCase()) ||
        wo.machineName.toLowerCase().includes(search.toLowerCase()) ||
        (wo.machineBrand ?? '').toLowerCase().includes(search.toLowerCase()) ||
        wo.section.toLowerCase().includes(search.toLowerCase()) ||
        (wo.damageType ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .filter((wo) => !statusFilter || wo.status === statusFilter)
  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ROWS_PER_PAGE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIdx = (safePage - 1) * ROWS_PER_PAGE
  const paginated = filtered.slice(startIdx, startIdx + ROWS_PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const total = list.length
  const open = list.filter((w) => w.status === 'Open').length
  const inProgress = list.filter((w) => w.status === 'In Progress').length
  const completed = list.filter((w) => w.status === 'Completed').length

  return (
    <div className="page">
      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>Kontrol Permintaan Perbaikan</h1>
      <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
        Kelola dan monitor semua permintaan perbaikan di sini
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div className="grid-4" style={{ flex: 1, minWidth: 200 }}>
          <StatBox
            label="Total WO"
            value={total}
            variant="blue"
            active={statusFilter === ''}
            onClick={() => setStatusFilter('')}
          />
          <StatBox
            label="Open"
            value={open}
            variant="red"
            active={statusFilter === 'Open'}
            onClick={() => setStatusFilter('Open')}
          />
          <StatBox
            label="In Progress"
            value={inProgress}
            variant="blue"
            active={statusFilter === 'In Progress'}
            onClick={() => setStatusFilter('In Progress')}
          />
          <StatBox
            label="Completed"
            value={completed}
            variant="green"
            active={statusFilter === 'Completed'}
            onClick={() => setStatusFilter('Completed')}
          />
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            const columns: CsvColumn<PermintaanPerbaikanItem>[] = [
              { header: 'No Registrasi', key: 'woId' },
              { header: 'Tanggal', getValue: (wo) => wo.createdAt.slice(0, 16).replace('T', ' ') },
              { header: 'Mesin', key: 'machineName' },
              { header: 'Merk', getValue: (wo) => wo.machineBrand ?? '—' },
              { header: 'Section', key: 'section' },
              { header: 'Status Mesin', getValue: (wo) => wo.machineStatus ?? '—' },
              { header: 'Kerusakan', key: 'damageType' },
              { header: 'Status Perbaikan', key: 'status' },
              { header: 'Pelapor', key: 'reportedBy' },
            ]
            exportToCsv(filtered, columns, `permintaan-perbaikan-${new Date().toISOString().slice(0, 10)}.csv`)
          }}
        >
          Export to CSV
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Permintaan perbaikan
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          className="input"
          placeholder="Cari permintaan perbaikan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="filter-status" style={{ fontSize: '0.875rem', color: '#64748b', whiteSpace: 'nowrap' }}>
            Filter by Status:
          </label>
          <select
            id="filter-status"
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: 160 }}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>No Registrasi</th>
                <th style={{ padding: '0.75rem' }}>Tanggal</th>
                <th style={{ padding: '0.75rem' }}>Mesin</th>
                <th style={{ padding: '0.75rem' }}>Merk</th>
                <th style={{ padding: '0.75rem' }}>Section</th>
                <th style={{ padding: '0.75rem' }}>Status Mesin</th>
                <th style={{ padding: '0.75rem' }}>Kerusakan</th>
                <th style={{ padding: '0.75rem' }}>Status Perbaikan</th>
                <th style={{ padding: '0.75rem' }}>Pelapor</th>
                <th style={{ padding: '0.75rem', width: 48, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((wo) => (
                <tr key={wo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <a href="#" style={{ color: '#3b82f6', fontWeight: 500 }}>{wo.woId}</a>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{wo.createdAt.slice(0, 16).replace('T', ' ')}</td>
                  <td style={{ padding: '0.75rem' }}>{wo.machineName}</td>
                  <td style={{ padding: '0.75rem' }}>{wo.machineBrand ?? '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{wo.section}</td>
                  <td style={{ padding: '0.75rem' }}>{wo.machineStatus ?? '—'}</td>
                  <td style={{ padding: '0.75rem', maxWidth: 220 }} title={wo.damageType}>
                    {wo.damageType.length > 60 ? `${wo.damageType.slice(0, 60)}…` : wo.damageType || '—'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${statusClass[wo.status] ?? 'badge-open'}`}>{wo.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{wo.reportedBy}</td>
                  <td style={{ padding: '0.5rem', width: 48, textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActionMenuOpenId((id) => (id === wo.id ? null : wo.id))
                        }}
                        className="btn"
                        style={{
                          padding: '0.4rem',
                          minWidth: 32,
                          height: 32,
                          background: actionMenuOpenId === wo.id ? '#e2e8f0' : 'transparent',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Aksi"
                        aria-label="Menu aksi"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                      {actionMenuOpenId === wo.id && (
                        <div
                          role="menu"
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: 4,
                            minWidth: 120,
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 50,
                            overflow: 'hidden',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            role="menuitem"
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#475569',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                            onClick={() => { setViewWoId(wo.id); setActionMenuOpenId(null) }}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#475569',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                            onClick={() => { setViewWoId(wo.id); setActionMenuOpenId(null) }}
                            title="Edit status: Open → In Progress → Close"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#991b1b',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                            onClick={() => {
                              setActionMenuOpenId(null)
                              if (window.confirm(`Hapus permintaan perbaikan ${wo.woId}?`)) {
                                fetch(apiUrl(`/api/permintaan-perbaikan/${wo.id}`), { method: 'DELETE' })
                                  .then((r) => { if (r.ok) load() })
                                  .catch(() => {})
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
            {totalFiltered > 0
              ? `Menampilkan ${startIdx + 1}-${startIdx + paginated.length} dari ${totalFiltered} permintaan perbaikan${statusFilter ? ` (filter: ${STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter})` : ''}`
              : 'Tidak ada permintaan perbaikan yang sesuai filter.'}
            {totalPages > 1 && (
              <span style={{ marginLeft: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  Sebelumnya
                </button>
                <span style={{ marginRight: '0.5rem' }}>Halaman {safePage} dari {totalPages}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  Berikutnya
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <CreatePermintaanPerbaikanModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false)
            load()
          }}
        />
      )}
      {viewWoId && (
        <ViewPermintaanPerbaikanModal
          permintaanPerbaikanId={viewWoId}
          onClose={() => setViewWoId(null)}
          onSuccess={() => {
            load()
            setViewWoId(null)
          }}
        />
      )}
    </div>
  )
}

function StatBox({
  label,
  value,
  variant,
  active,
  onClick,
}: {
  label: string
  value: number
  variant: 'blue' | 'red' | 'green'
  active?: boolean
  onClick?: () => void
}) {
  const border = { blue: '#3b82f6', red: '#ef4444', green: '#22c55e' }[variant]
  return (
    <div
      className="card"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      style={{
        borderLeft: `4px solid ${border}`,
        cursor: onClick ? 'pointer' : undefined,
        outline: active ? `2px solid ${border}` : undefined,
        outlineOffset: 2,
      }}
    >
      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{value}</div>
    </div>
  )
}

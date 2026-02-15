import { useEffect, useState } from 'react'
import { apiUrl } from '../api'
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal'
import { ViewWorkOrderModal } from '../components/ViewWorkOrderModal'

interface WorkOrder {
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

const STATUS_FILTER_OPTIONS: { value: ''; label: string }[] = [
  { value: '', label: 'All status' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'PM', label: 'PM' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
]

export function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewWoId, setViewWoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch(apiUrl('/api/work-orders'))
      .then((r) => r.json())
      .then((data) => {
        setWorkOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = workOrders
    .filter(
      (wo) =>
        wo.woId.toLowerCase().includes(search.toLowerCase()) ||
        wo.machineName.toLowerCase().includes(search.toLowerCase()) ||
        (wo.machineBrand ?? '').toLowerCase().includes(search.toLowerCase()) ||
        wo.section.toLowerCase().includes(search.toLowerCase()) ||
        (wo.damageType ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .filter((wo) => !statusFilter || wo.status === statusFilter)

  const total = workOrders.length
  const open = workOrders.filter((w) => w.status === 'Open').length
  const inProgress = workOrders.filter((w) => w.status === 'In Progress').length
  const completed = workOrders.filter((w) => w.status === 'Completed').length

  return (
    <div className="page">
      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>Work Orders</h1>
      <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
        Kelola dan monitor semua work order di sini
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
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Create Work Order
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          className="input"
          placeholder="Cari work order..."
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
                <th style={{ padding: '0.75rem' }}>Wo No</th>
                <th style={{ padding: '0.75rem' }}>Date & Time</th>
                <th style={{ padding: '0.75rem' }}>Machine</th>
                <th style={{ padding: '0.75rem' }}>Merk</th>
                <th style={{ padding: '0.75rem' }}>Section</th>
                <th style={{ padding: '0.75rem' }}>Status Machine</th>
                <th style={{ padding: '0.75rem' }}>Description</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Reported By</th>
                <th style={{ padding: '0.75rem', minWidth: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((wo) => (
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
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => setViewWoId(wo.id)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => setViewWoId(wo.id)}
                        title="Edit status: Open → In Progress → Close; fill closure details"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                        onClick={() => {
                          if (window.confirm(`Hapus work order ${wo.woId}?`)) {
                            fetch(apiUrl(`/api/work-orders/${wo.id}`), { method: 'DELETE' })
                              .then((r) => { if (r.ok) load() })
                              .catch(() => {})
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
            {filtered.length > 0
              ? `Menampilkan 1-${filtered.length} dari ${filtered.length} work orders${statusFilter ? ` (filter: ${STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter})` : ''}`
              : 'Tidak ada work order yang sesuai filter.'}
          </div>
        )}
      </div>

      {modalOpen && (
        <CreateWorkOrderModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false)
            load()
          }}
        />
      )}
      {viewWoId && (
        <ViewWorkOrderModal
          workOrderId={viewWoId}
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

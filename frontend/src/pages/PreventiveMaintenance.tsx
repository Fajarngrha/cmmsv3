import { useEffect, useState } from 'react'
import { apiUrl } from '../api'
import { SchedulePMModal } from '../components/SchedulePMModal'
import { ViewPMModal, type UpcomingPMDetail } from '../components/ViewPMModal'
import { exportToCsv, type CsvColumn } from '../utils/exportToCsv'

interface UpcomingPM {
  id: string
  pmId: string
  assetName: string
  activity: string
  scheduledDate: string
  assignedTo: string
}

interface DashboardKpis {
  pmCompliance: number
  pmComplianceRate: number
}

export function PreventiveMaintenance() {
  const [upcomingPM, setUpcomingPM] = useState<UpcomingPM[]>([])
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [loading, setLoading] = useState(true)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [viewPm, setViewPm] = useState<UpcomingPMDetail | null>(null)

  const load = () => {
    Promise.all([
      fetch(apiUrl('/api/dashboard/upcoming-pm')).then((r) => r.json()),
      fetch(apiUrl('/api/dashboard/kpis')).then((r) => r.json()),
    ])
      .then(([pm, k]) => {
        setUpcomingPM(pm)
        setKpis(k)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const pmZone = kpis
    ? kpis.pmCompliance >= 90
      ? 'green'
      : kpis.pmCompliance >= 70
        ? 'yellow'
        : 'red'
    : 'green'
  const zoneLabel = pmZone === 'green' ? 'On Track' : pmZone === 'yellow' ? 'Warning' : 'Needs Attention'

  return (
    <div className="page">
      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>Preventive Maintenance</h1>
      <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
        Plan and track PM schedules, manpower, and compliance
      </p>

      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div
          className="card"
          style={{
            borderLeft: `4px solid ${pmZone === 'green' ? '#22c55e' : pmZone === 'yellow' ? '#eab308' : '#ef4444'}`,
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>PM Compliance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{kpis?.pmCompliance ?? '—'}%</div>
          <span
            className="badge"
            style={{
              marginTop: '0.5rem',
              display: 'inline-block',
              background: pmZone === 'green' ? '#dcfce7' : pmZone === 'yellow' ? '#fef9c3' : '#fee2e2',
              color: pmZone === 'green' ? '#166534' : pmZone === 'yellow' ? '#854d0e' : '#991b1b',
            }}
          >
            {zoneLabel}
          </span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Upcoming This Week</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{upcomingPM.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            const columns: CsvColumn<UpcomingPM>[] = [
              { header: 'PM ID', key: 'pmId' },
              { header: 'Asset', key: 'assetName' },
              { header: 'Activity', key: 'activity' },
              { header: 'Scheduled Date', key: 'scheduledDate' },
              { header: 'Assigned To', key: 'assignedTo' },
            ]
            exportToCsv(upcomingPM, columns, `preventive-maintenance-${new Date().toISOString().slice(0, 10)}.csv`)
          }}
        >
          Export to CSV
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setScheduleModalOpen(true)}>
          + Schedule PM
        </button>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Upcoming PM Schedule</h3>
        {loading ? (
          <p style={{ padding: '1rem 0', color: '#64748b' }}>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>PM ID</th>
                <th style={{ padding: '0.75rem' }}>Asset</th>
                <th style={{ padding: '0.75rem' }}>Activity</th>
                <th style={{ padding: '0.75rem' }}>Scheduled Date</th>
                <th style={{ padding: '0.75rem' }}>Assigned To</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcomingPM.map((pm) => (
                <tr key={pm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <a href="#" style={{ color: '#3b82f6', fontWeight: 500 }}>{pm.pmId}</a>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{pm.assetName}</td>
                  <td style={{ padding: '0.75rem' }}>{pm.activity}</td>
                  <td style={{ padding: '0.75rem' }}>{pm.scheduledDate}</td>
                  <td style={{ padding: '0.75rem' }}>{pm.assignedTo}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => setViewPm(pm as UpcomingPMDetail)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                        onClick={() => {
                          if (window.confirm(`Hapus jadwal PM ${pm.pmId} (${pm.assetName})?`)) {
                            fetch(apiUrl(`/api/dashboard/upcoming-pm/${pm.id}`), { method: 'DELETE' })
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
        {!loading && upcomingPM.length === 0 && (
          <p style={{ padding: '1rem 0', color: '#64748b' }}>No upcoming PM tasks.</p>
        )}
      </div>

      {scheduleModalOpen && (
        <SchedulePMModal
          onClose={() => setScheduleModalOpen(false)}
          onSuccess={() => {
            setScheduleModalOpen(false)
            load()
          }}
        />
      )}

      {viewPm && (
        <ViewPMModal pm={viewPm} onClose={() => setViewPm(null)} onSuccess={() => load()} />
      )}
    </div>
  )
}

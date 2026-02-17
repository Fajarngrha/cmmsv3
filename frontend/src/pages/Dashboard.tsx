import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiUrl } from '../api'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { ViewPermintaanPerbaikanModal } from '../components/ViewPermintaanPerbaikanModal'

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
  createdAt: string
  type?: string
  totalDowntimeHours?: number
}

const statusClass: Record<string, string> = {
  PM: 'badge-pm',
  Open: 'badge-open',
  Pending: 'badge-pending',
  'In Progress': 'badge-in-progress',
  Completed: 'badge-completed',
}

interface DashboardKpis {
  pmCompliance: number
  totalDowntimeHours: number
  maintenanceCostIdr: number
  breakdownCount: number
  openWorkOrders: number
  overdueCount: number
  workOrdersDueToday: number
  assetsInMaintenance: number
  pmComplianceRate: number
}



interface UpcomingPM {
  id: string
  pmId: string
  assetName: string
  activity: string
  scheduledDate: string
  assignedTo: string
}



const PIE_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444']

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Mei', '06': 'Jun',
  '07': 'Jul', '08': 'Agu', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
}

interface PurchaseOrder {
  id: string
  tanggal: string
  totalHarga: number
}

interface Asset {
  id: string
  name: string
  section: string
}

export function Dashboard() {
  const [searchParams] = useSearchParams()
  const period = searchParams.get('period') ?? 'all'
  const section = searchParams.get('section') ?? 'all'

  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [upcomingPM, setUpcomingPM] = useState<UpcomingPM[]>([])
  const [permintaanPerbaikan, setPermintaanPerbaikan] = useState<PermintaanPerbaikanItem[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [viewWoId, setViewWoId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(apiUrl('/api/dashboard/kpis')).then((r) => r.json()),
      fetch(apiUrl('/api/dashboard/upcoming-pm')).then((r) => r.json()),
      fetch(apiUrl('/api/permintaan-perbaikan')).then((r) => r.json()),
      fetch(apiUrl('/api/purchase-orders')).then((r) => r.json()),
      fetch(apiUrl('/api/assets')).then((r) => r.json()),
    ]).then(([k, u, woList, poList, assetList]) => {
      setKpis(k)
      setUpcomingPM(u || [])
      setPermintaanPerbaikan((woList as PermintaanPerbaikanItem[]) || [])
      setPurchaseOrders((poList as PurchaseOrder[]) || [])
      setAssets((assetList as Asset[]) || [])
    })
  }, [])

  /** Filter WO menurut Period (createdAt) dan Section */
  const filteredWorkOrders = useMemo(() => {
    return permintaanPerbaikan.filter((wo) => {
      if (period !== 'all' && !wo.createdAt.startsWith(period)) return false
      if (section !== 'all' && wo.section !== section) return false
      return true
    })
  }, [permintaanPerbaikan, period, section])

  /** Filter PO menurut Period (tanggal) */
  const filteredPO = useMemo(() => {
    if (period === 'all') return purchaseOrders
    return purchaseOrders.filter((po) => po.tanggal.startsWith(period))
  }, [purchaseOrders, period])

  /** Filter Upcoming PM menurut Section (asset section) */
  const filteredUpcomingPM = useMemo(() => {
    if (section === 'all') return upcomingPM
    const sectionAssetNames = new Set(assets.filter((a) => a.section === section).map((a) => a.name))
    return upcomingPM.filter((pm) => sectionAssetNames.has(pm.assetName))
  }, [upcomingPM, section, assets])

  const upcomingPMSorted = useMemo(
    () => [...filteredUpcomingPM].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)).slice(0, 5),
    [filteredUpcomingPM]
  )

  const totalWO = filteredWorkOrders.length
  const openWO = filteredWorkOrders.filter((w) => w.status === 'Open').length
  const inProgressWO = filteredWorkOrders.filter((w) => w.status === 'In Progress').length
  const completedWO = filteredWorkOrders.filter((w) => w.status === 'Completed').length

  const totalDowntimeFromWOs = useMemo(
    () =>
      filteredWorkOrders.reduce(
        (sum, wo) => sum + (typeof wo.totalDowntimeHours === 'number' ? wo.totalDowntimeHours : 0),
        0
      ),
    [filteredWorkOrders]
  )

  const maintenanceCostIdr = useMemo(
    () => filteredPO.reduce((sum, po) => sum + (po.totalHarga ?? 0), 0),
    [filteredPO]
  )

  const woStatusFromFiltered = useMemo(
    () => ({
      completed: filteredWorkOrders.filter((w) => w.status === 'Completed').length,
      inProgress: filteredWorkOrders.filter((w) => w.status === 'In Progress').length,
      pending: filteredWorkOrders.filter((w) => w.status === 'Pending').length,
      open: filteredWorkOrders.filter((w) => w.status === 'Open').length,
    }),
    [filteredWorkOrders]
  )

  const pieData = useMemo(() => {
    const { completed, inProgress, pending, open } = woStatusFromFiltered
    const total = completed + inProgress + pending + open
    if (total === 0) return []
    return [
      { name: 'Completed', value: Math.round((completed / total) * 100), color: PIE_COLORS[0] },
      { name: 'In Progress', value: Math.round((inProgress / total) * 100), color: PIE_COLORS[1] },
      { name: 'Pending', value: Math.round((pending / total) * 100), color: PIE_COLORS[2] },
      { name: 'Open', value: Math.round((open / total) * 100), color: PIE_COLORS[3] },
    ]
  }, [woStatusFromFiltered])

  const trendFromFiltered = useMemo(() => {
    const byMonth: Record<string, { reactive: number; preventive: number }> = {}
    filteredWorkOrders.forEach((wo) => {
      const key = wo.createdAt.slice(0, 7)
      if (!byMonth[key]) byMonth[key] = { reactive: 0, preventive: 0 }
      if (wo.type === 'PM') byMonth[key].preventive += 1
      else byMonth[key].reactive += 1
    })
    const sorted = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]))
    return sorted.map(([key]) => {
      const m = key.slice(5, 7)
      return {
        month: MONTH_LABELS[m] ?? m,
        reactiveWOs: byMonth[key].reactive,
        preventiveWOs: byMonth[key].preventive,
      }
    })
  }, [filteredWorkOrders])

  const paretoFromFiltered = useMemo(() => {
    const byCause: Record<string, number> = {}
    filteredWorkOrders.forEach((wo) => {
      const hours = typeof wo.totalDowntimeHours === 'number' ? wo.totalDowntimeHours : 0
      if (hours <= 0) return
      const cause = wo.damageType?.slice(0, 20) || 'Lainnya'
      byCause[cause] = (byCause[cause] ?? 0) + hours
    })
    const entries = Object.entries(byCause)
      .map(([cause, hours]) => ({ cause, hours }))
      .sort((a, b) => b.hours - a.hours)
    let cum = 0
    const total = entries.reduce((s, e) => s + e.hours, 0)
    return entries.map((e) => {
      cum += e.hours
      return { cause: e.cause, hours: e.hours, cumulativePercent: total > 0 ? Math.round((cum / total) * 100) : 0 }
    })
  }, [filteredWorkOrders])

  const assetsInMaintenanceCount = filteredWorkOrders.filter((w) => w.status === 'In Progress').length

  const pmZone = kpis
    ? kpis.pmCompliance >= 90
      ? 'green'
      : kpis.pmCompliance >= 70
        ? 'yellow'
        : 'red'
    : 'green'

  return (
    <div className="page">
      {/* Ringkasan permintaan perbaikan - sama seperti halaman Permintaan perbaikan */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="grid-4" style={{ flex: 1, minWidth: 200 }}>
          <WoStatBox label="Total WO" value={totalWO} variant="blue" />
          <WoStatBox label="Open" value={openWO} variant="red" />
          <WoStatBox label="In Progress" value={inProgressWO} variant="blue" />
          <WoStatBox label="Completed" value={completedWO} variant="green" />
        </div>
      </div>

      {/* Row 1: KPI cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <KpiCard
          title="Preventive Maintenance"
          value={kpis ? `${kpis.pmCompliance}%` : '—'}
          sub={kpis ? (pmZone === 'green' ? 'On Track' : pmZone === 'yellow' ? 'Warning' : 'Problematic') : ''}
          color={pmZone === 'green' ? 'green' : pmZone === 'yellow' ? 'yellow' : 'red'}
          icon="⚙"
        />
        <KpiCard
          title="Total Downtime (Jam)"
          value={typeof totalDowntimeFromWOs === 'number' ? String(Math.round(totalDowntimeFromWOs * 100) / 100) : '—'}
          sub={period !== 'all' || section !== 'all' ? '' : 'Jam (dari permintaan perbaikan)'}
          color="orange"
          icon="📈"
        />
        <KpiCard
          title="Maintenance Cost (Rp)"
          value={`Rp. ${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(maintenanceCostIdr)}`}
          sub={period !== 'all' || section !== 'all' ? '' : ''}
          color="blue"
          icon="💰"
        />
      </div>

      {/* Assets in Maintenance + Upcoming PM Schedule (sejajar) */}
      <div className="dashboard-assets-pm-row" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          title="Assets in Maintenance"
          value={assetsInMaintenanceCount}
          sub="Sesuai filter (permintaan perbaikan In Progress)"
        />
        <div className="card">
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Upcoming PM Schedule</h3>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
            Preventive Maintenance (jadwal terdekat)
          </p>
          {upcomingPMSorted.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Tidak ada jadwal PM mendatang.</p>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.4rem 0.5rem' }}>PM ID</th>
                    <th style={{ padding: '0.4rem 0.5rem' }}>Asset</th>
                    <th style={{ padding: '0.4rem 0.5rem' }}>Activity</th>
                    <th style={{ padding: '0.4rem 0.5rem' }}>Scheduled Date</th>
                    <th style={{ padding: '0.4rem 0.5rem' }}>Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPMSorted.map((pm) => (
                    <tr key={pm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.4rem 0.5rem', fontWeight: 500 }}>{pm.pmId}</td>
                      <td style={{ padding: '0.4rem 0.5rem' }}>{pm.assetName}</td>
                      <td style={{ padding: '0.4rem 0.5rem' }}>{pm.activity}</td>
                      <td style={{ padding: '0.4rem 0.5rem' }}>{pm.scheduledDate}</td>
                      <td style={{ padding: '0.4rem 0.5rem' }}>{pm.assignedTo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Charts kiri | Status Permintaan perbaikan kanan */}
      <div className="dashboard-with-sidebar">
        <div className="dashboard-left" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card">
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Trend Maintenance (Monthly)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendFromFiltered} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reactiveWOs" name="Reactive WOs" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="preventiveWOs" name="Preventive WOs" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Downtime (Pareto)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={paretoFromFiltered} margin={{ top: 5, right: 50, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="cause" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: 'Cumulative %', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="hours" name="Downtime Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="Cumulative %" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="dashboard-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pieData.length > 0 && (
            <div className="card">
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Status Permintaan perbaikan</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name} ${value}%`}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Semua permintaan perbaikan (mengikuti filter Period & Section di header) */}
      <div className="card" style={{ marginTop: '1.5rem', overflow: 'auto' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Semua Permintaan perbaikan</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748b' }}>
          Filter: {period === 'all' ? 'All' : period} / {section === 'all' ? 'All' : section}
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>No Registrasi</th>
              <th style={{ padding: '0.75rem' }}>Date</th>
              <th style={{ padding: '0.75rem' }}>Machine</th>
              <th style={{ padding: '0.75rem' }}>Merk</th>
              <th style={{ padding: '0.75rem' }}>Section</th>
              <th style={{ padding: '0.75rem' }}>Status Machine</th>
              <th style={{ padding: '0.75rem' }}>Description</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Reported By</th>
              <th style={{ padding: '0.75rem', minWidth: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkOrders.map((wo) => (
              <tr key={wo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 500, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    onClick={() => setViewWoId(wo.id)}
                  >
                    {wo.woId}
                  </button>
                </td>
                <td style={{ padding: '0.75rem' }}>{wo.createdAt.slice(0, 16).replace('T', ' ')}</td>
                <td style={{ padding: '0.75rem' }}>{wo.machineName}</td>
                <td style={{ padding: '0.75rem' }}>{wo.machineBrand ?? '—'}</td>
                <td style={{ padding: '0.75rem' }}>{wo.section}</td>
                <td style={{ padding: '0.75rem' }}>{wo.machineStatus ?? '—'}</td>
                <td style={{ padding: '0.75rem', maxWidth: 200 }} title={wo.damageType}>
                  {wo.damageType.length > 60 ? `${wo.damageType.slice(0, 60)}…` : wo.damageType || '—'}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span className={`badge ${statusClass[wo.status] ?? 'badge-open'}`}>{wo.status}</span>
                </td>
                <td style={{ padding: '0.75rem' }}>{wo.reportedBy}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                    onClick={() => setViewWoId(wo.id)}
                  >
                    View / Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
          {filteredWorkOrders.length > 0
            ? `Menampilkan ${filteredWorkOrders.length} permintaan perbaikan${permintaanPerbaikan.length !== filteredWorkOrders.length ? ` (filter dari ${permintaanPerbaikan.length} total)` : ''}`
            : 'Tidak ada permintaan perbaikan yang sesuai filter.'}
        </div>
      </div>

      {viewWoId && (
        <ViewPermintaanPerbaikanModal
          permintaanPerbaikanId={viewWoId}
          onClose={() => setViewWoId(null)}
          onSuccess={() => {
            fetch(apiUrl('/api/permintaan-perbaikan'))
              .then((r) => r.json())
              .then(setPermintaanPerbaikan)
            setViewWoId(null)
          }}
        />
      )}
    </div>
  )
}

function WoStatBox({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant: 'blue' | 'red' | 'green'
}) {
  const border = { blue: '#3b82f6', red: '#ef4444', green: '#22c55e' }[variant]
  return (
    <div className="card" style={{ borderLeft: `4px solid ${border}` }}>
      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{value}</div>
    </div>
  )
}

function KpiCard({
  title,
  value,
  sub,
  color,
  icon,
}: {
  title: string
  value: string
  sub?: string
  color: 'green' | 'orange' | 'blue' | 'red' | 'yellow'
  icon: string
}) {
  const bg: Record<string, string> = {
    green: '#dcfce7',
    orange: '#ffedd5',
    blue: '#dbeafe',
    red: '#fee2e2',
    yellow: '#fef9c3',
  }
  return (
    <div className="card" style={{ background: bg[color] ?? '#fff', borderColor: 'transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>{title}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{value}</div>
          {sub && <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{sub}</div>}
        </div>
        <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>{icon}</span>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  sub,
  badge,
  progress,
}: {
  title: string
  value: string | number
  sub?: string
  badge?: { text: string; type: 'red' | 'blue' | 'green' }
  progress?: number
}) {
  const badgeClass = badge ? `badge-${badge.type === 'red' ? 'open' : badge.type === 'blue' ? 'in-progress' : 'completed'}` : ''
  return (
    <div className="card">
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{sub}</div>}
      {badge && <span className={`badge ${badgeClass}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>{badge.text}</span>}
      {progress != null && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#22c55e', borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Progress {progress}%</div>
        </div>
      )}
    </div>
  )
}

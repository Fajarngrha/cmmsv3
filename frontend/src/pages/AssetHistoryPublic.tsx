import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiUrl } from '../api'
import { formatBulanTahunInstalasi, hitungUsiaMesin } from '../utils/assetAge'

interface Asset {
  id: string
  assetId: string
  name: string
  section: string
  health: 'Running' | 'Warning' | 'Breakdown'
  lastPmDate: string
  nextPmDate: string
  uptimePercent: number
  installedAt?: string
}

interface WorkOrder {
  id: string
  woId: string
  type?: string
  status: string
  damageType: string
  repairsPerformed?: string
  technician?: string
  totalDowntimeHours?: number
  createdAt: string
  closedAt?: string
  replacedSpareParts?: string
  replacedPartsSpec?: string
  replacedPartsQty?: number
}

interface AssetHistoryResponse {
  asset: Asset
  qrUrl: string
  repairHistory: WorkOrder[]
  sparePartsReplaced: WorkOrder[]
}

const healthLabels: Record<string, string> = {
  Running: 'Running Smoothly',
  Warning: 'Needs Attention',
  Breakdown: 'Out of Service',
}

function formatDateTime(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}

export function AssetHistoryPublic() {
  const { assetId } = useParams()
  const [data, setData] = useState<AssetHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setLoading(false)
      setError('Asset ID tidak valid.')
      return
    }

    setLoading(true)
    setError(null)
    fetch(apiUrl(`/api/assets/${encodeURIComponent(assetId)}/history`))
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error || 'Gagal mengambil data asset.')
        }
        return r.json()
      })
      .then((json: AssetHistoryResponse) => setData(json))
      .catch((e: Error) => setError(e.message || 'Terjadi kesalahan.'))
      .finally(() => setLoading(false))
  }, [assetId])

  const lastPmDate = useMemo(() => {
    if (!data) return '—'
    const pm = data.repairHistory.find((wo) => (wo.type || '').toLowerCase() === 'pm')
    return pm?.closedAt?.slice(0, 10) || data.asset.lastPmDate || '—'
  }, [data])

  return (
    <div className="page" style={{ paddingTop: '1rem' }}>
      <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem' }}>
        Detail Asset {data?.asset.assetId ? `— ${data.asset.assetId}` : ''}
      </h1>
      <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.9rem' }}>
        Halaman ini dapat dibuka langsung dari QR code mesin.
      </p>

      {loading ? (
        <div className="card">
          <p style={{ margin: 0, color: '#64748b' }}>Memuat data asset...</p>
        </div>
      ) : error ? (
        <div className="card">
          <p style={{ margin: 0, color: '#991b1b' }}>{error}</p>
        </div>
      ) : data ? (
        <>
          <section className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Data Mesin</h3>
            <div className="wo-detail-grid">
              <div className="wo-detail-row"><span className="wo-detail-label">Asset ID</span><span className="wo-detail-value">{data.asset.assetId}</span></div>
              <div className="wo-detail-row"><span className="wo-detail-label">Nama</span><span className="wo-detail-value">{data.asset.name}</span></div>
              <div className="wo-detail-row"><span className="wo-detail-label">Section</span><span className="wo-detail-value">{data.asset.section}</span></div>
              <div className="wo-detail-row"><span className="wo-detail-label">Health</span><span className="wo-detail-value">{healthLabels[data.asset.health] ?? data.asset.health}</span></div>
              <div className="wo-detail-row"><span className="wo-detail-label">Uptime</span><span className="wo-detail-value">{data.asset.uptimePercent}%</span></div>
              <div className="wo-detail-row"><span className="wo-detail-label">Bulan & Tahun Instalasi</span><span className="wo-detail-value">{formatBulanTahunInstalasi(data.asset.installedAt)}</span></div>
              <div className="wo-detail-row"><span className="wo-detail-label">Usia Mesin</span><span className="wo-detail-value">{hitungUsiaMesin(data.asset.installedAt)}</span></div>
              <div className="wo-detail-row"><span className="wo-detail-label">Terakhir dilakukan PM</span><span className="wo-detail-value">{lastPmDate}</span></div>
              <div className="wo-detail-row"><span className="wo-detail-label">Next PM</span><span className="wo-detail-value">{data.asset.nextPmDate || '—'}</span></div>
            </div>
          </section>

          <section className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Riwayat Perbaikan Completed</h3>
            {data.repairHistory.length === 0 ? (
              <p style={{ margin: 0, color: '#64748b' }}>Belum ada riwayat perbaikan completed untuk asset ini.</p>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem' }}>No Registrasi</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Tanggal Selesai</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Jenis</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Deskripsi Kerusakan</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Tindakan Perbaikan</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Teknisi</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Downtime (jam)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.repairHistory.map((wo) => (
                      <tr key={wo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.woId}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{formatDateTime(wo.closedAt)}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.type || '—'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.damageType || '—'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.repairsPerformed || '—'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.technician || '—'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.totalDowntimeHours != null ? wo.totalDowntimeHours : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

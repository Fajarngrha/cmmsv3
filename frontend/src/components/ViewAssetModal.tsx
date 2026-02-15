import { useEffect, useState } from 'react'
import { apiUrl } from '../api'
import { hitungUsiaMesin, formatBulanTahunInstalasi } from '../utils/assetAge'

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
  machineName: string
  machineBrand?: string
  section: string
  machineStatus?: string
  damageType: string
  status: string
  type?: string
  createdAt: string
  closedAt?: string
  causeOfDamage?: string
  repairsPerformed?: string
  actionType?: string
  replacedSpareParts?: string
  replacedPartsSpec?: string
  replacedPartsQty?: number
  totalDowntimeHours?: number
  technician?: string
}

interface ViewAssetModalProps {
  asset: Asset
  onClose: () => void
}

const healthLabels: Record<string, string> = {
  Running: 'Running Smoothly',
  Warning: 'Needs Attention',
  Breakdown: 'Out of Service',
}

function formatDateTime(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}

export function ViewAssetModal({ asset, onClose }: ViewAssetModalProps) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/api/work-orders'))
      .then((r) => r.json())
      .then((data: WorkOrder[]) => {
        const completed = (data || []).filter(
          (wo) => wo.status === 'Completed' && wo.machineName === asset.name
        )
        completed.sort((a, b) => (b.closedAt || b.createdAt).localeCompare(a.closedAt || a.createdAt))
        setWorkOrders(completed)
      })
      .catch(() => setWorkOrders([]))
      .finally(() => setLoading(false))
  }, [asset.name])

  const lastPmWo = workOrders.filter((wo) => wo.type === 'PM').sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''))[0]
  const lastPmDate = lastPmWo?.closedAt?.slice(0, 10) || asset.lastPmDate
  const sparePartsReplaced = workOrders.filter((wo) => wo.actionType === 'Replace' && (wo.replacedSpareParts || wo.replacedPartsSpec))

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-asset-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 720, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2 id="view-asset-title">Detail Asset — {asset.assetId}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Info dasar mesin */}
          <section className="wo-detail-section">
            <h3 className="wo-detail-section-title">Data Mesin</h3>
            <div className="wo-detail-grid">
              <div className="wo-detail-row">
                <span className="wo-detail-label">Asset ID</span>
                <span className="wo-detail-value">{asset.assetId}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Nama</span>
                <span className="wo-detail-value">{asset.name}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Section</span>
                <span className="wo-detail-value">{asset.section}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Health</span>
                <span className="wo-detail-value">{healthLabels[asset.health] ?? asset.health}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Uptime</span>
                <span className="wo-detail-value">{asset.uptimePercent}%</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Bulan & Tahun Instalasi</span>
                <span className="wo-detail-value muted">{formatBulanTahunInstalasi(asset.installedAt)}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Usia Mesin</span>
                <span className="wo-detail-value">{hitungUsiaMesin(asset.installedAt)}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Terakhir dilakukan PM</span>
                <span className="wo-detail-value muted">{lastPmDate || '—'}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Next PM</span>
                <span className="wo-detail-value muted">{asset.nextPmDate || '—'}</span>
              </div>
            </div>
          </section>

          {/* Riwayat perbaikan (dari WO Completed) */}
          <section className="wo-detail-section">
            <h3 className="wo-detail-section-title">Riwayat Perbaikan (dari Work Order Completed)</h3>
            {loading ? (
              <p style={{ color: '#64748b', margin: 0 }}>Memuat...</p>
            ) : workOrders.length === 0 ? (
              <p style={{ color: '#64748b', margin: 0 }}>Belum ada riwayat work order completed untuk mesin ini.</p>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem' }}>WO No</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Tanggal Selesai</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Jenis</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Deskripsi Kerusakan</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Tindakan Perbaikan</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Teknisi</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Downtime (jam)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((wo) => (
                      <tr key={wo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.woId}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.closedAt ? formatDateTime(wo.closedAt) : '—'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.type || '—'}</td>
                        <td style={{ padding: '0.5rem 0.75rem', maxWidth: 180 }} title={wo.damageType}>
                          {(wo.damageType || '—').slice(0, 50)}
                          {(wo.damageType?.length ?? 0) > 50 ? '…' : ''}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', maxWidth: 180 }} title={wo.repairsPerformed}>
                          {(wo.repairsPerformed || '—').slice(0, 50)}
                          {(wo.repairsPerformed?.length ?? 0) > 50 ? '…' : ''}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.technician || '—'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.totalDowntimeHours != null ? wo.totalDowntimeHours : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Spare part yang pernah diganti */}
          <section className="wo-detail-section">
            <h3 className="wo-detail-section-title">Spare Part yang Pernah Diganti (dari WO Completed)</h3>
            {loading ? (
              <p style={{ color: '#64748b', margin: 0 }}>Memuat...</p>
            ) : sparePartsReplaced.length === 0 ? (
              <p style={{ color: '#64748b', margin: 0 }}>Belum ada spare part yang diganti (jenis tindakan Replace) untuk mesin ini.</p>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem' }}>WO No</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Tanggal</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Nama Spare Part</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Spesifikasi</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sparePartsReplaced.map((wo) => (
                      <tr key={wo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.woId}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.closedAt ? wo.closedAt.slice(0, 10) : '—'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.replacedSpareParts || '—'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.replacedPartsSpec || '—'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{wo.replacedPartsQty != null ? wo.replacedPartsQty : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

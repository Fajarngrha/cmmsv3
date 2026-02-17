import { useEffect, useState } from 'react'
import { apiUrl } from '../api'

const JENIS_TINDAKAN_OPTIONS = [
  'Repair',
  'Replace',
  'Adjustment',
  'Inspection',
  'Cleaning',
  'Lubricating',
  'Overhaul',
  'Service Rutin',
] as const

interface PermintaanPerbaikanDetail {
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
  startedAt?: string
  closedAt?: string
  causeOfDamage?: string
  repairsPerformed?: string
  actionType?: string
  replacedSpareParts?: string
  replacedPartsSpec?: string
  replacedPartsQty?: number
  totalDowntimeHours?: number
  pendingReason?: string
  pmScheduledDate?: string
}

interface ViewPermintaanPerbaikanModalProps {
  permintaanPerbaikanId: string
  onClose: () => void
  onSuccess: () => void
}

const statusClass: Record<string, string> = {
  PM: 'badge-pm',
  Open: 'badge-open',
  Pending: 'badge-pending',
  'In Progress': 'badge-in-progress',
  Completed: 'badge-completed',
}

function formatDateTime(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium' })
}

export function ViewPermintaanPerbaikanModal({ permintaanPerbaikanId, onClose, onSuccess }: ViewPermintaanPerbaikanModalProps) {
  const [wo, setWo] = useState<PermintaanPerbaikanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [causeOfDamage, setCauseOfDamage] = useState('')
  const [repairsPerformed, setRepairsPerformed] = useState('')
  const [actionType, setActionType] = useState('')
  const [replacedSpareParts, setReplacedSpareParts] = useState('')
  const [replacedPartsSpec, setReplacedPartsSpec] = useState('')
  const [replacedPartsQty, setReplacedPartsQty] = useState<number | ''>('')
  const [technician, setTechnician] = useState('')
  const [closeError, setCloseError] = useState('')
  const [liveDowntime, setLiveDowntime] = useState<number | null>(null)
  const [newStatusChoice, setNewStatusChoice] = useState('')
  const [pmScheduledDate, setPmScheduledDate] = useState('')
  const [pendingReason, setPendingReason] = useState('')
  const [statusChangeError, setStatusChangeError] = useState('')

  const apiBase = `/api/permintaan-perbaikan/${permintaanPerbaikanId}`

  const fetchWo = () => {
    setLoading(true)
    setError('')
    fetch(apiUrl(apiBase))
      .then((r) => {
        if (!r.ok) throw new Error('Permintaan perbaikan tidak ditemukan')
        return r.json()
      })
      .then(setWo)
      .catch(() => setError('Gagal memuat permintaan perbaikan.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchWo()
  }, [permintaanPerbaikanId])

  useEffect(() => {
    if (!wo) return
    setCauseOfDamage(wo.causeOfDamage ?? '')
    setRepairsPerformed(wo.repairsPerformed ?? '')
    setActionType(wo.actionType ?? '')
    setReplacedSpareParts(wo.replacedSpareParts ?? '')
    setReplacedPartsSpec(wo.replacedPartsSpec ?? '')
    setReplacedPartsQty(wo.replacedPartsQty ?? '')
    setTechnician(wo.technician ?? '')
    setPmScheduledDate(wo.pmScheduledDate ?? '')
    setPendingReason(wo.pendingReason ?? '')
  }, [wo?.id])

  useEffect(() => {
    if (!wo || wo.status !== 'In Progress' || !wo.startedAt) {
      setLiveDowntime(null)
      return
    }
    const update = () => {
      const start = new Date(wo.startedAt!).getTime()
      const now = Date.now()
      setLiveDowntime(Math.round(((now - start) / (1000 * 60 * 60)) * 100) / 100)
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [wo?.id, wo?.status, wo?.startedAt])

  const patchStatus = (payload: { status: string; pendingReason?: string; pmScheduledDate?: string }) => {
    setStatusChangeError('')
    setActionLoading(true)
    fetch(apiUrl(apiBase), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed') })
        return r.json()
      })
      .then(() => {
        setNewStatusChoice('')
        setPmScheduledDate('')
        setPendingReason('')
        fetchWo()
        onSuccess()
      })
      .catch((err) => setStatusChangeError(err.message || 'Gagal mengubah status.'))
      .finally(() => setActionLoading(false))
  }

  const handleStatusToOpen = () => patchStatus({ status: 'Open' })
  const handleStatusToPending = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingReason.trim()) {
      setStatusChangeError('Alasan pending wajib diisi.')
      return
    }
    patchStatus({ status: 'Pending', pendingReason: pendingReason.trim() })
  }
  const handleStatusToPM = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pmScheduledDate.trim()) {
      setStatusChangeError('Tanggal PM wajib diisi.')
      return
    }
    patchStatus({ status: 'PM', pmScheduledDate: pmScheduledDate.trim() })
  }

  const handleCloseWo = (e: React.FormEvent) => {
    e.preventDefault()
    setCloseError('')
    if (!causeOfDamage.trim()) {
      setCloseError('Penyebab kerusakan wajib diisi.')
      return
    }
    if (!repairsPerformed.trim()) {
      setCloseError('Tindakan perbaikan wajib diisi.')
      return
    }
    if (!actionType) {
      setCloseError('Jenis tindakan wajib dipilih.')
      return
    }
    if (actionType === 'Replace' && !replacedSpareParts.trim()) {
      setCloseError('Nama sparepart wajib diisi ketika jenis tindakan Replace.')
      return
    }
    if (!technician.trim()) {
      setCloseError('Teknisi wajib diisi.')
      return
    }
    setActionLoading(true)
    fetch(apiUrl(apiBase), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Completed',
        causeOfDamage: causeOfDamage.trim(),
        repairsPerformed: repairsPerformed.trim(),
        actionType,
        replacedSpareParts: replacedSpareParts.trim() || undefined,
        replacedPartsSpec: replacedPartsSpec.trim() || undefined,
        replacedPartsQty: replacedPartsQty === '' ? undefined : Number(replacedPartsQty),
        technician: technician.trim(),
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Gagal menutup permintaan perbaikan')
        return r.json()
      })
      .then(() => {
        fetchWo()
        onSuccess()
      })
      .catch(() => setCloseError('Gagal menutup permintaan perbaikan.'))
      .finally(() => setActionLoading(false))
  }

  if (loading) {
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 id="view-pp-title">Lihat / Edit Permintaan perbaikan</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">×</button>
          </div>
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !wo) {
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 id="view-pp-title">Lihat / Edit Permintaan perbaikan</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">×</button>
          </div>
          <p style={{ padding: '2rem', color: '#ef4444' }}>{error || 'Permintaan perbaikan tidak ditemukan.'}</p>
        </div>
      </div>
    )
  }

  const canMarkInProgress = wo.status === 'Open'
  const canClose = wo.status === 'In Progress'
  const isCompleted = wo.status === 'Completed'

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-pp-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 id="view-pp-title">Lihat / Edit Permintaan perbaikan — {wo.woId}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          <section className="wo-detail-section">
            <h3 className="wo-detail-section-title">Informasi Permintaan perbaikan</h3>
            <div className="wo-detail-grid">
              <div className="wo-detail-row">
                <span className="wo-detail-label">No. Registrasi (Req)</span>
                <span className="wo-detail-value">{wo.woId}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Waktu</span>
                <span className="wo-detail-value muted">{formatDateTime(wo.createdAt)}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Status Saat Ini</span>
                <span className="wo-detail-value">
                  <span className={`badge ${statusClass[wo.status] ?? 'badge-open'}`}>{wo.status}</span>
                </span>
              </div>
              {wo.pmScheduledDate && (
                <div className="wo-detail-row">
                  <span className="wo-detail-label">Tanggal PM (jadwal)</span>
                  <span className="wo-detail-value muted">{wo.pmScheduledDate}</span>
                </div>
              )}
              {wo.pendingReason && (
                <div className="wo-detail-row full-width">
                  <span className="wo-detail-label">Pending karena</span>
                  <p className="wo-detail-value muted" style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{wo.pendingReason}</p>
                </div>
              )}
            </div>
          </section>

          <section className="wo-detail-section">
            <h3 className="wo-detail-section-title">Mesin & Lokasi</h3>
            <div className="wo-detail-grid">
              <div className="wo-detail-row">
                <span className="wo-detail-label">Nama Mesin</span>
                <span className="wo-detail-value">{wo.machineName}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Merk Mesin</span>
                <span className="wo-detail-value muted">{wo.machineBrand || '—'}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Section</span>
                <span className="wo-detail-value">{wo.section}</span>
              </div>
              <div className="wo-detail-row">
                <span className="wo-detail-label">Status Mesin</span>
                <span className="wo-detail-value muted">{wo.machineStatus || '—'}</span>
              </div>
            </div>
          </section>

          <section className="wo-detail-section">
            <h3 className="wo-detail-section-title">Deskripsi Kerusakan</h3>
            <div className="wo-detail-row full-width">
              <span className="wo-detail-label">Deskripsi Kerusakan</span>
              <p className="wo-detail-value muted" style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {wo.damageType || '—'}
              </p>
            </div>
          </section>

          {!isCompleted && (
            <section className="wo-detail-section" style={{ marginTop: 0 }}>
              <h3 className="wo-detail-section-title">Ubah Status (Tim Maintenance)</h3>
              <div className="form-group">
                <label className="label" htmlFor="newStatus">Status baru</label>
                <select
                  id="newStatus"
                  className="select"
                  value={newStatusChoice}
                  onChange={(e) => setNewStatusChoice(e.target.value)}
                >
                  <option value="">-- Pilih status --</option>
                  {wo.status !== 'Open' && <option value="Open">Open</option>}
                  {(wo.status === 'Open' || wo.status === 'Pending') && <option value="In Progress">In Progress</option>}
                  {(wo.status === 'Open' || wo.status === 'Pending') && <option value="PM">PM (jadwalkan Preventive Maintenance)</option>}
                  {(wo.status === 'Open' || wo.status === 'In Progress') && <option value="Pending">Pending (isi alasan)</option>}
                </select>
              </div>

              {newStatusChoice === 'Open' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <button type="button" className="btn btn-primary" onClick={handleStatusToOpen} disabled={actionLoading}>
                    {actionLoading ? 'Menyimpan...' : 'Set ke Open'}
                  </button>
                </div>
              )}

              {newStatusChoice === 'In Progress' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => patchStatus({ status: 'In Progress' })}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Menyimpan...' : 'Mark In Progress'}
                  </button>
                </div>
              )}

              {newStatusChoice === 'PM' && (
                <form onSubmit={handleStatusToPM} style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label className="label" htmlFor="pmDate">Tanggal PM *</label>
                    <input
                      id="pmDate"
                      type="date"
                      className="input"
                      value={pmScheduledDate}
                      onChange={(e) => setPmScheduledDate(e.target.value)}
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    Permintaan perbaikan akan masuk ke jadwal Preventive Maintenance dengan tanggal di atas.
                  </p>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Menyimpan...' : 'Jadwalkan PM'}
                  </button>
                </form>
              )}

              {newStatusChoice === 'Pending' && (
                <form onSubmit={handleStatusToPending} style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label className="label" htmlFor="pendingReason">Pending karena apa? *</label>
                    <textarea
                      id="pendingReason"
                      className="textarea"
                      value={pendingReason}
                      onChange={(e) => setPendingReason(e.target.value)}
                      rows={3}
                      placeholder="Jelaskan alasan permintaan perbaikan ditunda (misal: menunggu spare part, menunggu approval, dll.)"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Menyimpan...' : 'Simpan status Pending'}
                  </button>
                </form>
              )}

              {statusChangeError && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#fee2e2', borderRadius: 6, fontSize: '0.9rem' }}>
                  {statusChangeError}
                </div>
              )}
            </section>
          )}

          {(canMarkInProgress || canClose) && (
            <div className="modal-info" style={{ marginBottom: '1rem' }}>
              <strong>Tutup permintaan perbaikan:</strong> Jika status In Progress, isi form penutupan di bawah (Penyebab kerusakan, Tindakan perbaikan, Jenis tindakan, Teknisi). Total downtime dihitung otomatis.
            </div>
          )}

          {canClose && (
            <form onSubmit={handleCloseWo} style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Form Penutupan — Tim Maintenance</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                Isi detail penutupan. Total downtime dihitung otomatis dari In Progress hingga Submit/Tutup.
              </p>
              <div className="form-group">
                <label className="label" htmlFor="cause">Penyebab kerusakan *</label>
                <textarea
                  id="cause"
                  className="textarea"
                  value={causeOfDamage}
                  onChange={(e) => setCauseOfDamage(e.target.value)}
                  rows={3}
                  placeholder="Jelaskan penyebab kerusakan"
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="repairs">Tindakan perbaikan *</label>
                <textarea
                  id="repairs"
                  className="textarea"
                  value={repairsPerformed}
                  onChange={(e) => setRepairsPerformed(e.target.value)}
                  rows={3}
                  placeholder="Jelaskan tindakan perbaikan yang dilakukan"
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="actionType">Jenis tindakan *</label>
                <select
                  id="actionType"
                  className="select"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                >
                  <option value="">-- Pilih Jenis Tindakan --</option>
                  {JENIS_TINDAKAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {actionType === 'Replace' && (
                <>
                  <div className="form-group">
                    <label className="label" htmlFor="replaced">Nama sparepart *</label>
                    <input
                      id="replaced"
                      className="input"
                      value={replacedSpareParts}
                      onChange={(e) => setReplacedSpareParts(e.target.value)}
                      placeholder="e.g. Ball Bearing 6205"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label" htmlFor="spec">Spesifikasi sparepart</label>
                    <input
                      id="spec"
                      className="input"
                      value={replacedPartsSpec}
                      onChange={(e) => setReplacedPartsSpec(e.target.value)}
                      placeholder="e.g. 25mm ID, 52mm OD"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label" htmlFor="qty">Qty</label>
                    <input
                      id="qty"
                      className="input"
                      type="number"
                      min={0}
                      value={replacedPartsQty}
                      onChange={(e) => setReplacedPartsQty(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="label" htmlFor="tech">Teknisi *</label>
                <input
                  id="tech"
                  className="input"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="e.g. Ahmad"
                />
              </div>
              <div className="form-group">
                <span className="label">Total downtime</span>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                  {liveDowntime != null ? `${liveDowntime} jam` : '—'}
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Dihitung otomatis dari In Progress ({formatDateTime(wo.startedAt)}) hingga Submit. Akan final setelah permintaan perbaikan ditutup.
                </p>
              </div>
              {closeError && (
                <div style={{ padding: '0.5rem', background: '#fee2e2', borderRadius: 6, marginBottom: '1rem', fontSize: '0.9rem' }}>
                  {closeError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Menyimpan...' : 'Tutup Permintaan perbaikan'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
              </div>
            </form>
          )}

          {isCompleted && (
            <section className="wo-detail-section" style={{ marginTop: '1.25rem' }}>
              <h3 className="wo-detail-section-title">Detail penutupan (Tim Maintenance)</h3>
              <div className="wo-detail-grid">
                <div className="wo-detail-row full-width">
                  <span className="wo-detail-label">Penyebab kerusakan</span>
                  <p className="wo-detail-value muted" style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{wo.causeOfDamage || '—'}</p>
                </div>
                <div className="wo-detail-row full-width">
                  <span className="wo-detail-label">Tindakan perbaikan</span>
                  <p className="wo-detail-value muted" style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{wo.repairsPerformed || '—'}</p>
                </div>
                <div className="wo-detail-row">
                  <span className="wo-detail-label">Jenis tindakan</span>
                  <span className="wo-detail-value">{wo.actionType || '—'}</span>
                </div>
                <div className="wo-detail-row">
                  <span className="wo-detail-label">Teknisi</span>
                  <span className="wo-detail-value muted">{wo.technician || '—'}</span>
                </div>
                {(wo.replacedSpareParts || wo.replacedPartsSpec || wo.replacedPartsQty != null) && (
                  <>
                    <div className="wo-detail-row">
                      <span className="wo-detail-label">Nama sparepart</span>
                      <span className="wo-detail-value muted">{wo.replacedSpareParts || '—'}</span>
                    </div>
                    <div className="wo-detail-row">
                      <span className="wo-detail-label">Spesifikasi</span>
                      <span className="wo-detail-value muted">{wo.replacedPartsSpec || '—'}</span>
                    </div>
                    <div className="wo-detail-row">
                      <span className="wo-detail-label">Qty</span>
                      <span className="wo-detail-value">{wo.replacedPartsQty ?? '—'}</span>
                    </div>
                  </>
                )}
                <div className="wo-detail-row full-width">
                  <span className="wo-detail-label">Total downtime</span>
                  <span className="wo-detail-value" style={{ fontWeight: 600 }}>
                    {wo.totalDowntimeHours != null ? `${wo.totalDowntimeHours} jam` : '—'}
                  </span>
                  {wo.startedAt && wo.closedAt && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Dari {formatDateTime(wo.startedAt)} hingga {formatDateTime(wo.closedAt)}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#fee2e2', borderRadius: 6, fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
